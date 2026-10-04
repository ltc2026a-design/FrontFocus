import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarClock, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useErrorToast } from '@/hooks/useErrorToast'
import { apiErrorMessage, tasksApi, timeblocksApi } from '@/lib/api'
import type { Task, TimeBlock } from '@/lib/types'
import { cn, quadrantConfig, toDateInput } from '@/lib/utils'

const START_HOUR = 6
const END_HOUR = 23 // última etiqueta; los bloques empiezan entre 6:00 y 22:00

/** Array vacío estable para los `?? []`: evita que los useMemo se recalculen. */
const NO_BLOCKS: TimeBlock[] = []

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

function parseHour(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

function toHHMM(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Chip de tarea sin bloquear (arrastrable a la agenda)
// ---------------------------------------------------------------------------

function UnassignedTaskChip({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { kind: 'task', taskId: task.id },
  })
  const quad = quadrantConfig(task.cuadrante)
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex cursor-grab touch-none items-center gap-2 rounded-xl border border-l-4 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm active:cursor-grabbing dark:bg-white/6 dark:text-slate-300',
        quad.border,
        isDragging && 'opacity-40',
      )}
      style={{ borderLeftColor: quad.hex }}
    >
      <span className={cn('h-2 w-2 shrink-0 rounded-full', quad.dot)} />
      <span className="truncate">{task.titulo}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bloque existente (arrastrable para mover)
// ---------------------------------------------------------------------------

function BlockChip({ block, onDelete }: { block: TimeBlock; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { kind: 'block', block },
  })
  const quad = block.tarea ? quadrantConfig(block.tarea.cuadrante) : null
  const dur = parseHour(block.horaFin) - parseHour(block.horaInicio)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex cursor-grab touch-none items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold active:cursor-grabbing',
        quad ? cn(quad.bg, quad.border, quad.text) : 'border-primary/40 bg-primary/10 text-primary',
        isDragging && 'opacity-40',
      )}
    >
      <span className="truncate">{block.tarea?.titulo ?? 'Tarea'}</span>
      {dur > 0 && <span className="shrink-0 opacity-70">{dur >= 1 ? `${dur}h` : `${dur * 60}m`}</span>}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Eliminar bloque"
        className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-danger/20 hover:text-danger group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Franja horaria droppable
// ---------------------------------------------------------------------------

