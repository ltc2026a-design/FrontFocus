import { useEffect } from 'react'
import { useToast } from '@/components/Toast'
import { detectPlatform } from '@/platform/notifications'
import { notificationsStatus, requestNotifications } from '@/platform/permissions'

const KEY = 'focusflow.notifAsked'

/**
 * Al entrar a la app (ya autenticado) pide una sola vez el permiso del sistema
 * de notificaciones, que es lo que permite entregar los avisos de fecha límite.
 * En web la API existe pero el permiso solo se concede tras un gesto del
 * usuario, así que ahí no se molesta al abrir.
 */
export function useNotificationConsent() {
  const toast = useToast()

  useEffect(() => {
    if (detectPlatform() !== 'capacitor') return
    if (localStorage.getItem(KEY)) return
    let cancelled = false

    ;(async () => {
      const current = await notificationsStatus()
      if (cancelled) return
      if (current.status !== 'prompt') {
        localStorage.setItem(KEY, '1')
        return
      }
      const result = await requestNotifications()
      if (cancelled) return
      localStorage.setItem(KEY, '1')
      if (result.granted) toast.success('Activados los avisos de fechas límite')
      else toast.info('Sin permiso de notificaciones no habrá recordatorios')
    })()

    return () => {
      cancelled = true
    }
  }, [toast])
}
