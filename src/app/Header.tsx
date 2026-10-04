import { motion } from 'framer-motion'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { authApi } from '@/lib/api'
import { NotificationsBell } from '@/features/notifications/NotificationsBell'

/** Header superior: nombre de usuario, notificaciones, tema y logout. */
export function Header() {
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // El backend puede estar caído; el logout local procede igual.
    } finally {
      logoutStore()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="glass-solid sticky top-0 z-40 flex h-16 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
          {user?.nombre ?? '—'}
        </p>
        <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
      </div>

      <div className="flex items-center gap-1">
        <NotificationsBell />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-danger/10 hover:text-danger dark:text-slate-400"
        >
          <LogOut className="h-5 w-5" />
        </motion.button>
      </div>
    </header>
  )
}
