import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type {
  NotificationType,
  PaymentStatus,
  ProjectStatus,
  Quadrant,
  TaskStatus,
} from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---------------------------------------------------------------------------
// Cuadrantes de Eisenhower
// ---------------------------------------------------------------------------

export interface QuadrantConfig {
  id: Quadrant
  label: string
  shortLabel: string
  hex: string
  border: string
  bg: string
  text: string
  badge: string
  dot: string
}

export const QUADRANTS: QuadrantConfig[] = [
  {
    id: 'urgente_importante',
    label: 'Urgente e Importante',
    shortLabel: 'Hacer ya',
    hex: '#EF4444',
    border: 'border-danger/50',
    bg: 'bg-danger/10',
    text: 'text-danger',
    badge: 'bg-danger/15 text-danger border border-danger/30',
    dot: 'bg-danger',
  },
  {
    id: 'urgente_no_importante',
    label: 'Urgente, No Importante',
    shortLabel: 'Delegar',
    hex: '#F59E0B',
    border: 'border-warning/50',
    bg: 'bg-warning/10',
    text: 'text-warning',
    badge: 'bg-warning/15 text-warning border border-warning/30',
    dot: 'bg-warning',
  },
  {
    id: 'no_urgente_importante',
    label: 'No Urgente, Importante',
    shortLabel: 'Planificar',
    hex: '#4C6FFF',
    border: 'border-primary/50',
    bg: 'bg-primary/10',
    text: 'text-primary',
    badge: 'bg-primary/15 text-primary border border-primary/30',
    dot: 'bg-primary',
  },
  {
    id: 'no_urgente_no_importante',
    label: 'No Urgente, No Importante',
    shortLabel: 'Eliminar / luego',
    hex: '#22C55E',
    border: 'border-secondary/40',
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    badge: 'bg-secondary/15 text-secondary border border-secondary/30',
    dot: 'bg-secondary',
  },
]

export const quadrantConfig = (q: Quadrant): QuadrantConfig =>
  QUADRANTS.find((it) => it.id === q) ?? QUADRANTS[0]

// ---------------------------------------------------------------------------
// Estados / badges
// ---------------------------------------------------------------------------

export const TASK_STATUS: Record<TaskStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-white/10 text-slate-500 dark:text-slate-300 border border-white/15' },
  en_progreso: { label: 'En progreso', className: 'bg-primary/15 text-primary border border-primary/30' },
  completada: { label: 'Completada', className: 'bg-secondary/15 text-secondary border border-secondary/30' },
  eliminada: { label: 'Eliminada', className: 'bg-danger/15 text-danger border border-danger/30' },
}

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; className: string }> = {
  activo: { label: 'Activo', className: 'bg-secondary/15 text-secondary border border-secondary/30' },
  pausado: { label: 'Pausado', className: 'bg-warning/15 text-warning border border-warning/30' },
  completado: { label: 'Completado', className: 'bg-primary/15 text-primary border border-primary/30' },
  archivado: { label: 'Archivado', className: 'bg-white/10 text-slate-400 border border-white/15' },
}

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-warning/15 text-warning border border-warning/30' },
  completado: { label: 'Completado', className: 'bg-secondary/15 text-secondary border border-secondary/30' },
  fallido: { label: 'Fallido', className: 'bg-danger/15 text-danger border border-danger/30' },
  reembolsado: { label: 'Reembolsado', className: 'bg-primary/15 text-primary border border-primary/30' },
}

export const NOTIFICATION_TYPE: Record<NotificationType, { label: string; className: string }> = {
  info: { label: 'Info', className: 'bg-primary/15 text-primary border border-primary/30' },
  warning: { label: 'Aviso', className: 'bg-warning/15 text-warning border border-warning/30' },
  deadline: { label: 'Límite', className: 'bg-danger/15 text-danger border border-danger/30' },
  payment: { label: 'Pago', className: 'bg-secondary/15 text-secondary border border-secondary/30' },
}

// ---------------------------------------------------------------------------
// Fechas / formato
// ---------------------------------------------------------------------------

// Formatters Intl reutilizables: construirlos en cada llamada era lo más caro
// de pintar listas de tareas (un formateador nuevo por tarjeta y por re-render).
const dateFormat = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const moneyFormats = new Map<string, Intl.NumberFormat>()

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateFormat.format(d)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return dateTimeFormat.format(d)
}

export function formatMinutes(min: number | null | undefined): string {
  if (min == null || Number.isNaN(min)) return '—'
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** yyyy-mm-dd en hora local (para inputs type=date y query de timeblocks). */
export function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isOverdue(fechaLimite: string | null | undefined): boolean {
  if (!fechaLimite) return false
  const d = new Date(fechaLimite)
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now()
}

/** Formatea montos como moneda. */
export function formatMoney(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  let fmt = moneyFormats.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency })
    moneyFormats.set(currency, fmt)
  }
  return fmt.format(amount)
}

// ---------------------------------------------------------------------------
// Zonas horarias comunes (perfil)
// ---------------------------------------------------------------------------

export const COMMON_TIMEZONES = [
  'UTC',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Caracas',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Africa/Casablanca',
  'Asia/Jerusalem',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]
