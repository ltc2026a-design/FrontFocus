/**
 * Adaptador unificado de permisos multiplataforma (src/platform).
 *
 * Centraliza el consentimiento/permisos que la app solicita al usuario,
 * cumpliendo la normativa (solo se pide un permiso cuando hace falta y con una
 * finalidad clara). Detecta el entorno (web / Tauri / Capacitor) y hace fallback
 * silencioso cuando el permiso no está disponible.
 */
import { detectPlatform, requestPermission as requestNotifPermission } from './notifications'

export type PermissionKind = 'notifications'

export interface PermissionState {
  granted: boolean
  /** 'granted' | 'denied' | 'prompt' | 'unsupported' */
  status: string
}

/** Estado actual del permiso de notificaciones (sin pedirlo). */
export function notificationsStatus(): PermissionState {
  const platform = detectPlatform()
  if (platform === 'web') {
    if (typeof Notification === 'undefined') return { granted: false, status: 'unsupported' }
    return { granted: Notification.permission === 'granted', status: Notification.permission }
  }
  // Nativo: el estado fino depende del plugin; reportamos 'prompt' genérico.
  return { granted: false, status: 'prompt' }
}

/** Solicita el permiso al usuario (debe invocarse tras una acción explícita). */
export async function requestNotifications(): Promise<PermissionState> {
  const granted = await requestNotifPermission()
  return { granted, status: granted ? 'granted' : notificationsStatus().status }
}

/** Punto único de consentimiento: pide solo los permisos indicados. */
export async function requestPermissions(kinds: PermissionKind[]): Promise<Record<PermissionKind, PermissionState>> {
  const out = {} as Record<PermissionKind, PermissionState>
  for (const kind of kinds) {
    if (kind === 'notifications') out.notifications = await requestNotifications()
  }
  return out
}
