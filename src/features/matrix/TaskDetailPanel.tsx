import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Circle, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Spinner } from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import { apiErrorCode, apiErrorMessage, subtasksApi, tasksApi } from '@/lib/api'
import type { Subtask, Task } from '@/lib/types'
import { TASK_STATUS, cn, formatDate, formatMinutes, quadrantConfig } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Fila de micro-tarea reordenable
// ---------------------------------------------------------------------------

function SubtaskRow({
  subtask,
  onToggle,
  onDelete,
}: {
  subtask: Subtask
  onToggle: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-transparent bg-white/50 px-2 py-1.5 dark:bg-white/5',
        isDragging && 'z-10 border-primary/40 shadow-lg',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Reordenar micro-tarea"
        className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button onClick={onToggle} aria-label={subtask.completada ? 'Marcar pendiente' : 'Completar'} className="shrink-0">
        {subtask.completada ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-secondary" />
        ) : (
          <Circle className="h-4.5 w-4.5 text-slate-300 transition-colors hover:text-primary dark:text-slate-600" />
        )}
      </button>
      <span
        className={cn(
          'flex-1 text-sm text-slate-600 dark:text-slate-300',
          subtask.completada && 'text-slate-400 line-through dark:text-slate-500',
        )}
      >
        {subtask.titulo}
      </span>
      <button
        onClick={onDelete}
        aria-label="Eliminar micro-tarea"
        className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100 dark:text-slate-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detalle de tarea (contenido compartido por drawer y página)
// ---------------------------------------------------------------------------

export function TaskDetailContent({
  taskId,
  onDeleted,
}: {
  taskId: string
  /** Callback tras borrar o completar la tarea padre. */
  onDeleted?: () => void
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [newSubtask, setNewSubtask] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId),
  })
  const task = taskQuery.data

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const subtasks = [...(task?.microTareas ?? [])].sort((a, b) => a.orden - b.orden)
  const done = subtasks.filter((s) => s.completada).length
  const progress = subtasks.length > 0 ? Math.round((done / subtasks.length) * 100) : 0

  useEffect(() => {
    if (taskQuery.error) {
      toast.error(apiErrorMessage(taskQuery.error, 'No se pudo cargar la tarea'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskQuery.error])

  const toggleSubtask = useMutation({
    mutationFn: ({ id, completada }: { id: string; completada: boolean }) =>
      subtasksApi.update(id, { completada }),
    onMutate: async ({ id, completada }) => {
      await queryClient.cancelQueries({ queryKey: ['task', taskId] })
      const previous = queryClient.getQueryData<Task>(['task', taskId])
      if (previous) {
        queryClient.setQueryData<Task>(['task', taskId], {
          ...previous,
          microTareas: previous.microTareas.map((s) =>
            s.id === id ? { ...s, completada } : s,
          ),
        })
      }
      return { previous }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['task', taskId], ctx.previous)
      const code = apiErrorCode(err)
      toast.error(
        code === 'PARENT_DELETED'
          ? 'La tarea padre está eliminada; no se puede completar la micro-tarea.'
          : apiErrorMessage(err),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const addSubtask = useMutation({
    mutationFn: (titulo: string) => subtasksApi.create(taskId, titulo),
    onSuccess: () => {
      setNewSubtask('')
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo agregar la micro-tarea')),
  })

  const deleteSubtask = useMutation({
    mutationFn: (id: string) => subtasksApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const reorder = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !task) return
    const oldIndex = subtasks.findIndex((s) => s.id === active.id)
    const newIndex = subtasks.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(subtasks, oldIndex, newIndex)

    // Optimistic en caché
    queryClient.setQueryData<Task>(['task', taskId], {
      ...task,
      microTareas: reordered.map((s, i) => ({ ...s, orden: i })),
    })
    try {
      const updates = reordered
        .map((s, i) => ({ subtask: s, newOrden: i }))
        .filter(({ subtask, newOrden }) => subtask.orden !== newOrden)
        .map(({ subtask, newOrden }) => subtasksApi.update(subtask.id, { orden: newOrden }))
      await Promise.all(updates)
    } catch (err) {
      queryClient.setQueryData(['task', taskId], task)
      toast.error(apiErrorMessage(err, 'No se pudo reordenar'))
    } finally {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    }
  }

  const completeTask = useMutation({
    mutationFn: () => tasksApi.update(taskId, { estado: 'completada' }),
    onSuccess: () => {
      toast.success('¡Tarea completada! Buen trabajo.')
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
      onDeleted?.()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const deleteTask = useMutation({
    mutationFn: () => tasksApi.remove(taskId),
    onSuccess: () => {
      toast.success('Tarea eliminada')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.removeQueries({ queryKey: ['task', taskId] })
      setConfirmDelete(false)
      onDeleted?.()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  if (taskQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner className="h-7 w-7" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="p-6 text-center text-sm text-slate-400">
        No se pudo cargar la tarea. Es posible que haya sido eliminada.
      </div>
    )
  }

  const quad = quadrantConfig(task.cuadrante)
  const status = TASK_STATUS[task.estado]

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className={quad.badge}>
            <span className={cn('h-2 w-2 rounded-full', quad.dot)} />
            {quad.label}
          </Badge>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{task.titulo}</h2>
        {task.descripcion && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.descripcion}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
          {task.fechaLimite && <span>Límite: {formatDate(task.fechaLimite)}</span>}
          {task.tiempoEstimadoMin != null && (
            <span>Estimado: {formatMinutes(task.tiempoEstimadoMin)}</span>
          )}
        </div>
      </div>

      {/* Progreso de micro-tareas */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Micro-tareas</span>
          <span className={cn(subtasks.length > 0 && 'text-primary')}>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Lista reordenable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => void reorder(e)}
      >
        <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {subtasks.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  <SubtaskRow
                    subtask={s}
                    onToggle={() => toggleSubtask.mutate({ id: s.id, completada: !s.completada })}
                    onDelete={() => deleteSubtask.mutate(s.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {subtasks.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">
                Aún no hay micro-tareas. Divide esta tarea en pasos pequeños.
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Input inline para agregar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const title = newSubtask.trim()
          if (title.length < 1) return
          addSubtask.mutate(title)
        }}
        className="flex items-center gap-2"
      >
        <input
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Agregar micro-tarea y presionar Enter…"
          className="h-9 flex-1 rounded-lg border border-slate-200 bg-white/60 px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        />
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          aria-label="Agregar micro-tarea"
          loading={addSubtask.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 border-t border-slate-200/60 pt-4 dark:border-white/10">
        {task.estado !== 'completada' && (
          <Button variant="secondary" onClick={() => completeTask.mutate()} loading={completeTask.isPending}>
            <CheckCircle2 className="h-4 w-4" /> Completar tarea
          </Button>
        )}
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Eliminar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar tarea"
        message={`Se eliminará "${task.titulo}" y sus micro-tareas dejarán de estar disponibles. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleteTask.isPending}
        onConfirm={() => deleteTask.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drawer lateral (usado en la Matriz)
// ---------------------------------------------------------------------------

export function TaskDetailDrawer({
  taskId,
  onClose,
}: {
  taskId: string | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {taskId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px]"
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-label="Detalle de tarea"
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4 dark:border-white/10">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Detalle de tarea</p>
              <button
                onClick={onClose}
                aria-label="Cerrar panel"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <TaskDetailContent taskId={taskId} onDeleted={onClose} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
