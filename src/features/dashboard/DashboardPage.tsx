import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  Timer,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { Skeleton } from '@/components/Skeleton'
import { metricsApi, tasksApi } from '@/lib/api'
import { useErrorToast } from '@/hooks/useErrorToast'
import { cn, formatDate, isOverdue, quadrantConfig, toDateInput } from '@/lib/utils'

export function DashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ['metrics', '7d'],
    queryFn: () => metricsApi.get('7d'),
  })
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  })

  useErrorToast(metricsQuery.error, 'dashboard-metrics')
  useErrorToast(tasksQuery.error, 'dashboard-tasks')

  const loading = metricsQuery.isLoading || tasksQuery.isLoading
  const metrics = metricsQuery.data
  const tasks = (tasksQuery.data ?? []).filter((t) => t.estado !== 'eliminada')

  const pendientes = tasks.filter((t) => t.estado === 'pendiente' || t.estado === 'en_progreso')
  const today = toDateInput(new Date())
  const completadasHoy =
    metrics?.porDia.find((d) => d.fecha === today)?.tareasCompletadas ??
    metrics?.porDia.at(-1)?.tareasCompletadas ??
    0

  const proximas = tasks
    .filter((t) => t.fechaLimite && t.estado !== 'completada')
    .sort((a, b) => new Date(a.fechaLimite!).getTime() - new Date(b.fechaLimite!).getTime())
    .slice(0, 6)

  const chartData = (metrics?.porDia ?? []).map((d) => ({
    ...d,
    label: new Date(`${d.fecha}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short' }),
  }))

  const stats = [
    {
      label: 'Tareas pendientes',
      value: pendientes.length,
      icon: ClipboardList,
      color: 'text-primary',
      glow: 'shadow-[0_0_24px_rgba(76,111,255,0.25)]',
      to: '/matrix',
    },
    {
      label: 'Completadas hoy',
      value: completadasHoy,
      icon: CheckCircle2,
      color: 'text-secondary',
      glow: 'shadow-[0_0_24px_rgba(34,197,94,0.25)]',
      to: '/history',
    },
    {
      label: 'Racha actual',
      value: metrics?.rachaActual ?? 0,
      icon: Flame,
      color: 'text-warning',
      glow: 'shadow-[0_0_24px_rgba(245,158,11,0.25)]',
      suffix: ' d',
      to: '/metrics',
    },
    {
      label: 'Sesiones pomodoro',
      value: metrics?.totales.sesionesCompletadas ?? 0,
      icon: Timer,
      color: 'text-danger',
      glow: 'shadow-[0_0_24px_rgba(239,68,68,0.2)]',
      to: '/pomodoro',
    },
  ]

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Resumen de tu productividad de los últimos 7 días.
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 sm:p-5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-3 h-8 w-16" />
                </Card>
              ))
            : stats.map((s, i) => (
                <StaggerItem key={s.label} index={i}>
                  <Link to={s.to}>
                    <Card hoverable className={cn('p-4 sm:p-5', s.glow)}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                          {s.label}
                        </p>
                        <s.icon className={cn('h-4.5 w-4.5', s.color)} />
                      </div>
                      <p className="mt-2 text-3xl font-extrabold text-slate-800 dark:text-slate-50">
                        <AnimatedNumber value={s.value} suffix={s.suffix ?? ''} />
                      </p>
                    </Card>
                  </Link>
                </StaggerItem>
              ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Gráfico mini de la semana */}
          <Card className="p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Tareas completadas — última semana
              </h2>
              <Link
                to="/metrics"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Ver métricas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <Skeleton className="h-44 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-7 w-7" />}
                title="Sin datos aún"
                description="Completa tareas y sesiones pomodoro para ver tu evolución aquí."
              />
            ) : (
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,145,175,0.15)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#8b96ab' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#8b96ab' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(76,111,255,0.08)' }}
                    contentStyle={{
                      background: 'rgba(11,17,32,0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#e6ebf5',
                    }}
                    labelStyle={{ color: '#8b96ab' }}
                  />
                  <Bar dataKey="tareasCompletadas" name="Completadas" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={index === chartData.length - 1 ? '#22C55E' : '#4C6FFF'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Próximas tareas */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Próximas tareas con fecha límite
              </h2>
              <Link
                to="/matrix"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Matriz <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : proximas.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-7 w-7" />}
                title="Nada urgente"
                description="No hay tareas con fecha límite próxima. ¡Buen momento para planificar!"
              />
            ) : (
              <ul className="space-y-2">
                {proximas.map((t, i) => {
                  const quad = quadrantConfig(t.cuadrante)
                  const overdue = isOverdue(t.fechaLimite)
                  return (
                    <StaggerItem key={t.id} index={i}>
                      <Link to={`/tasks/${t.id}`}>
                        <motion.li
                          whileHover={{ x: 3 }}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border border-l-4 bg-white/40 px-3 py-2.5 transition-colors hover:bg-white/70 dark:bg-white/5 dark:hover:bg-white/10',
                            quad.border,
                          )}
                          style={{ borderLeftColor: quad.hex }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {t.titulo}
                            </p>
                            <p className={cn('text-xs', overdue ? 'font-bold text-danger' : 'text-slate-400')}>
                              {overdue ? 'Vencida · ' : ''}
                              {formatDate(t.fechaLimite)}
                            </p>
                          </div>
                          <Badge className={quad.badge}>{quad.shortLabel}</Badge>
                        </motion.li>
                      </Link>
                    </StaggerItem>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  )
}
