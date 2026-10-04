import { useDraggable } from '@dnd-kit/core'
import { memo } from 'react'
import { CalendarDays, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { cn, formatDate, isOverdue, quadrantConfig } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface CardProps {
  task: Task
  onSelect: (task: Task) => void
  onDelete: (task: Task) => void
  onComplete: (task: Task) => void
}

// Presentación pura: la usan tanto la tarjeta arrastrable como el DragOverlay.
function CardBody({ task, onSelect, onDelete, onComplete, elevated }: CardProps & { elevated?: boolean }) {
  const quad = quadrantConfig(task.cuadrante)
  const overdue = isOverdue(task.fechaLimite) && task.estado !== 'completada'
  const done = task.estado === 'completada'

  return (
    <div
      onClick={() => onSelect(task)}
      className={cn(
        'group cursor-pointer rounded-xl border border-l-4 bg-white p-3',
        elevated
          ? 'shadow-[0_10px_30px_-8px_rgba(76,111,255,0.5)]'
          : 'shadow-sm hover:shadow-md',
        'dark:bg-white/6 dark:hover:bg-white/9',
        quad.border,
        done && 'opacity-60',
      )}
      style={{ borderLeftColor: quad.hex }}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm font-semibold text-slate-700 dark:text-slate-200',
            done && 'line-through',
          )}
        >
          {task.titulo}
        </p>
        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!done && (
            <button
              aria-label="Completar tarea"
              onClick={(e) => {
                e.stopPropagation()
                onComplete(task)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-slate-400 hover:bg-secondary/15 hover:text-secondary"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          <button
            aria-label="Eliminar tarea"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded-md p-1 text-slate-400 hover:bg-danger/15 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
        {task.fechaLimite && (
          <span className={cn('inline-flex items-center gap-1', overdue && 'font-bold text-danger')}>
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(task.fechaLimite)}
          </span>
        )}
        {task.tiempoEstimadoMin != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {task.tiempoEstimadoMin} min
          </span>
        )}
        {task.microTareas.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {task.microTareas.filter((s) => s.completada).length}/{task.microTareas.length}
          </span>
        )}
      </div>
    </div>
  )
}

type TaskCardProps = CardProps

export const TaskCard = memo(function TaskCard({
  task,
  onSelect,
  onDelete,
  onComplete,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { cuadrante: task.cuadrante, type: 'task' },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isDragging && 'opacity-40')}
    >
      <CardBody
        task={task}
        onSelect={onSelect}
        onDelete={onDelete}
        onComplete={onComplete}
      />
    </div>
  )
})

// Copia sin hooks de arrastre para mostrarla siguiendo el dedo durante el drag.
export const TaskCardOverlay = memo(function TaskCardOverlay({ task }: { task: Task }) {
  const noop = () => {}
  return (
    <div className="w-64 rotate-2">
      <CardBody
        task={task}
        onSelect={noop}
        onDelete={noop}
        onComplete={noop}
        elevated
      />
    </div>
  )
})
