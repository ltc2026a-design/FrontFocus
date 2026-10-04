import { useInfiniteQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CreditCard,
  FolderKanban,
  History,
  ListChecks,
  Timer,
  CalendarClock,
  Filter,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { Input, Select } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton } from '@/components/Skeleton'
import { useErrorToast } from '@/hooks/useErrorToast'
import { historyApi } from '@/lib/api'
import { cn, formatDateTime, toDateInput } from '@/lib/utils'

const ENTITY_ICONS: Record<string, typeof History> = {
  tarea: ListChecks,
  task: ListChecks,
  subtask: ListChecks,
  micro_tarea: ListChecks,
  proyecto: FolderKanban,
  project: FolderKanban,
  pomodoro: Timer,
  sesion: Timer,
  timeblock: CalendarClock,
  bloque: CalendarClock,
  pago: CreditCard,
  payment: CreditCard,
}

const ENTITY_COLORS: Record<string, string> = {
  tarea: 'bg-primary/15 text-primary border-primary/30',
  task: 'bg-primary/15 text-primary border-primary/30',
  subtask: 'bg-primary/15 text-primary border-primary/30',
  micro_tarea: 'bg-primary/15 text-primary border-primary/30',
  proyecto: 'bg-secondary/15 text-secondary border-secondary/30',
  project: 'bg-secondary/15 text-secondary border-secondary/30',
  pomodoro: 'bg-danger/15 text-danger border-danger/30',
  sesion: 'bg-danger/15 text-danger border-danger/30',
  timeblock: 'bg-warning/15 text-warning border-warning/30',
  bloque: 'bg-warning/15 text-warning border-warning/30',
  pago: 'bg-secondary/15 text-secondary border-secondary/30',
  payment: 'bg-secondary/15 text-secondary border-secondary/30',
}

const TIPO_OPTIONS = [
  'tarea',
  'subtask',
  'proyecto',
  'pomodoro',
  'timeblock',
  'pago',
  'usuario',
]

export function HistoryPage() {
  const [tipo, setTipo] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const historyQuery = useInfiniteQuery({
    queryKey: ['history', { tipo, from, to }],
    queryFn: ({ pageParam }) =>
      historyApi.list({
        tipo: tipo || undefined,
        from: from || undefined,
        to: to || undefined,
        page: pageParam,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  })
  useErrorToast(historyQuery.error, 'history')

  const events = historyQuery.data?.pages.flatMap((p) => p.data) ?? []
  const hasFilters = Boolean(tipo || from || to)

  const clearFilters = () => {
    setTipo('')
    setFrom('')
    setTo('')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Historial
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Todo lo que ha pasado en tu FocusFlow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" /> Limpiar filtros
              </Button>
            )}
            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" /> Filtros
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-3">
                <Select label="Tipo de entidad" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  {TIPO_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Input
                  label="Desde"
                  type="date"
                  value={from}
                  max={to || toDateInput(new Date())}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <Input
                  label="Hasta"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {historyQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : historyQuery.error ? (
          <Card className="py-6">
            <EmptyState
              icon={<History className="h-7 w-7" />}
              title="No se pudo cargar el historial"
              description="El servidor no está disponible o ocurrió un error."
              action={
                <Button variant="secondary" onClick={() => void historyQuery.refetch()}>
                  Reintentar
                </Button>
              }
            />
          </Card>
        ) : events.length === 0 ? (
          <Card className="py-6">
            <EmptyState
              icon={<History className="h-7 w-7" />}
              title="Historial vacío"
              description={
                hasFilters
                  ? 'Ningún evento coincide con los filtros seleccionados.'
                  : 'Cuando crees, muevas o completes tareas verás aquí tu actividad.'
              }
            />
          </Card>
        ) : (
          <>
            {/* Timeline vertical */}
            <ol className="relative ml-3 space-y-4 border-l-2 border-slate-200/70 pl-6 dark:border-white/10">
              {events.map((ev, i) => {
                const Icon = ENTITY_ICONS[ev.entidadTipo.toLowerCase()] ?? History
                const badgeClass =
                  ENTITY_COLORS[ev.entidadTipo.toLowerCase()] ??
                  'bg-white/10 text-slate-400 border border-white/15'
                return (
                  <motion.li
                    key={ev.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: Math.min((i % 20) * 0.035, 0.4) }}
                    className="relative"
                  >
                    <span
                      className={cn(
                        'absolute -left-[35px] top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-primary dark:border-night',
                      )}
                    />
                    <Card className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <Badge className={badgeClass}>{ev.entidadTipo}</Badge>
                        <Badge variant="neutral">{ev.accion}</Badge>
                        <span className="ml-auto text-[11px] text-slate-400">
                          {formatDateTime(ev.creadoEn)}
                        </span>
                      </div>
                      {ev.detalle && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {ev.detalle}
                        </p>
                      )}
                    </Card>
                  </motion.li>
                )
              })}
            </ol>

            <div className="mt-6 flex justify-center">
              {historyQuery.hasNextPage ? (
                <Button
                  variant="secondary"
                  loading={historyQuery.isFetchingNextPage}
                  onClick={() => void historyQuery.fetchNextPage()}
                >
                  Cargar más
                </Button>
              ) : (
                <p className="text-xs text-slate-400">
                  Fin del historial · {historyQuery.data?.pages[0]?.total ?? events.length} eventos
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  )
}
