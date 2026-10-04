import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  CreditCard,
  DollarSign,
  FolderKanban,
  History,
  ListChecks,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Input, Select } from '@/components/Input'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { PageTransition } from '@/components/PageTransition'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useErrorToast } from '@/hooks/useErrorToast'
import { adminApi, apiErrorMessage, paymentsApi } from '@/lib/api'
import type { AdminUser, PaymentStatus, Rol } from '@/lib/types'
import {
  PAYMENT_STATUS,
  TASK_STATUS,
  cn,
  formatDate,
  formatDateTime,
  formatMoney,
  quadrantConfig,
} from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

type Tab = 'usuarios' | 'pagos' | 'tareas' | 'historial'

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'tareas', label: 'Tareas', icon: ListChecks },
  { id: 'historial', label: 'Historial', icon: History },
]

// ---------------------------------------------------------------------------
// Paginador simple
// ---------------------------------------------------------------------------

function Paginator({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      <span className="font-semibold text-slate-400">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Siguiente
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Usuarios
// ---------------------------------------------------------------------------

function UsersTab() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const me = useAuthStore((s) => s.user)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [deleting, setDeleting] = useState<AdminUser | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users', { page, q }],
    queryFn: () => adminApi.users({ page, limit: 20, q: q || undefined }),
  })
  useErrorToast(usersQuery.error, `admin-users-${page}-${q}`)

  const updateRol = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: Rol }) => adminApi.updateUser(id, { rol }),
    onSuccess: () => {
      toast.success('Rol actualizado')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, 'No se pudo cambiar el rol (no puedes degradarte a ti mismo)')),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario eliminado')
      setDeleting(null)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => {
      setDeleting(null)
      toast.error(apiErrorMessage(err, 'No se pudo eliminar (no puedes borrarte a ti mismo)'))
    },
  })

  const users = usersQuery.data

  return (
    <div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setQ(searchInput.trim())
        }}
      >
        <Input
          placeholder="Buscar por nombre o email…"
          icon={<Search className="h-4 w-4" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {q && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('')
              setQ('')
              setPage(1)
            }}
          >
            Limpiar
          </Button>
        )}
      </form>

      {usersQuery.isLoading ? (
        <SkeletonTable rows={6} />
      ) : !users || users.data.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="Sin usuarios" description="Ningún usuario coincide con la búsqueda." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Usuario</th>
                  <th className="pb-2 pr-4 font-semibold">Conteos</th>
                  <th className="pb-2 pr-4 font-semibold">Alta</th>
                  <th className="pb-2 pr-4 font-semibold">Rol</th>
                  <th className="pb-2 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-slate-100 last:border-0 dark:border-white/5"
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {u.nombre}
                        {u.id === me?.id && (
                          <span className="ml-1.5 text-xs font-normal text-primary">(tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">
                      {u._count?.tareas ?? 0} tareas · {u._count?.proyectos ?? 0} proy. ·{' '}
                      {u._count?.pagos ?? 0} pagos
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(u.creadoEn)}</td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={u.rol}
                        disabled={u.id === me?.id || updateRol.isPending}
                        onChange={(e) => updateRol.mutate({ id: u.id, rol: e.target.value as Rol })}
                        className={cn(
                          'rounded-lg border px-2 py-1 text-xs font-bold outline-none disabled:opacity-60',
                          u.rol === 'ADMIN'
                            ? 'border-warning/40 bg-warning/10 text-warning'
                            : 'border-slate-300/60 bg-white/50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
                        )}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-2.5">
                      <button
                        aria-label={`Eliminar ${u.nombre}`}
                        disabled={u.id === me?.id}
                        onClick={() => setDeleting(u)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={users.page} totalPages={users.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar usuario"
        message={`Se eliminará "${deleting?.nombre ?? ''}" y todos sus datos asociados. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        loading={deleteUser.isPending}
        onConfirm={() => deleting && deleteUser.mutate(deleting.id)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Pagos
// ---------------------------------------------------------------------------

function PaymentsTab() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [estado, setEstado] = useState<'' | PaymentStatus>('')

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments', { page, estado }],
    queryFn: () =>
      adminApi.payments({ page, limit: 20, estado: (estado || undefined) as PaymentStatus | undefined }),
  })
  useErrorToast(paymentsQuery.error, `admin-payments-${page}-${estado}`)

  const updateStatus = useMutation({
    mutationFn: ({ id, estado: newStatus }: { id: string; estado: PaymentStatus }) =>
      paymentsApi.updateStatus(id, newStatus),
    onSuccess: () => {
      toast.success('Estado de pago actualizado')
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo actualizar el pago')),
  })

  const result = paymentsQuery.data

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          label="Filtrar por estado"
          value={estado}
          onChange={(e) => {
            setEstado(e.target.value as '' | PaymentStatus)
            setPage(1)
          }}
        >
          <option value="">Todos</option>
          {(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS[s].label}
            </option>
          ))}
        </Select>
      </div>

      {paymentsQuery.isLoading ? (
        <SkeletonTable rows={6} />
      ) : !result || result.data.length === 0 ? (
        <EmptyState icon={<CreditCard className="h-7 w-7" />} title="Sin pagos" description="No hay pagos con este filtro." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Fecha</th>
                  <th className="pb-2 pr-4 font-semibold">Usuario</th>
                  <th className="pb-2 pr-4 font-semibold">Plan</th>
                  <th className="pb-2 pr-4 font-semibold">Monto</th>
                  <th className="pb-2 pr-4 font-semibold">Estado</th>
                  <th className="pb-2 font-semibold">Cambiar estado</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-slate-100 last:border-0 dark:border-white/5"
                  >
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{formatDate(p.creadoEn)}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {p.usuario?.nombre ?? '—'}
                      </p>
                      <p className="text-xs text-slate-400">{p.usuario?.email}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-xs capitalize text-slate-500 dark:text-slate-400">
                      {p.planTipo.replace('_', ' ')} · {p.metodo}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                      {formatMoney(Number(p.monto), p.moneda)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge className={PAYMENT_STATUS[p.estado].className}>
                        {PAYMENT_STATUS[p.estado].label}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <select
                        value={p.estado}
                        disabled={updateStatus.isPending}
                        onChange={(e) =>
                          updateStatus.mutate({ id: p.id, estado: e.target.value as PaymentStatus })
                        }
                        className="rounded-lg border border-slate-300/60 bg-white/50 px-2 py-1 text-xs font-semibold text-slate-600 outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        {(Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Tareas
// ---------------------------------------------------------------------------

function TasksTab() {
  const [page, setPage] = useState(1)
  const tasksQuery = useQuery({
    queryKey: ['admin-tasks', page],
    queryFn: () => adminApi.tasks({ page, limit: 20 }),
  })
  useErrorToast(tasksQuery.error, `admin-tasks-${page}`)
  const result = tasksQuery.data

  return (
    <div>
      {tasksQuery.isLoading ? (
        <SkeletonTable rows={6} />
      ) : !result || result.data.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-7 w-7" />} title="Sin tareas" description="Todavía no hay tareas en el sistema." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Tarea</th>
                  <th className="pb-2 pr-4 font-semibold">Usuario</th>
                  <th className="pb-2 pr-4 font-semibold">Cuadrante</th>
                  <th className="pb-2 pr-4 font-semibold">Estado</th>
                  <th className="pb-2 font-semibold">Creada</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((t, i) => {
                  const quad = quadrantConfig(t.cuadrante)
                  return (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.3) }}
                      className="border-b border-slate-100 last:border-0 dark:border-white/5"
                    >
                      <td className="max-w-64 truncate py-2.5 pr-4 font-semibold text-slate-700 dark:text-slate-200">
                        {t.titulo}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-400">
                        {t.usuario?.nombre ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={quad.badge}>{quad.shortLabel}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge className={TASK_STATUS[t.estado].className}>
                          {TASK_STATUS[t.estado].label}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-slate-400">{formatDate(t.creadoEn)}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Paginator page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Historial global
// ---------------------------------------------------------------------------

function HistoryTab() {
  const [page, setPage] = useState(1)
  const historyQuery = useQuery({
    queryKey: ['admin-history', page],
    queryFn: () => adminApi.history({ page, limit: 30 }),
  })
  useErrorToast(historyQuery.error, `admin-history-${page}`)
  const result = historyQuery.data

  return (
    <div>
      {historyQuery.isLoading ? (
        <SkeletonTable rows={8} />
      ) : !result || result.data.length === 0 ? (
        <EmptyState icon={<History className="h-7 w-7" />} title="Sin eventos" description="El historial global está vacío." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Fecha</th>
                  <th className="pb-2 pr-4 font-semibold">Entidad</th>
                  <th className="pb-2 pr-4 font-semibold">Acción</th>
                  <th className="pb-2 pr-4 font-semibold">Detalle</th>
                  <th className="pb-2 font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((ev, i) => (
                  <motion.tr
                    key={ev.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.02, 0.3) }}
                    className="border-b border-slate-100 last:border-0 dark:border-white/5"
                  >
                    <td className="whitespace-nowrap py-2.5 pr-4 text-xs text-slate-400">
                      {formatDateTime(ev.creadoEn)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="neutral">{ev.entidadTipo}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {ev.accion}
                    </td>
                    <td className="max-w-72 truncate py-2.5 pr-4 text-xs text-slate-400">
                      {ev.detalle ?? '—'}
                    </td>
                    <td className="py-2.5 text-xs text-slate-400">{ev.usuario?.nombre ?? '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginator page={result.page} totalPages={result.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página Admin
// ---------------------------------------------------------------------------

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('usuarios')

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats(),
  })
  useErrorToast(statsQuery.error, 'admin-stats')
  const stats = statsQuery.data

  const statCards = [
    { label: 'Usuarios', value: stats?.usuarios ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Tareas', value: stats?.tareas ?? 0, icon: ListChecks, color: 'text-secondary' },
    { label: 'Completadas', value: stats?.tareasCompletadas ?? 0, icon: CheckCircle2, color: 'text-warning' },
    { label: 'Sesiones pomodoro', value: stats?.sesionesPomodoro ?? 0, icon: ShieldCheck, color: 'text-danger' },
    { label: 'Pagos completados', value: stats?.pagosCompletados ?? 0, icon: CreditCard, color: 'text-primary' },
    { label: 'Ingresos totales', value: stats?.ingresosTotales ?? 0, icon: DollarSign, color: 'text-secondary', money: true },
    { label: 'Proyectos', value: stats?.proyectos ?? 0, icon: FolderKanban, color: 'text-warning' },
  ]

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            <ShieldCheck className="h-6 w-6 text-warning" /> Administración
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Panel global de la plataforma (solo rol ADMIN).
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {statCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
            >
              <Card className="p-4">
                <c.icon className={cn('h-4.5 w-4.5', c.color)} />
                <p className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-50">
                  {statsQuery.isLoading ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <AnimatedNumber
                      value={c.value}
                      decimals={c.money ? 2 : 0}
                      suffix={c.money ? '' : ''}
                    />
                  )}
                  {c.money && stats && (
                    <span className="text-sm font-bold text-slate-400"> USD</span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  {c.label}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors',
                  tab === t.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                )}
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="admin-tab"
                    className="absolute inset-0 rounded-lg bg-primary shadow-[0_0_16px_rgba(76,111,255,0.45)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <t.icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>

          {tab === 'usuarios' && <UsersTab />}
          {tab === 'pagos' && <PaymentsTab />}
          {tab === 'tareas' && <TasksTab />}
          {tab === 'historial' && <HistoryTab />}
        </Card>
      </div>
    </PageTransition>
  )
}
