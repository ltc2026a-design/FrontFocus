/**
 * Adaptador unificado de permisos multiplataforma (src/platform).
 *
 * Centraliza el consentimiento/permisos que la app solicita al usuario,
 * cumpliendo la normativa (solo se pide un permiso cuando hace falta y con una
 * finalidad clara). Detecta el entorno (web / Tauri / Capacitor) y hace fallback
 * silencioso cuando el permiso no está disponible.
 */
import {
  detectPlatform,
  permissionStatus,
  requestPermission as requestNotifPermission,
} from './notifications'

export type PermissionKind = 'notifications'

export interface PermissionState {
  granted: boolean
  /** 'granted' | 'denied' | 'prompt' | 'unsupported' */
  status: string
}

/** Estado actual del permiso de notificaciones (sin pedirlo). */
export async function notificationsStatus(): Promise<PermissionState> {
  const status = await permissionStatus()
  if (status === 'unsupported' && detectPlatform() !== 'web') {
    return { granted: false, status: 'unsupported' }
  }
  return { granted: status === 'granted', status }
}

/** Solicita el permiso al usuario (debe invocarse tras una acción explícita). */
export async function requestNotifications(): Promise<PermissionState> {
  const granted = await requestNotifPermission()
  return { granted, status: granted ? 'granted' : (await notificationsStatus()).status }
}

/** Punto único de consentimiento: pide solo los permisos indicados. */
export async function requestPermissions(
  kinds: PermissionKind[],
): Promise<Record<PermissionKind, PermissionState>> {
  const out = {} as Record<PermissionKind, PermissionState>
  for (const kind of kinds) {
    if (kind === 'notifications') out.notifications = await requestNotifications()
  }
  return out
}
