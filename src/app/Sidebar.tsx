import { motion } from 'framer-motion'
import { ChevronsLeft, Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { navItemsFor } from './navItems'

/** Sidebar izquierda fija en desktop, colapsable con animación. */
export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const items = navItemsFor(user?.rol)

  return (
    <aside
      style={{ width: collapsed ? 76 : 244 }}
      className="glass-solid sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200/60 py-4 transition-[width] duration-200 ease-in-out md:flex dark:border-white/10"
    >
      <div className="mb-6 flex items-center gap-2.5 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_18px_rgba(76,111,255,0.45)]">
          <Zap className="h-5 w-5 text-white" fill="currentColor" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="text-lg font-extrabold tracking-tight text-gradient"
          >
            FocusFlow
          </motion.span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/12 text-primary'
                  : 'text-slate-500 hover:bg-black/5 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_rgba(76,111,255,0.8)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        className="mx-3 mt-3 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/8 dark:hover:text-slate-200"
      >
        <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronsLeft className="h-4.5 w-4.5" />
        </motion.span>
        {!collapsed && <span>Colapsar</span>}
      </button>
    </aside>
  )
}
