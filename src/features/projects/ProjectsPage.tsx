import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FolderKanban, FolderPlus, ListTodo, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Input, Select } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { SkeletonCard } from '@/components/Skeleton'
import { TextArea } from '@/components/TextArea'
import { useToast } from '@/components/Toast'
import { useErrorToast } from '@/hooks/useErrorToast'
import { apiErrorMessage, projectsApi } from '@/lib/api'
import type { Project, ProjectStatus } from '@/lib/types'
import { PROJECT_STATUS, formatDate } from '@/lib/utils'

interface ProjectFormValues {
  titulo: string
  descripcion: string
  estado: ProjectStatus
}

function ProjectFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: ProjectFormValues) => void
  initial: Project | null
  submitting: boolean
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState<ProjectStatus>('activo')
  const [error, setError] = useState<string | null>(null)

  // Sincroniza el formulario al abrir
  const [lastOpen, setLastOpen] = useState(false)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setTitulo(initial?.titulo ?? '')
      setDescripcion(initial?.descripcion ?? '')
      setEstado(initial?.estado ?? 'activo')
      setError(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar proyecto' : 'Nuevo proyecto'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="project-form"
            loading={submitting}
          >
            {initial ? 'Guardar' : 'Crear proyecto'}
          </Button>
        </>
      }
    >
      <form
        id="project-form"
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (titulo.trim().length < 2) {
            setError('El título es obligatorio (mínimo 2 caracteres)')
            return
          }
          onSubmit({ titulo: titulo.trim(), descripcion: descripcion.trim(), estado })
        }}
      >
        <Input
          label="Título *"
          placeholder="Ej. Lanzamiento v2"
          value={titulo}
          error={error ?? undefined}
          onChange={(e) => setTitulo(e.target.value)}
          autoFocus
        />
        <TextArea
          label="Descripción"
          placeholder="Objetivo del proyecto…"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        {initial && (
          <Select
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as ProjectStatus)}
          >
            {(Object.keys(PROJECT_STATUS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS[s].label}
              </option>
            ))}
          </Select>
        )}
      </form>
    </Modal>
  )
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  })
  useErrorToast(projectsQuery.error, 'projects-list')

  const createProject = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      projectsApi.create({
        titulo: values.titulo,
        descripcion: values.descripcion || undefined,
      }),
    onSuccess: () => {
      toast.success('Proyecto creado')
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo crear el proyecto')),
  })

  const updateProject = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      projectsApi.update(id, values),
    onSuccess: () => {
      toast.success('Proyecto actualizado')
      setFormOpen(false)
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo actualizar el proyecto')),
  })

  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      toast.success('Proyecto eliminado')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(apiErrorMessage(err, 'No se pudo eliminar el proyecto'))
    },
  })

  const projects = projectsQuery.data ?? []

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Proyectos
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Agrupa tus tareas por objetivo.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <FolderPlus className="h-4 w-4" /> Nuevo proyecto
          </Button>
        </div>

        {projectsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="min-h-36" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="py-6">
            <EmptyState
              icon={<FolderKanban className="h-7 w-7" />}
              title="Aún no tienes proyectos"
              description="Crea tu primer proyecto para organizar tus tareas por objetivos."
              action={
                <Button onClick={() => setFormOpen(true)}>
                  <FolderPlus className="h-4 w-4" /> Crear proyecto
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const status = PROJECT_STATUS[p.estado]
              return (
                <StaggerItem key={p.id} index={i}>
                  <Card hoverable className="flex h-full flex-col p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Link to={`/projects/${p.id}`} className="min-w-0">
                        <motion.h3
                          whileHover={{ x: 2 }}
                          className="truncate text-base font-bold text-slate-800 hover:text-primary dark:text-slate-100"
                        >
                          {p.titulo}
                        </motion.h3>
                      </Link>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                    <p className="line-clamp-2 flex-1 text-sm text-slate-500 dark:text-slate-400">
                      {p.descripcion || 'Sin descripción'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 dark:border-white/10">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <ListTodo className="h-3.5 w-3.5" />
                        {p._count?.tareas ?? 0} tareas · {formatDate(p.creadoEn)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          aria-label="Editar proyecto"
                          onClick={() => {
                            setEditing(p)
                            setFormOpen(true)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          aria-label="Eliminar proyecto"
                          onClick={() => setDeleting(p)}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </StaggerItem>
              )
            })}
          </div>
        )}
      </div>

      <ProjectFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        initial={editing}
        submitting={createProject.isPending || updateProject.isPending}
        onSubmit={(values) => {
          if (editing) {
            updateProject.mutate({ id: editing.id, values })
          } else {
            createProject.mutate(values)
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar proyecto"
        message={`¿Seguro que deseas eliminar "${deleting?.titulo ?? ''}"? Sus tareas quedarán sin proyecto.`}
        confirmLabel="Eliminar"
        loading={deleteProject.isPending}
        onConfirm={() => deleting && deleteProject.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </PageTransition>
  )
}
