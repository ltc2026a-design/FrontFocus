import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { apiErrorMessage, apiErrorCode, authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { AuthShell } from './AuthShell'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      setSession(data)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from || '/', { replace: true })
    },
    onError: (err) => {
      const code = apiErrorCode(err)
      if (code === 'LOGIN_BLOCKED') {
        setFormError(
          'Demasiados intentos fallidos. Tu acceso está bloqueado temporalmente por 15 minutos. Intenta más tarde.',
        )
      } else {
        setFormError(apiErrorMessage(err, 'No se pudo iniciar sesión'))
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!email.trim() || !password) {
      setFormError('Ingresa tu email y contraseña')
      return
    }
    login.mutate()
  }

  return (
    <PageTransition>
      <AuthShell
        title="Bienvenido de vuelta"
        subtitle="Entra para recuperar tu foco"
        footer={
          <>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Regístrate
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
          >
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </motion.div>

          {formError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {formError}
            </motion.p>
          )}

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
            Iniciar sesión
          </Button>
        </form>
      </AuthShell>
    </PageTransition>
  )
}
