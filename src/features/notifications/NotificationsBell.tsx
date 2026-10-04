import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Spinner } from '@/components/Spinner'
import { apiErrorMessage, notificationsApi } from '@/lib/api'
import { NOTIFICATION_TYPE, cn, formatDateTime } from '@/lib/utils'

/** Campana de notificaciones con contador de no leídas (GET /notifications). */
export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const unread = data?.noLeidas ?? 0
  const items = data?.data ?? []

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="glass-strong absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3 dark:border-white/10">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Notificaciones</p>
              {unread > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}
              {!isLoading && items.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
                  <BellOff className="h-6 w-6" />
                  <p className="text-xs">Sin notificaciones</p>
                </div>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.leida && markRead.mutate(n.id)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 dark:border-white/5',
                    !n.leida && 'bg-primary/5',
                    'hover:bg-black/5 dark:hover:bg-white/5',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={NOTIFICATION_TYPE[n.tipo]?.className}>
                      {NOTIFICATION_TYPE[n.tipo]?.label ?? n.tipo}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{formatDateTime(n.creadoEn)}</span>
                  </div>
                  <p
                    className={cn(
                      'text-xs text-slate-600 dark:text-slate-300',
                      !n.leida && 'font-semibold',
                    )}
                  >
                    {n.mensaje}
                  </p>
                </button>
              ))}
              {!isLoading && items.length === 0 && data === undefined && (
                <p className="px-4 py-6 text-center text-xs text-slate-400">
                  {apiErrorMessage(new Error('Sin conexión'), 'No se pudo conectar con el servidor')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
