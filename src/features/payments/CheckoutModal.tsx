import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, CreditCard, Smartphone, Landmark, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { Input, Select } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { apiErrorMessage, paymentsApi, type CheckoutBody } from '@/lib/api'
import { BRAND_META, detectCardBrand, isPlausibleCard } from '@/lib/cards'
import type { Payment, PaymentMethod, PaymentStatus, Plan } from '@/lib/types'
import { cn, formatMoney } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Validación de tarjeta (marca + Luhn + vencimiento)
// ---------------------------------------------------------------------------

interface CardFields {
  numero: string
  nombre: string
  expiraMM: string
  expiraAA: string
  cvv: string
}

const emptyCard: CardFields = { numero: '', nombre: '', expiraMM: '', expiraAA: '', cvv: '' }

function validateCard(card: CardFields): Partial<Record<keyof CardFields, string>> {
  const errors: Partial<Record<keyof CardFields, string>> = {}
  if (!isPlausibleCard(card.numero)) {
    errors.numero = 'Número de tarjeta inválido (verifica marca, longitud y dígitos)'
  }
  if (card.nombre.trim().length < 3) errors.nombre = 'Ingresa el nombre del titular'
  const mm = Number(card.expiraMM)
  if (!/^\d{1,2}$/.test(card.expiraMM) || mm < 1 || mm > 12) errors.expiraMM = 'Mes inválido (1-12)'
  if (!/^\d{2}$/.test(card.expiraAA)) errors.expiraAA = 'Año inválido (ej. 28)'
  else if (Number(card.expiraAA) < 25) errors.expiraAA = 'La tarjeta está vencida'
  if (!/^\d{3,4}$/.test(card.cvv)) errors.cvv = 'CVV inválido (3-4 dígitos)'
  return errors
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Métodos disponibles (Tarjeta + los locales Nequi y LLAVE/ACH).
const METODOS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: CreditCard },
  { id: 'transferencia', label: 'Transferencia', icon: Landmark },
  { id: 'nequi', label: 'Nequi', icon: Smartphone },
  { id: 'llave', label: 'LLAVE', icon: Landmark },
]

function defaultCiclo(plan: Plan): CheckoutBody['ciclo'] {
  if (plan.tipo === 'lifetime') return 'unico'
  if (plan.tipo === 'pro_anual') return 'anual'
  return 'mensual'
}

// ---------------------------------------------------------------------------
// Modal de checkout
// ---------------------------------------------------------------------------

