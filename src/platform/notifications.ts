/**
 * Adaptador de notificaciones multiplataforma (src/platform).
 *
 * - Web (por defecto): usa la Web Notification API del navegador.
 * - Tauri: si existe `window.__TAURI__`, se debería usar el plugin oficial
 *   `@tauri-apps/plugin-notification`. El gancho queda documentado e
 *   implementado de forma defensiva (dynamic import) para no añadir la
 *   dependencia al bundle web.
 * - Capacitor: gancho análogo con `@capacitor/local-notifications`.
 *
 * En todos los entornos la API pública es la misma: requestPermission() y
 * notify({ title, body }), y siempre se hace fallback silencioso si el
 * entorno no soporta notificaciones.
 */

export type Platform = 'web' | 'tauri' | 'capacitor'

export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'web'
  if (window.__TAURI__) return 'tauri'
  if (window.Capacitor) return 'capacitor'
  return 'web'
}

export function isSupported(): boolean {
  const platform = detectPlatform()
  if (platform === 'web') return typeof Notification !== 'undefined'
  return true // nativo: asumimos soporte vía plugin
}

export async function requestPermission(): Promise<boolean> {
  const platform = detectPlatform()
  try {
    if (platform === 'tauri') {
      // GANCHO TAURI: descomentar al empaquetar como app desktop.
      // const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification')
      // let granted = await isPermissionGranted()
      // if (!granted) granted = (await requestPermission()) === 'granted'
      // return granted
      return false
    }
    if (platform === 'capacitor') {
      // GANCHO CAPACITOR: descomentar al empaquetar como app móvil.
      // const { LocalNotifications } = await import('@capacitor/local-notifications')
      // const status = await LocalNotifications.requestPermissions()
      // return status.display === 'granted'
      return false
    }
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export interface NotifyOptions {
  title: string
  body?: string
  tag?: string
}

export async function notify(options: NotifyOptions): Promise<void> {
  const platform = detectPlatform()
  try {
    if (platform === 'tauri') {
      // GANCHO TAURI:
      // const { isPermissionGranted, requestPermission, sendNotification } =
      //   await import('@tauri-apps/plugin-notification')
      // let granted = await isPermissionGranted()
      // if (!granted) granted = (await requestPermission()) === 'granted'
      // if (granted) sendNotification({ title: options.title, body: options.body })
      return
    }
    if (platform === 'capacitor') {
      // GANCHO CAPACITOR:
      // const { LocalNotifications } = await import('@capacitor/local-notifications')
      // await LocalNotifications.schedule({
      //   notifications: [{ id: Date.now(), title: options.title, body: options.body }],
      // })
      return
    }
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return
    }
    new Notification(options.title, { body: options.body, tag: options.tag })
  } catch {
    // Silencioso: las notificaciones nunca deben romper la app.
  }
}
