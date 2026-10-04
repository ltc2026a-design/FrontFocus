import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Grid2X2, Plus } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition } from '@/components/PageTransition'
import { SkeletonCard } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useErrorToast } from '@/hooks/useErrorToast'
import { apiErrorMessage, tasksApi } from '@/lib/api'
import type { Quadrant, Task } from '@/lib/types'
import { QUADRANTS, cn } from '@/lib/utils'
import { TaskCard, TaskCardOverlay } from './TaskCard'
import { TaskDetailDrawer } from './TaskDetailPanel'
import { TaskFormModal, type TaskFormValues } from './TaskFormModal'

// ---------------------------------------------------------------------------
// Cuadrante droppable
// ---------------------------------------------------------------------------

const QuadrantColumn = memo(function QuadrantColumn({
  quadrantId,
  label,
  tasks,
  onSelect,
  onDelete,
  onComplete,
  onAdd,
}: {
  quadrantId: Quadrant
  label: string
  tasks: Task[]
  onSelect: (t: Task) => void
  onDelete: (t: Task) => void
  onComplete: (t: Task) => void
  onAdd: (q: Quadrant) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrantId })
  const config = QUADRANTS.find((q) => q.id === quadrantId)!

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-64 flex-col rounded-2xl border bg-white/40 p-3 transition-colors duration-150 dark:bg-white/3',
        config.border,
        isOver && cn(config.bg, 'border-2'),
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', config.dot)} />
          <h2 className={cn('text-sm font-bold', config.text)}>{label}</h2>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-white/10">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(quadrantId)}
          aria-label={`Nueva tarea en ${label}`}
          className={cn(
            'rounded-lg p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10',
            config.text,
          )}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={onSelect}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        ))}
        {tasks.length === 0 && (
          <p className="flex h-16 items-center justify-center rounded-xl border border-dashed border-slate-300/50 text-xs text-slate-400 dark:border-white/10">
            Suelta tareas aquí
          </p>
        )}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Página Matriz de Eisenhower
// ---------------------------------------------------------------------------

