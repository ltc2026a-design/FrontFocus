import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { TextArea } from '@/components/TextArea'
import { projectsApi } from '@/lib/api'
import type { Quadrant, Task } from '@/lib/types'
import { QUADRANTS, cn } from '@/lib/utils'

export interface TaskFormValues {
  titulo: string
  descripcion: string
  fechaLimite: string
  tiempoEstimadoMin: string
  cuadrante: Quadrant
  proyectoId: string
}

const emptyForm: TaskFormValues = {
  titulo: '',
  descripcion: '',
  fechaLimite: '',
  tiempoEstimadoMin: '',
  cuadrante: 'no_urgente_importante',
  proyectoId: '',
}

function toForm(task: Task): TaskFormValues {
  return {
    titulo: task.titulo,
    descripcion: task.descripcion ?? '',
    fechaLimite: task.fechaLimite
      ? new Date(task.fechaLimite).toISOString().slice(0, 16)
      : '',
    tiempoEstimadoMin: task.tiempoEstimadoMin != null ? String(task.tiempoEstimadoMin) : '',
    cuadrante: task.cuadrante,
    proyectoId: task.proyectoId ?? '',
  }
}

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void
  /** Si se pasa, el modal edita la tarea en vez de crear una nueva. */
  initialTask?: Task | null
  initialQuadrant?: Quadrant
  submitting?: boolean
}

export function TaskFormModal({
  open,
  onClose,
  onSubmit,
  initialTask,
  initialQuadrant,
  submitting = false,
}: TaskFormModalProps) {
  const [form, setForm] = useState<TaskFormValues>(emptyForm)
  const [titleError, setTitleError] = useState<string | null>(null)

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    setTitleError(null)
    if (initialTask) {
      setForm(toForm(initialTask))
    } else {
      setForm({ ...emptyForm, cuadrante: initialQuadrant ?? emptyForm.cuadrante })
    }
  }, [open, initialTask, initialQuadrant])

  const set = (patch: Partial<TaskFormValues>) => setForm((f) => ({ ...f, ...patch }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.titulo.trim().length < 2) {
      setTitleError('El título es obligatorio (mínimo 2 caracteres)')
      return
    }
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialTask ? 'Editar tarea' : 'Nueva tarea'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} type="button" disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" loading={submitting}>
            {initialTask ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Título *"
          placeholder="¿Qué hay que hacer?"
          value={form.titulo}
          error={titleError ?? undefined}
          onChange={(e) => set({ titulo: e.target.value })}
          autoFocus
        />
        <TextArea
          label="Descripción"
          placeholder="Detalles opcionales…"
          value={form.descripcion}
          onChange={(e) => set({ descripcion: e.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Fecha límite"
            type="datetime-local"
            value={form.fechaLimite}
            onChange={(e) => set({ fechaLimite: e.target.value })}
          />
          <Input
            label="Tiempo estimado (min)"
            type="number"
            min={0}
            placeholder="45"
            value={form.tiempoEstimadoMin}
            onChange={(e) => set({ tiempoEstimadoMin: e.target.value })}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">Cuadrante</p>
          <div className="grid grid-cols-2 gap-2">
            {QUADRANTS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => set({ cuadrante: q.id })}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-150',
                  form.cuadrante === q.id
                    ? cn(q.bg, q.border, q.text, 'shadow-md')
                    : 'border-slate-200 text-slate-500 hover:bg-black/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5',
                )}
              >
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', q.dot)} />
                <span className="truncate">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Select
          label="Proyecto (opcional)"
          value={form.proyectoId}
          onChange={(e) => set({ proyectoId: e.target.value })}
        >
          <option value="">Sin proyecto</option>
          {(projectsQuery.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  )
}
