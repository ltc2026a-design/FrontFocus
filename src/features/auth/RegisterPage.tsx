import { useMutation } from '@tanstack/react-query'
import { Lock, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { apiErrorMessage, authApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { AuthShell } from './AuthShell'

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const register = useMutation({
    mutationFn: () => authApi.register({ nombre, email, password, aceptaTerminos: true }),
    onSuccess: (data) => {
      setSession(data)
      navigate('/', { replace: true })
    },
    onError: (err) => setFormError(apiErrorMessage(err, 'No se pudo crear la cuenta')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (nombre.trim().length < 2) return setFormError('Ingresa tu nombre (mínimo 2 caracteres)')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setFormError('Email no válido')
    if (password.length < 8) return setFormError('La contraseña debe tener al menos 8 caracteres')
    if (!acepta) return setFormError('Debes aceptar los términos y condiciones')
    register.mutate()
  }

  return (
    <PageTransition>
      <AuthShell
        title="Crea tu cuenta"
        subtitle="Organiza, enfócate y logra más con FocusFlow"
        footer={
          <>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Nombre"
            type="text"
            placeholder="Ada Lovelace"
            autoComplete="name"
            icon={<UserRound className="h-4 w-4" />}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {formError && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {formError}
            </p>
          )}

          <label className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#4C6FFF]"
            />
            <span>
              Acepto los{' '}
              <Link to="/terminos" className="font-semibold text-primary hover:underline">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link to="/privacidad" className="font-semibold text-primary hover:underline">
                política de privacidad
              </Link>
              , y autorizo el uso de notificaciones para avisos de productividad.
            </span>
          </label>

          <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
            Crear cuenta
          </Button>
        </form>
      </AuthShell>
    </PageTransition>
  )
}
