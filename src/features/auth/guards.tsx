import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

/** Bloquea el acceso si no hay sesión: redirige a /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/** Exige rol ADMIN (contrato: rutas /admin → 403 ADMIN_REQUIRED). */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.rol !== 'ADMIN') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

/** Si ya hay sesión, evita mostrar /login y /register. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  if (accessToken && user) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
