/**
 * Adaptador de notificaciones multiplataforma (src/platform).
 *
 * - Web (por defecto): usa la Web Notification API del navegador.
 * - Tauri: si existe `window.__TAURI__`, se debería usar el plugin oficial
 *   `@tauri-apps/plugin-notification`. El gancho queda documentado e
 *   implementado de forma defensiva (dynamic import) para no añadir la
 *   dependencia al bundle web.
 * - Capacitor: `@capacitor/local-notifications`, cargado con dynamic import
 *   para que el código nativo no pese en el bundle web.
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
  return platform === 'capacitor'
}

/** 'granted' | 'denied' | 'prompt' | 'unsupported' — sin molestar al usuario. */
export async function permissionStatus(): Promise<string> {
  const platform = detectPlatform()
  try {
    if (platform === 'capacitor') {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const status = await LocalNotifications.checkPermissions()
      return status.display === 'granted' ? 'granted' : status.display === 'denied' ? 'denied' : 'prompt'
    }
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  } catch {
    return 'unsupported'
  }
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
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const status = await LocalNotifications.requestPermissions()
      return status.display === 'granted'
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

/** Android exige id numérico único por notificación local. */
let lastId = Math.floor(Date.now() / 1000)

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
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const granted = await requestPermission()
      if (!granted) return
      const id = Math.max(lastId + 1, Math.floor(Date.now() / 1000))
      lastId = id
      await LocalNotifications.schedule({
        notifications: [{ id, title: options.title, body: options.body ?? '' }],
      })
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
