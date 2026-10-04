import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  title?: string
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  warning: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-secondary" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-primary" />,
}

const accent: Record<ToastType, string> = {
  success: 'border-l-secondary',
  error: 'border-l-danger',
  warning: 'border-l-warning',
  info: 'border-l-primary',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-3), { id, type, message, title }])
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m, t) => toast('success', m, t),
      error: (m, t) => toast('error', m, t),
      warning: (m, t) => toast('warning', m, t),
      info: (m, t) => toast('info', m, t),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`glass-strong pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 px-4 py-3 shadow-xl shadow-black/30 ${accent[t.type]}`}
              role="status"
            >
              <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
              <div className="min-w-0 flex-1">
                {t.title && (
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {t.title}
                  </p>
                )}
                <p className="text-sm break-words text-slate-600 dark:text-slate-300">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
