import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Flame, Target } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { Skeleton } from '@/components/Skeleton'
import { useErrorToast } from '@/hooks/useErrorToast'
import { metricsApi } from '@/lib/api'
import { cn, formatMinutes } from '@/lib/utils'

type Range = '7d' | '30d'

const tooltipStyle = {
  background: 'rgba(11,17,32,0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e6ebf5',
  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
}

export function MetricsPage() {
  const [range, setRange] = useState<Range>('7d')

  const metricsQuery = useQuery({
    queryKey: ['metrics', range],
    queryFn: () => metricsApi.get(range),
  })
  useErrorToast(metricsQuery.error, `metrics-${range}`)

  const metrics = metricsQuery.data
  const chartData = (metrics?.porDia ?? []).map((d) => ({
    ...d,
    label: new Date(`${d.fecha}T12:00:00`).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    }),
    estimadoH: +(d.tiempoEstimadoMin / 60).toFixed(2),
    realH: +(d.tiempoRealMin / 60).toFixed(2),
  }))

  const tasa = (metrics?.tasaCumplimiento ?? 0) * 100

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Métricas
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Tu rendimiento medido en datos.
            </p>
          </div>
          {/* Selector 7d / 30d */}
          <div className="glass flex rounded-xl p-1">
            {(['7d', '30d'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
                  range === r
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                )}
              >
                {range === r && (
                  <motion.span
                    layoutId="metrics-range"
                    className="absolute inset-0 rounded-lg bg-primary shadow-[0_0_16px_rgba(76,111,255,0.5)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{r === '7d' ? '7 días' : '30 días'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tarjetas destacadas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {(
            [
              {
                label: 'Racha actual',
                icon: Flame,
                value: metrics?.rachaActual ?? 0,
                suffix: ' días',
                decimals: 0,
                color: 'text-warning',
                glow: 'shadow-[0_0_28px_rgba(245,158,11,0.28)]',
                featured: true,
              },
              {
                label: 'Tasa de cumplimiento',
                icon: Target,
                value: tasa,
                suffix: '%',
                decimals: 1,
                color: 'text-secondary',
                glow: 'shadow-[0_0_28px_rgba(34,197,94,0.22)]',
                featured: false,
              },
              {
                label: 'Tareas completadas',
                icon: CheckCircle2,
                value: metrics?.totales.tareasCompletadas ?? 0,
                suffix: '',
                decimals: 0,
                color: 'text-primary',
                glow: 'shadow-[0_0_28px_rgba(76,111,255,0.22)]',
                featured: false,
              },
              {
                label: 'Sesiones pomodoro',
                icon: Clock,
                value: metrics?.totales.sesionesCompletadas ?? 0,
                suffix: '',
                decimals: 0,
                color: 'text-danger',
                glow: 'shadow-[0_0_28px_rgba(239,68,68,0.18)]',
                featured: false,
              },
            ] as const
          ).map((c, i) => (
            <StaggerItem key={c.label} index={i}>
              <Card className={cn('relative overflow-hidden p-4 sm:p-5', c.glow)}>
                {c.featured && (
                  <motion.div
                    animate={{ opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 2.6, repeat: Infinity }}
                    className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-warning/25 blur-2xl"
                    aria-hidden
                  />
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {c.label}
                  </p>
                  <c.icon className={cn('h-4.5 w-4.5', c.color)} />
                </div>
                <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-slate-50">
                  {metricsQuery.isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <AnimatedNumber
                      value={c.value}
                      decimals={c.decimals ?? 0}
                      suffix={c.suffix ?? ''}
                    />
                  )}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">
              Tareas completadas por día
            </h2>
            {metricsQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="Sin datos en el rango"
                description="Completa tareas para empezar a ver tu progreso."
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,145,175,0.15)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8b96ab' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8b96ab' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(76,111,255,0.08)' }} contentStyle={tooltipStyle} labelStyle={{ color: '#8b96ab' }} />
                  <Bar dataKey="tareasCompletadas" name="Completadas" fill="#4C6FFF" radius={[6, 6, 0, 0]} fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              Tiempo estimado vs. real (horas)
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              Total del rango: {formatMinutes(metrics?.totales.tiempoEstimadoMin)} estimados vs.{' '}
              {formatMinutes(metrics?.totales.tiempoRealMin)} reales
            </p>
            {metricsQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-7 w-7" />}
                title="Sin datos de tiempo"
                description="Registra tiempo estimado en tus tareas y completa sesiones pomodoro."
              />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,145,175,0.15)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8b96ab' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#8b96ab' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#8b96ab' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="estimadoH"
                    name="Estimado"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="realH"
                    name="Real"
                    stroke="#22C55E"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
