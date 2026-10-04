import { useMutation } from '@tanstack/react-query'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { useToast } from '@/components/Toast'
import { apiErrorMessage, authApi } from '@/lib/api'
import { AuthShell } from './AuthShell'

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const toast = useToast()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = useMutation({
    mutationFn: () => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.')
      navigate('/login', { replace: true })
    },
    onError: (err) => setError(apiErrorMessage(err, 'No se pudo restablecer la contraseña')),
  })

  if (!token) {
    return (
      <PageTransition>
        <AuthShell
          title="Enlace inválido"
          subtitle="Falta el token de restablecimiento"
          footer={
            <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
              Solicitar un nuevo enlace
            </Link>
          }
        >
          <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Este enlace no es válido o está incompleto.
          </div>
        </AuthShell>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <AuthShell
        title="Nueva contraseña"
        subtitle="Elige una contraseña segura (mínimo 8 caracteres)"
        footer={
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Volver al inicio de sesión
          </Link>
        }
      >
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
            if (password !== confirm) return setError('Las contraseñas no coinciden')
            reset.mutate()
          }}
        >
          <Input
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && (
            <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={reset.isPending}>
            Restablecer contraseña
          </Button>
        </form>
      </AuthShell>
    </PageTransition>
  )
}