export function MatrixPage() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formQuadrant, setFormQuadrant] = useState<Quadrant>('no_urgente_importante')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  })
  useErrorToast(tasksQuery.error, 'matrix-tasks')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    // Sensor de teclado: permite levantar/soltar tarjetas con Espacio y
    // moverlas con las flechas (accesibilidad sin ratón ni táctil).
    useSensor(KeyboardSensor),
  )

  const tasks = useMemo(
    () =>
      (tasksQuery.data ?? [])
        .filter((t) => t.estado !== 'eliminada')
        .slice()
        .sort((a, b) => {
          // Completadas al final
          const ac = a.estado === 'completada' ? 1 : 0
          const bc = b.estado === 'completada' ? 1 : 0
          return ac - bc
        }),
    [tasksQuery.data],
  )

  // Agrupar una sola vez por render: sin esto cada cuadrante filtraba la lista
  // completa en cada re-render y se deshacía el memo de las tarjetas.
  const tasksByQuadrant = useMemo(() => {
    const map = new Map<Quadrant, Task[]>()
    for (const q of QUADRANTS) map.set(q.id, [])
    for (const t of tasks) map.get(t.cuadrante)?.push(t)
    return map
  }, [tasks])

  const moveTask = useMutation({
    mutationFn: ({ id, cuadrante }: { id: string; cuadrante: Quadrant }) =>
      tasksApi.update(id, { cuadrante }),
    onError: (err) => {
      // Revertir el optimistic update y avisar
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.error(apiErrorMessage(err, 'No se pudo mover la tarea'))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const createTask = useMutation({
    mutationFn: (values: TaskFormValues) =>
      tasksApi.create({
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim() || undefined,
        cuadrante: values.cuadrante,
        fechaLimite: values.fechaLimite ? new Date(values.fechaLimite).toISOString() : undefined,
        tiempoEstimadoMin: values.tiempoEstimadoMin
          ? Number(values.tiempoEstimadoMin)
          : undefined,
        proyectoId: values.proyectoId || undefined,
      }),
    onSuccess: () => {
      toast.success('Tarea creada')
      setFormOpen(false)
      setEditingTask(null)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo crear la tarea')),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TaskFormValues }) =>
      tasksApi.update(id, {
        titulo: values.titulo.trim(),
        descripcion: values.descripcion.trim() || null,
        cuadrante: values.cuadrante,
        fechaLimite: values.fechaLimite ? new Date(values.fechaLimite).toISOString() : null,
        tiempoEstimadoMin: values.tiempoEstimadoMin ? Number(values.tiempoEstimadoMin) : null,
        proyectoId: values.proyectoId || null,
      }),
    onSuccess: () => {
      toast.success('Tarea actualizada')
      setFormOpen(false)
      setEditingTask(null)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', editingTask?.id] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo actualizar la tarea')),
  })

  const completeTask = useMutation({
    mutationFn: (id: string) => tasksApi.update(id, { estado: 'completada' }),
    onSuccess: () => {
      toast.success('¡Tarea completada!')
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['metrics'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      toast.success('Tarea eliminada')
      setDeletingTask(null)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => {
      setDeletingTask(null)
      toast.error(apiErrorMessage(err, 'No se pudo eliminar la tarea'))
    },
  })

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const onDragCancel = useCallback(() => setActiveId(null), [])

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) ?? null,
    [tasks, activeId],
  )

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const taskId = String(active.id)
    const targetQuadrant = String(over.id) as Quadrant
    const sourceQuadrant = active.data.current?.cuadrante as Quadrant | undefined
    if (!sourceQuadrant || sourceQuadrant === targetQuadrant) return

    // Optimistic update en caché; moveTask.onError revierte con invalidate.
    const previous = queryClient.getQueryData<Task[]>(['tasks'])
    if (previous) {
      queryClient.setQueryData<Task[]>(
        ['tasks'],
        previous.map((t) => (t.id === taskId ? { ...t, cuadrante: targetQuadrant } : t)),
      )
    }
    moveTask.mutate({ id: taskId, cuadrante: targetQuadrant })
  }

  const openNew = useCallback((quadrant: Quadrant) => {
    setEditingTask(null)
    setFormQuadrant(quadrant)
    setFormOpen(true)
  }, [])

  // Identidades estables: sin esto el memo de TaskCard/QuadrantColumn no sirve.
  const onSelectTask = useCallback((t: Task) => setSelectedTaskId(t.id), [])
  const onDeleteTask = useCallback((t: Task) => setDeletingTask(t), [])
  const completeTaskMutate = completeTask.mutate
  const onCompleteTask = useCallback((t: Task) => completeTaskMutate(t.id), [completeTaskMutate])

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Matriz de Eisenhower
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Arrastra las tareas entre cuadrantes para repriorizar.
            </p>
          </div>
          <Button onClick={() => openNew('no_urgente_importante')}>
            <Plus className="h-4 w-4" /> Nueva tarea
          </Button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} className="min-h-52" />
            ))}
          </div>
        ) : tasksQuery.error ? (
          <EmptyState
            icon={<Grid2X2 className="h-7 w-7" />}
            title="No se pudo cargar la matriz"
            description="Verifica tu conexión con el servidor e inténtalo de nuevo."
            action={
              <Button variant="secondary" onClick={() => void tasksQuery.refetch()}>
                Reintentar
              </Button>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {QUADRANTS.map((q) => (
                <QuadrantColumn
                  key={q.id}
                  quadrantId={q.id}
                  label={q.label}
                  tasks={tasksByQuadrant.get(q.id) ?? []}
                  onSelect={onSelectTask}
                  onDelete={onDeleteTask}
                  onComplete={onCompleteTask}
                  onAdd={openNew}
                />
              ))}
            </div>
            {/* La copia que sigue al dedo: evita re-renderizar las columnas */}
            <DragOverlay dropAnimation={null}>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Drawer de detalle */}
      <TaskDetailDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />

      {/* Modal crear/editar */}
      <TaskFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingTask(null)
        }}
        initialTask={editingTask}
        initialQuadrant={formQuadrant}
        submitting={createTask.isPending || updateTask.isPending}
        onSubmit={(values) => {
          if (editingTask) {
            updateTask.mutate({ id: editingTask.id, values })
          } else {
            createTask.mutate(values)
          }
        }}
      />

      {/* Confirmación de borrado */}
      <ConfirmDialog
        open={deletingTask !== null}
        title="Eliminar tarea"
        message={`¿Seguro que deseas eliminar "${deletingTask?.titulo ?? ''}"? Se marcará como eliminada.`}
        confirmLabel="Eliminar"
        loading={deleteTask.isPending}
        onConfirm={() => deletingTask && deleteTask.mutate(deletingTask.id)}
        onCancel={() => setDeletingTask(null)}
      />

      <AnimatePresence>
        {activeId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-primary/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg md:bottom-6"
          >
            Suelta en otro cuadrante para mover la tarea
          </motion.p>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
