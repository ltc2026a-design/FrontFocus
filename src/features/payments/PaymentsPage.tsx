import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, Crown, FlaskConical, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { Skeleton, SkeletonTable } from '@/components/Skeleton'
import { useErrorToast } from '@/hooks/useErrorToast'
import { paymentsApi } from '@/lib/api'
import type { Plan } from '@/lib/types'
import { PAYMENT_STATUS, cn, formatDate, formatMoney } from '@/lib/utils'
import { CheckoutModal } from './CheckoutModal'

const PLAN_ICONS: Record<string, typeof Crown> = {
  free: Sparkles,
  pro_mensual: Zap,
  pro_anual: Zap,
  lifetime: Crown,
}

// Orden de superioridad: solo se permite mejorar de plan.
const PLAN_RANK: Record<string, number> = { free: 0, pro_mensual: 1, pro_anual: 2, lifetime: 3 }

const METODO_LABEL: Record<string, string> = {
  tarjeta: 'Tarjeta',
  paypal: 'PayPal',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  llave: 'LLAVE',
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)

  const plansQuery = useQuery({ queryKey: ['plans'], queryFn: () => paymentsApi.plans() })
  const subscriptionQuery = useQuery({
    queryKey: ['subscription-current'],
    queryFn: () => paymentsApi.currentSubscription(),
  })
  const paymentsQuery = useQuery({ queryKey: ['my-payments'], queryFn: () => paymentsApi.mine() })

  useErrorToast(plansQuery.error, 'payments-plans')
  useErrorToast(subscriptionQuery.error, 'payments-subscription')
  useErrorToast(paymentsQuery.error, 'payments-mine')

  const plans = plansQuery.data ?? []
  const subscription = subscriptionQuery.data
  const payments = paymentsQuery.data ?? []

  const currentPlanTipo = subscription?.activa ? subscription.planTipo : 'free'
  const currentRank = PLAN_RANK[currentPlanTipo] ?? 0

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ['my-payments'] })
    queryClient.invalidateQueries({ queryKey: ['subscription-current'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['history'] })
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Planes y pagos
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Desbloquea todo el potencial de FocusFlow.
          </p>
        </div>

        {/* Aviso entorno de prueba */}
        <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            <b>Entorno de prueba / simulado.</b> Ningún pago es real. Visa{' '}
            <b>4242 4242 4242 4242</b> se aprueba; Mastercard <b>5111 1111 1111 1118</b> se rechaza;
            PayPal, Transferencia, <b>Nequi</b> y <b>LLAVE</b> quedan <i>pendientes</i>. Ya solo puedes
            <b> mejorar</b> tu suscripción actual ({currentPlanTipo.replace('_', ' ')}).
          </p>
        </div>

        {/* Planes */}
        {plansQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card className="py-6">
            <EmptyState
              icon={<Crown className="h-7 w-7" />}
              title="No hay planes disponibles"
              description="El servidor aún no devolvió el catálogo de planes."
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan, i) => {
              const Icon = PLAN_ICONS[plan.tipo] ?? Sparkles
              const isCurrent = currentPlanTipo === plan.tipo
              const isFeatured = plan.tipo === 'pro_anual' || plan.tipo === 'pro_mensual'
              const rank = PLAN_RANK[plan.tipo] ?? 0
              // Solo se puede comprar un plan SUPERIOR al vigente (mejorar).
              const isUpgrade = !isCurrent && currentRank > 0 && rank > currentRank
              const isDowngrade = !isCurrent && plan.tipo !== 'free' && rank <= currentRank
              const canBuy = plan.tipo !== 'free' && !isCurrent && !isDowngrade
              return (
                <StaggerItem key={plan.id} index={i}>
                  <Card
                    className={cn(
                      'relative flex h-full flex-col overflow-hidden p-6',
                      isFeatured &&
                        'border-primary/50 shadow-[0_0_36px_rgba(76,111,255,0.28)] dark:border-primary/40',
                      isCurrent && 'border-secondary/50 dark:border-secondary/40',
                    )}
                  >
                    {isFeatured && (
                      <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute right-4 top-4 rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Plan actual
                      </span>
                    )}
                    <div
                      className={cn(
                        'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl',
                        plan.tipo === 'lifetime'
                          ? 'bg-warning/15 text-warning'
                          : plan.tipo === 'free'
                            ? 'bg-slate-500/10 text-slate-400'
                            : 'bg-primary/15 text-primary',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                      {plan.nombre}
                    </h2>
                    <p className="mt-1 min-h-10 text-xs text-slate-400 dark:text-slate-500">
                      {plan.descripcion}
                    </p>
                    <div className="my-4">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-50">
                        {formatMoney(plan.tipo === 'lifetime' ? plan.precioMensual : plan.precioMensual)}
                      </span>
                      <span className="text-sm text-slate-400">
                        {plan.tipo === 'lifetime' ? ' pago único' : ' /mes'}
                      </span>
                      {plan.precioAnual != null && plan.tipo !== 'lifetime' && (
                        <p className="text-xs text-secondary">
                          o {formatMoney(plan.precioAnual)} anual
                        </p>
                      )}
                    </div>
                    <ul className="mb-6 flex-1 space-y-2">
                      {(plan.caracteristicas ?? []).map((c) => (
                        <li
                          key={c}
                          className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                          {c}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isUpgrade ? 'primary' : isFeatured && canBuy ? 'primary' : isCurrent ? 'ghost' : 'secondary'}
                      className="w-full"
                      disabled={!canBuy}
                      onClick={() => setCheckoutPlan(plan)}
                    >
                      {isCurrent
                        ? 'Tu plan actual'
                        : plan.tipo === 'free'
                          ? 'Plan por defecto'
                          : isDowngrade
                            ? 'Requiere plan superior'
                            : isUpgrade
                              ? 'Mejorar plan'
                              : 'Suscribirse'}
                    </Button>
                  </Card>
                </StaggerItem>
              )
            })}
          </div>
        )}

        {/* Historial de pagos */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">Mis pagos</h2>
          {paymentsQuery.isLoading ? (
            <SkeletonTable rows={3} />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-7 w-7" />}
              title="Sin pagos todavía"
              description="Cuando te suscribas a un plan aparecerán aquí tus pagos."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-130 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/70 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                    <th className="pb-2 pr-4 font-semibold">Fecha</th>
                    <th className="pb-2 pr-4 font-semibold">Plan</th>
                    <th className="pb-2 pr-4 font-semibold">Monto</th>
                    <th className="pb-2 pr-4 font-semibold">Método</th>
                    <th className="pb-2 pr-4 font-semibold">Ciclo</th>
                    <th className="pb-2 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => {
                    const status = PAYMENT_STATUS[p.estado]
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                        className="border-b border-slate-100 last:border-0 dark:border-white/5"
                      >
                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                          {formatDate(p.creadoEn)}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold capitalize text-slate-700 dark:text-slate-200">
                          {p.planTipo.replace('_', ' ')}
                          {p.detalleTarjeta && (
                            <span className="ml-1 text-xs font-normal text-slate-400">
                              · {p.detalleTarjeta.marca} ····{p.detalleTarjeta.ultimos4}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums text-slate-600 dark:text-slate-300">
                          {formatMoney(Number(p.monto), p.moneda)}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">
                          {METODO_LABEL[p.metodo] ?? p.metodo}
                        </td>
                        <td className="py-2.5 pr-4 capitalize text-slate-500 dark:text-slate-400">
                          {p.ciclo}
                        </td>
                        <td className="py-2.5">
                          <Badge className={status.className}>{status.label}</Badge>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <CheckoutModal
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
        onPaid={() => invalidatePayments()}
      />
    </PageTransition>
  )
}
