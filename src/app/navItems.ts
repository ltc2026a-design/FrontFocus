import {
  CalendarClock,
  ChartColumn,
  CreditCard,
  FolderKanban,
  Grid2X2,
  History,
  LayoutDashboard,
  ShieldCheck,
  Timer,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import type { Rol } from '@/lib/types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Solo visible para ADMIN. */
  adminOnly?: boolean
  /** Aparece en la bottom bar móvil. */
  mobilePrimary?: boolean
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, mobilePrimary: true, end: true },
  { to: '/matrix', label: 'Matriz', icon: Grid2X2, mobilePrimary: true },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer, mobilePrimary: true },
  { to: '/timeblocks', label: 'Time-Blocking', icon: CalendarClock },
  { to: '/metrics', label: 'Métricas', icon: ChartColumn, mobilePrimary: true },
  { to: '/history', label: 'Historial', icon: History },
  { to: '/payments', label: 'Pagos', icon: CreditCard },
  { to: '/profile', label: 'Perfil', icon: UserRound },
  { to: '/admin', label: 'Admin', icon: ShieldCheck, adminOnly: true },
]

export function navItemsFor(rol: Rol | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || rol === 'ADMIN')
}
