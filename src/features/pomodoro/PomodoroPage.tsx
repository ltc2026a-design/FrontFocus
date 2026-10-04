import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Check,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Square,
  Timer,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Select } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { useToast } from '@/components/Toast'
import { useErrorToast } from '@/hooks/useErrorToast'
import { apiErrorMessage, pomodoroApi, tasksApi } from '@/lib/api'
import { notify, requestPermission } from '@/platform/notifications'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import type { PomodoroSession, PomodoroType } from '@/lib/types'
import { useQuery } from '@tanstack/react-query'

const CIRCLE_SIZE = 300
const STROKE = 14
const RADIUS = (CIRCLE_SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PomodoroPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const focusMode = useUiStore((s) => s.focusMode)
  const setFocusMode = useUiStore((s) => s.setFocusMode)

  const [session, setSession] = useState<PomodoroSession | null>(null)
  /** Deadline absoluto (ms epoch) cuando la sesión está activa. */
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null)
  /** Remaining congelado (ms) cuando la sesión está pausada. */
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const [workMin, setWorkMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [tareaId, setTareaId] = useState('')
  const [nextType, setNextType] = useState<PomodoroType>('trabajo')
  const finishingRef = useRef(false)
  const restoredRef = useRef(false)

  // -----------------------------------------------------------------------
  // Restaurar sesión activa al montar / recuperar la app (GET /pomodoro/active)
  // -----------------------------------------------------------------------
  const activeQuery = useQuery({
    queryKey: ['pomodoro-active'],
    queryFn: () => pomodoroApi.active(),
    refetchOnWindowFocus: true,
  })
  useErrorToast(activeQuery.error, 'pomodoro-active')

  useEffect(() => {
    const remote = activeQuery.data
    if (activeQuery.isLoading) return
    if (!restoredRef.current) {
      restoredRef.current = true
      if (remote && (remote.estado === 'activa' || remote.estado === 'pausada')) {
        setSession(remote)
        const plannedMs = remote.duracionPlaneadaMin * 60_000
        if (remote.estado === 'activa') {
          setDeadlineMs(Date.parse(remote.inicio) + plannedMs)
          setPausedRemainingMs(null)
        } else {
          // En pausa: el servidor acumula el tiempo transcurrido en duracionRealMin.
          const accumulatedMs = (remote.duracionRealMin ?? 0) * 60_000
          setPausedRemainingMs(Math.max(0, plannedMs - accumulatedMs))
          setDeadlineMs(null)
        }
      }
      return
    }
    // Si el servidor ya no tiene sesión activa y localmente quedó una completada, limpiar.
    if (!remote && session && session.estado !== 'activa' && session.estado !== 'pausada') {
      setSession(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery.data, activeQuery.isLoading])

  // -----------------------------------------------------------------------
  // Tick basado en timestamps (sobrevive cambios de pestaña).
  // 1 s y no 250 ms: la pantalla solo muestra mm:ss, así que refrescar 4x por
  // segundo re-renderizaba toda la página —incluido el anillo SVG— sin ganancia.
  // -----------------------------------------------------------------------
  const running = session?.estado === 'activa' && deadlineMs !== null

  useEffect(() => {
    if (!running) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    const onVisibility = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [running, deadlineMs])

  const plannedMs = (session?.duracionPlaneadaMin ?? (nextType === 'trabajo' ? workMin : breakMin)) * 60_000

  const remainingMs = (() => {
    if (!session) return plannedMs
    if (session.estado === 'activa' && deadlineMs !== null) return Math.max(0, deadlineMs - now)
    if (session.estado === 'pausada') return pausedRemainingMs ?? Math.max(0, plannedMs - (session.duracionRealMin ?? 0) * 60_000)
    return 0
  })()

  const progress = plannedMs > 0 ? 1 - remainingMs / plannedMs : 0

  // -----------------------------------------------------------------------
  // Tareas para vincular
  // -----------------------------------------------------------------------
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  })
  const tareasVinculables = (tasksQuery.data ?? []).filter(
    (t) => t.estado !== 'eliminada' && t.estado !== 'completada',
  )
  const linkedTask = session?.tareaId
    ? tareasVinculables.find((t) => t.id === session.tareaId)
    : undefined

  // -----------------------------------------------------------------------
  // Mutaciones contra la API
  // -----------------------------------------------------------------------
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pomodoro-active'] })
    queryClient.invalidateQueries({ queryKey: ['metrics'] })
  }

  const startMutation = useMutation({
    mutationFn: (tipo: PomodoroType) =>
      pomodoroApi.start({
        duracionPlaneadaMin: tipo === 'trabajo' ? workMin : breakMin,
        tipo,
        ...(tipo === 'trabajo' && tareaId ? { tareaId } : {}),
      }),
    onSuccess: (data) => {
      setSession(data)
      setDeadlineMs(Date.parse(data.inicio) + data.duracionPlaneadaMin * 60_000)
      setPausedRemainingMs(null)
      finishingRef.current = false
      if (data.tipo === 'trabajo') void requestPermission()
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo iniciar el pomodoro')),
  })

  const pauseMutation = useMutation({
    mutationFn: () => pomodoroApi.pause(session!.id),
    onSuccess: (data) => {
      setPausedRemainingMs(deadlineMs !== null ? Math.max(0, deadlineMs - Date.now()) : null)
      setSession(data)
      setDeadlineMs(null)
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const resumeMutation = useMutation({
    mutationFn: () => pomodoroApi.resume(session!.id),
    onSuccess: (data) => {
      const remaining = pausedRemainingMs ?? data.duracionPlaneadaMin * 60_000
      setDeadlineMs(Date.now() + remaining)
      setPausedRemainingMs(null)
      setSession(data)
      invalidate()
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const finishMutation = useMutation({
    mutationFn: (completada: boolean) => pomodoroApi.finish(session!.id, completada),
    onSuccess: (data, completada) => {
      setSession(data)
      setDeadlineMs(null)
      setPausedRemainingMs(null)
      if (completada) {
        const wasWork = data.tipo === 'trabajo'
        setNextType(wasWork ? 'descanso' : 'trabajo')
        void notify({
          title: wasWork ? '¡Pomodoro completado!' : 'Descanso terminado',
          body: wasWork ? 'Tómate un descanso, lo mereces.' : 'De vuelta al enfoque.',
          tag: 'pomodoro',
        })
        toast.success(wasWork ? 'Ciclo de trabajo completado' : 'Descanso completado')
      }
      invalidate()
      // Limpiar sesión tras un instante para que la UI muestre el estado final.
      window.setTimeout(() => setSession(null), 600)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo finalizar la sesión')),
  })

  // Al llegar a 0 en una sesión activa → finalizar como completada (una sola vez).
  const handleCycleEnd = useCallback(() => {
    if (!session || session.estado !== 'activa' || finishingRef.current) return
    finishingRef.current = true
    finishMutation.mutate(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    if (running && remainingMs <= 0) handleCycleEnd()
  }, [running, remainingMs, handleCycleEnd])

  // Modo foco: solo con sesión de trabajo en curso; al terminar, se sale solo.
  useEffect(() => {
    if (!focusMode || activeQuery.isLoading) return
    const stillWork =
      session?.tipo === 'trabajo' && (session.estado === 'activa' || session.estado === 'pausada')
    if (!stillWork) setFocusMode(false)
  }, [focusMode, session, activeQuery.isLoading, setFocusMode])

  const canFocus = session?.tipo === 'trabajo' && (session.estado === 'activa' || session.estado === 'pausada')

  const idle = !session || (session.estado !== 'activa' && session.estado !== 'pausada')
  const isWork = (session?.tipo ?? nextType) === 'trabajo'
  const ringColor = isWork ? '#4C6FFF' : '#22C55E'
  const ringColorSoft = isWork ? '#7dd3fc' : '#86efac'

  const controls = (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {idle && (
        <>
          <Button
            size="lg"
            onClick={() => startMutation.mutate('trabajo')}
            loading={startMutation.isPending && startMutation.variables === 'trabajo'}
            disabled={startMutation.isPending}
          >
            <Play className="h-4.5 w-4.5" /> Iniciar enfoque
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => startMutation.mutate('descanso')}
            loading={startMutation.isPending && startMutation.variables === 'descanso'}
            disabled={startMutation.isPending}
          >
            <Timer className="h-4.5 w-4.5" /> Iniciar descanso
          </Button>
        </>
      )}
      {!idle && session?.estado === 'activa' && (
        <>
          <Button size="lg" variant="ghost" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
            <Pause className="h-4.5 w-4.5" /> Pausar
          </Button>
          <Button size="lg" variant="danger" onClick={() => finishMutation.mutate(false)} disabled={finishMutation.isPending}>
            <Square className="h-4 w-4" /> Finalizar
          </Button>
          <Button size="lg" variant="secondary" onClick={() => finishMutation.mutate(true)} disabled={finishMutation.isPending}>
            <Check className="h-4.5 w-4.5" /> Completar
          </Button>
        </>
      )}
      {!idle && session?.estado === 'pausada' && (
        <>
          <Button size="lg" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
            <RotateCcw className="h-4.5 w-4.5" /> Reanudar
          </Button>
          <Button size="lg" variant="danger" onClick={() => finishMutation.mutate(false)} disabled={finishMutation.isPending}>
            <Square className="h-4 w-4" /> Finalizar
          </Button>
          <Button size="lg" variant="secondary" onClick={() => finishMutation.mutate(true)} disabled={finishMutation.isPending}>
            <Check className="h-4.5 w-4.5" /> Completar
          </Button>
        </>
      )}
    </div>
  )

  const timerCircle = (
    <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
      <div
        className="absolute inset-6 rounded-full blur-2xl"
        style={{ background: isWork ? 'rgba(76,111,255,0.22)' : 'rgba(34,197,94,0.18)' }}
        aria-hidden
      />
      <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} className="relative -rotate-90">
        <defs>
          <linearGradient id="pomodoro-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ringColor} />
            <stop offset="100%" stopColor={ringColorSoft} />
          </linearGradient>
        </defs>
        <circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          className="text-slate-200/60 dark:text-white/8"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#pomodoro-ring)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress))) }}
          transition={{ duration: 0.9, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 10px ${ringColor}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-extrabold tabular-nums tracking-tight text-slate-800 dark:text-slate-50">
          {formatClock(remainingMs)}
        </span>
        <span
          className={cn(
            'mt-1 rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest',
            isWork ? 'bg-primary/15 text-primary' : 'bg-secondary/15 text-secondary',
          )}
        >
          {session ? (session.tipo === 'trabajo' ? 'Enfoque' : 'Descanso') : nextType === 'trabajo' ? 'Enfoque' : 'Descanso'}
          {session?.estado === 'pausada' && ' · pausado'}
        </span>
      </div>
    </div>
  )

  // -------------------------------------------------------------------------
  // MODO FOCO: pantalla completa sin sidebar/header
  // -------------------------------------------------------------------------
  if (focusMode && canFocus) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-night px-4">
        {/* Fondo: orbes estáticos. Animar scale/posición de una capa con
            blur(100px+) re-rueda el filtro en cada cuadro y en el celular baja
            los FPS justo en el modo foco. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-secondary/10 blur-[80px]" />
        </div>

        <button
          onClick={() => setFocusMode(false)}
          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/15"
        >
          <X className="h-4 w-4" /> Salir de modo foco
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative z-[1] flex flex-col items-center gap-8"
        >
          <div className="scale-110 text-slate-100 sm:scale-125">{timerCircle}</div>
          {linkedTask && (
            <div className="max-w-md rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Enfocado en
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-100">{linkedTask.titulo}</p>
            </div>
          )}
          {controls}
        </motion.div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Vista normal
  // -------------------------------------------------------------------------
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Pomodoro
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Trabaja por ciclos con descanso programado. La sesión sobrevive si cambias de pestaña.
          </p>
        </div>

        <Card className="flex flex-col items-center gap-8 p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {timerCircle}
          </motion.div>

          {controls}

          {canFocus && (
            <Button variant="ghost" onClick={() => setFocusMode(true)}>
              <Maximize2 className="h-4 w-4" /> Entrar en modo foco
            </Button>
          )}
          {focusMode && !canFocus && (
            <Button variant="ghost" onClick={() => setFocusMode(false)}>
              <Minimize2 className="h-4 w-4" /> Salir de modo foco
            </Button>
          )}
        </Card>

        {/* Configuración */}
        <Card className="mt-4 p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">
            Configuración
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Duración enfoque (min)"
              value={workMin}
              disabled={!idle}
              onChange={(e) => setWorkMin(Number(e.target.value))}
            >
              {[15, 25, 30, 45, 50, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </Select>
            <Select
              label="Duración descanso (min)"
              value={breakMin}
              disabled={!idle}
              onChange={(e) => setBreakMin(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </Select>
            <Select
              label="Tarea vinculada (opcional)"
              value={tareaId}
              disabled={!idle}
              onChange={(e) => setTareaId(e.target.value)}
            >
              <option value="">Sin tarea</option>
              {tareasVinculables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </Select>
          </div>
          {!idle && (
            <p className="mt-3 text-xs text-slate-400">
              Finaliza la sesión actual para cambiar la configuración.
            </p>
          )}
        </Card>
      </div>
    </PageTransition>
  )
}
