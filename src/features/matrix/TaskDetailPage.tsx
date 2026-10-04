import { ArrowLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageTransition } from '@/components/PageTransition'
import { tasksApi } from '@/lib/api'
import { TaskDetailContent } from './TaskDetailPanel'
import { TaskFormModal, type TaskFormValues } from './TaskFormModal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/Toast'
import { apiErrorMessage } from '@/lib/api'

/** Ruta /tasks/:id — detalle de tarea en página completa. */
export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)

  const taskQuery = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!),
    enabled: Boolean(id),
  })

  const updateTask = useMutation({
    mutationFn: (values: TaskFormValues) =>
      tasksApi.update(id!, {
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim() || null,
        cuadrante: values.cuadrante,
        fechaLimite: values.fechaLimite ? new Date(values.fechaLimite).toISOString() : null,
        tiempoEstimadoMin: values.tiempoEstimadoMin ? Number(values.tiempoEstimadoMin) : null,
        proyectoId: values.proyectoId || null,
      }),
    onSuccess: () => {
      toast.success('Tarea actualizada')
      setEditOpen(false)
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/matrix"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a la matriz
          </Link>
          {taskQuery.data && (
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </div>

        <Card className="p-5 sm:p-6">
          {id && <TaskDetailContent taskId={id} onDeleted={() => navigate('/matrix')} />}
        </Card>
      </div>

      {taskQuery.data && (
        <TaskFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          initialTask={taskQuery.data}
          submitting={updateTask.isPending}
          onSubmit={(values) => updateTask.mutate(values)}
        />
      )}
    </PageTransition>
  )
}