const HourSlot = memo(function HourSlot({
  hour,
  blocks,
  onDeleteBlock,
  isLast,
}: {
  hour: number
  blocks: TimeBlock[]
  onDeleteBlock: (b: TimeBlock) => void
  isLast: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    disabled: isLast,
  })
  return (
    <div
      ref={isLast ? undefined : setNodeRef}
      className={cn(
        'flex min-h-14 gap-3 border-t border-slate-200/60 py-1.5 transition-colors dark:border-white/8',
        isOver && 'rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/40',
      )}
    >
      <span className="w-12 shrink-0 pt-1 text-right text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
        {toHHMM(hour)}
      </span>
      <div className="flex flex-1 flex-wrap items-start gap-1.5">
        {blocks.map((b) => (
          <BlockChip key={b.id} block={b} onDelete={() => onDeleteBlock(b)} />
        ))}
        {!isLast && blocks.length === 0 && (
          <span className="pt-1 text-[10px] text-slate-300 dark:text-slate-600">
            Suelta una tarea aquí
          </span>
        )}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Página Time-Blocking
// ---------------------------------------------------------------------------

export function TimeBlocksPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [fecha, setFecha] = useState(() => toDateInput(new Date()))
  const [deleting, setDeleting] = useState<TimeBlock | null>(null)

  const blocksQuery = useQuery({
    queryKey: ['timeblocks', fecha],
    queryFn: () => timeblocksApi.list(fecha),
    // Cambiar de día mantiene los bloques anteriores un instante en vez de
    // dejar la agenda en blanco mientras responde el servidor.
    placeholderData: keepPreviousData,
  })
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  })
  useErrorToast(blocksQuery.error, `timeblocks-${fecha}`)
  useErrorToast(tasksQuery.error, 'timeblocks-tasks')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  const blocks = blocksQuery.data ?? NO_BLOCKS
  // Las tareas "sin bloque" se recalculaban en cada render (y esta página
  // re-renderiza en cada arrastre). Con memo solo cambia cuando cambian los datos.
  const unassigned = useMemo(() => {
    const blockedTaskIds = new Set(blocks.map((b) => b.tareaId))
    return (tasksQuery.data ?? []).filter(
      (t) => t.estado !== 'eliminada' && t.estado !== 'completada' && !blockedTaskIds.has(t.id),
    )
  }, [blocks, tasksQuery.data])

  // Los bloques se agrupan por hora una sola vez; así HourSlot puede ir en memo
  // y el arrastre no vuelve a pintar las 18 franjas del día.
  const blocksByHour = useMemo(() => {
    const map = new Map<number, TimeBlock[]>()
    for (const b of blocks) {
      const h = Math.floor(parseHour(b.horaInicio))
      const list = map.get(h)
      if (list) list.push(b)
      else map.set(h, [b])
    }
    return map
  }, [blocks])

  const onDeleteBlock = useCallback((b: TimeBlock) => setDeleting(b), [])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['timeblocks', fecha] })

  const createBlock = useMutation({
    mutationFn: (body: { tareaId: string; horaInicio: string; horaFin: string }) =>
      timeblocksApi.create({ ...body, fecha }),
    onSuccess: () => {
      toast.success('Bloque creado')
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo crear el bloque')),
  })

  const moveBlock = useMutation({
    mutationFn: ({ id, horaInicio, horaFin }: { id: string; horaInicio: string; horaFin: string }) =>
      timeblocksApi.update(id, { horaInicio, horaFin }),
    onSuccess: invalidate,
    onError: (err) => {
      invalidate()
      toast.error(apiErrorMessage(err, 'No se pudo mover el bloque'))
    },
  })

  const deleteBlock = useMutation({
    mutationFn: (id: string) => timeblocksApi.remove(id),
    onSuccess: () => {
      toast.success('Bloque eliminado')
      setDeleting(null)
      invalidate()
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(apiErrorMessage(err, 'No se pudo eliminar el bloque'))
    },
  })

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith('hour-')) return
    const hour = Number(overId.slice(5))
    if (Number.isNaN(hour) || hour < START_HOUR || hour >= END_HOUR) return

    const data = active.data.current as { kind: string; taskId?: string; block?: TimeBlock }
    if (data.kind === 'task' && data.taskId) {
      createBlock.mutate({
        tareaId: data.taskId,
        horaInicio: toHHMM(hour),
        horaFin: toHHMM(hour + 1),
      })
    } else if (data.kind === 'block' && data.block) {
      const dur = Math.max(0.5, parseHour(data.block.horaFin) - parseHour(data.block.horaInicio))
      const newStart = hour
      const newEnd = Math.min(newStart + dur, END_HOUR)
      if (newEnd <= newStart) return
      if (
        data.block.horaInicio === toHHMM(newStart) &&
        data.block.horaFin === toHHMM(newEnd)
      ) {
        return
      }
      moveBlock.mutate({
        id: data.block.id,
        horaInicio: toHHMM(newStart),
        horaFin: toHHMM(newEnd),
      })
    }
  }

  const shiftDate = (days: number) => {
    const d = new Date(`${fecha}T12:00:00`)
    d.setDate(d.getDate() + days)
    setFecha(toDateInput(d))
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Time-Blocking
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Arrastra tus tareas a una franja horaria para planificar tu día.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => shiftDate(-1)} aria-label="Día anterior">
              <ChevronLeft className="h-4.5 w-4.5" />
            </Button>
            <input
              type="date"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              className="h-9 rounded-xl border border-slate-300/70 bg-white/60 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            />
            <Button variant="ghost" size="icon" onClick={() => shiftDate(1)} aria-label="Día siguiente">
              <ChevronRight className="h-4.5 w-4.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setFecha(toDateInput(new Date()))}>
              Hoy
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-4">
            {/* Tareas sin bloquear */}
            <Card className="h-fit p-4 lg:col-span-1">
              <h2 className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                Sin bloquear ({unassigned.length})
              </h2>
              {tasksQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : unassigned.length === 0 ? (
                <EmptyState
                  className="py-6"
                  icon={<CalendarClock className="h-6 w-6" />}
                  title="Todo bloqueado"
                  description="No quedan tareas pendientes por planificar en este día."
                />
              ) : (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {unassigned.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                    >
                      <UnassignedTaskChip task={t} />
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>

            {/* Agenda del día */}
            <Card className="p-4 lg:col-span-3">
              {blocksQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div>
                  {HOURS.map((h) => (
                    <HourSlot
                      key={h}
                      hour={h}
                      isLast={h === END_HOUR}
                      blocks={blocksByHour.get(h) ?? NO_BLOCKS}
                      onDeleteBlock={onDeleteBlock}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </DndContext>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar bloque"
        message={`Se desbloqueará "${deleting?.tarea?.titulo ?? 'la tarea'}" de ${deleting?.horaInicio ?? ''} a ${deleting?.horaFin ?? ''}.`}
        confirmLabel="Eliminar"
        loading={deleteBlock.isPending}
        onConfirm={() => deleting && deleteBlock.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </PageTransition>
  )
}