export function CheckoutModal({
  plan,
  onClose,
  onPaid,
}: {
  plan: Plan | null
  onClose: () => void
  onPaid: (payment: Payment) => void
}) {
  const toast = useToast()
  const [metodo, setMetodo] = useState<PaymentMethod>('tarjeta')
  const [ciclo, setCiclo] = useState<CheckoutBody['ciclo']>('mensual')
  const [card, setCard] = useState<CardFields>(emptyCard)
  const [errors, setErrors] = useState<Partial<Record<keyof CardFields, string>>>({})
  const [result, setResult] = useState<PaymentStatus | null>(null)

  const open = plan !== null

  const checkout = useMutation({
    mutationFn: (body: CheckoutBody) => paymentsApi.checkout(body),
    onSuccess: (payment) => {
      setResult(payment.estado)
      onPaid(payment)
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo procesar el pago')),
  })

  const price = useMemo(() => {
    if (!plan) return 0
    if (plan.tipo === 'lifetime') return plan.precioMensual // precio único
    return ciclo === 'anual' ? (plan.precioAnual ?? plan.precioMensual * 12) : plan.precioMensual
  }, [plan, ciclo])

  // Reset al abrir con otro plan
  const [lastPlanId, setLastPlanId] = useState<string | null>(null)
  if (open && plan!.id !== lastPlanId) {
    setLastPlanId(plan!.id)
    setMetodo('tarjeta')
    setCiclo(defaultCiclo(plan!))
    setCard(emptyCard)
    setErrors({})
    setResult(null)
  }
  if (!open && lastPlanId !== null) {
    setLastPlanId(null)
  }

  if (!plan) return null

  const isPro = plan.tipo === 'pro_mensual' || plan.tipo === 'pro_anual' || plan.tipo === 'free'
  const showCardForm = metodo === 'tarjeta'

  const handleSubmit = () => {
    if (plan.tipo === 'free') {
      toast.info('El plan Free no requiere pago: es tu plan por defecto.')
      return
    }
    if (showCardForm) {
      const errs = validateCard(card)
      setErrors(errs)
      if (Object.keys(errs).length > 0) return
    } else {
      setErrors({})
    }
    checkout.mutate({
      planTipo: plan.tipo,
      metodo,
      ciclo: plan.tipo === 'lifetime' ? 'unico' : ciclo,
      ...(showCardForm
        ? {
            tarjeta: {
              numero: card.numero.replace(/\s/g, ''),
              nombre: card.nombre.trim(),
              expiraMM: card.expiraMM.padStart(2, '0'),
              expiraAA: card.expiraAA,
              cvv: card.cvv,
            },
          }
        : {}),
    })
  }

  const resultConfig: Record<
    Exclude<PaymentStatus, 'reembolsado'>,
    { icon: typeof Check; color: string; ring: string; title: string; text: string }
  > = {
    completado: {
      icon: Check,
      color: 'text-secondary',
      ring: 'border-secondary/40 bg-secondary/10 shadow-[0_0_40px_rgba(34,197,94,0.35)]',
      title: '¡Pago completado!',
      text: 'Tu plan ya está activo. Gracias por confiar en FocusFlow.',
    },
    fallido: {
      icon: X,
      color: 'text-danger',
      ring: 'border-danger/40 bg-danger/10 shadow-[0_0_40px_rgba(239,68,68,0.3)]',
      title: 'Pago fallido',
      text: 'El pago fue rechazado. En este entorno simulado, las Visa (empiezan por 4) se aprueban y las Mastercard (empiezan por 5) se rechazan.',
    },
    pendiente: {
      icon: Clock,
      color: 'text-warning',
      ring: 'border-warning/40 bg-warning/10 shadow-[0_0_40px_rgba(245,158,11,0.3)]',
      title: 'Pago pendiente',
      text: 'Tu pago con este método queda pendiente hasta confirmación manual.',
    },
  }

  return (
    <Modal
      open={open}
      onClose={checkout.isPending ? () => undefined : onClose}
      title={`Checkout — ${plan.nombre}`}
      footer={
        result ? (
          <Button onClick={onClose}>Cerrar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose} disabled={checkout.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={checkout.isPending}>
              <CreditCard className="h-4 w-4" /> Pagar {formatMoney(price)}
            </Button>
          </>
        )
      }
    >
      <AnimatePresence mode="wait">
        {result && result !== 'reembolsado' ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full border-2',
                resultConfig[result as keyof typeof resultConfig].ring,
              )}
            >
              {(() => {
                const Cfg = resultConfig[result as keyof typeof resultConfig]
                return <Cfg.icon className={cn('h-10 w-10', Cfg.color)} strokeWidth={3} />
              })()}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {resultConfig[result as keyof typeof resultConfig].title}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {resultConfig[result as keyof typeof resultConfig].text}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Entorno de prueba simulado: no se procesan pagos reales. Números de muestra válidos:
              Visa <b>4242 4242 4242 4242</b> (aprobada) · Mastercard <b>5111 1111 1111 1118</b> (rechazada).
              El número debe pasar la validación real (marca + Luhn).
            </div>

            {isPro && plan.tipo !== 'lifetime' && (
              <Select
                label="Ciclo de facturación"
                value={ciclo}
                onChange={(e) => setCiclo(e.target.value as CheckoutBody['ciclo'])}
              >
                <option value="mensual">
                  Mensual — {formatMoney(plan.precioMensual)}/mes
                </option>
                {plan.precioAnual != null && (
                  <option value="anual">
                    Anual — {formatMoney(plan.precioAnual)}/año
                  </option>
                )}
              </Select>
            )}

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                Método de pago
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {METODOS.map((m) => {
                  const Icon = m.icon
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodo(m.id)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                        metodo === m.id
                          ? 'border-primary/50 bg-primary/12 text-primary shadow-md'
                          : 'border-slate-200 text-slate-500 hover:bg-black/5 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {showCardForm ? (
              <div className="space-y-3">
                <Input
                  label="Número de tarjeta"
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.numero}
                  error={errors.numero}
                  suffix={
                    (() => {
                      const brand = detectCardBrand(card.numero)
                      if (!brand) return null
                      const meta = BRAND_META[brand]
                      return (
                        <span
                          className={cn(
                            'rounded-md bg-gradient-to-br px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm',
                            meta.gradient,
                            meta.text,
                          )}
                        >
                          {meta.label}
                        </span>
                      )
                    })()
                  }
                  onChange={(e) => setCard((c) => ({ ...c, numero: formatCardNumber(e.target.value) }))}
                />
                <Input
                  label="Nombre del titular"
                  placeholder="Como aparece en la tarjeta"
                  value={card.nombre}
                  error={errors.nombre}
                  onChange={(e) => setCard((c) => ({ ...c, nombre: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="MM"
                    placeholder="12"
                    inputMode="numeric"
                    maxLength={2}
                    value={card.expiraMM}
                    error={errors.expiraMM}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, expiraMM: e.target.value.replace(/\D/g, '').slice(0, 2) }))
                    }
                  />
                  <Input
                    label="AA"
                    placeholder="28"
                    inputMode="numeric"
                    maxLength={2}
                    value={card.expiraAA}
                    error={errors.expiraAA}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, expiraAA: e.target.value.replace(/\D/g, '').slice(0, 2) }))
                    }
                  />
                  <Input
                    label="CVV"
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={4}
                    value={card.cvv}
                    error={errors.cvv}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {
                  {
                    paypal: 'Serás redirigido a PayPal para confirmar (simulado). El pago quedará pendiente.',
                    transferencia: 'Recibirás las instrucciones de transferencia por email (simulado). El pago quedará pendiente.',
                    nequi: 'Te enviaremos la solicitud a tu número Nequi para que la apruebes en la app. El pago quedará pendiente hasta confirmación.',
                    llave: 'El pago se procesará por el sistema de transferencias LLAVE (ACH). Quedará pendiente hasta conciliación bancaria.',
                  }[metodo as 'paypal' | 'transferencia' | 'nequi' | 'llave']
                }
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}
