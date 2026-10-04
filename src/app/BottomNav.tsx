import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { navItemsFor } from './navItems'

/** Bottom bar móvil: 4 accesos primarios + menú "Más". */
export function BottomNav() {
  const user = useAuthStore((s) => s.user)
  const [moreOpen, setMoreOpen] = useState(false)
  const items = navItemsFor(user?.rol)
  const primary = items.filter((i) => i.mobilePrimary)
  const secondary = items.filter((i) => !i.mobilePrimary)

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="glass-solid absolute bottom-16 left-3 right-3 rounded-2xl p-3"
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Más opciones</p>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Cerrar menú"
                  className="rounded-lg p-1 text-slate-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {secondary.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[11px] font-medium transition-colors',
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/8',
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="glass-solid fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch justify-around border-t border-slate-200/60 px-2 md:hidden dark:border-white/10">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors',
            moreOpen
              ? 'text-primary'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Más
        </button>
      </nav>
    </>
  )
}
