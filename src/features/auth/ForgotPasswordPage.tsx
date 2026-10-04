import { useMutation } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { apiErrorMessage, authApi } from '@/lib/api'
import { AuthShell } from './AuthShell'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const forgot = useMutation({
    mutationFn: () => authApi.forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: (err) => setError(apiErrorMessage(err, 'No se pudo procesar la solicitud')),
  })

  return (
    <PageTransition>
      <AuthShell
        title="Recupera tu acceso"
        subtitle="Te enviaremos un enlace para restablecer la contraseña"
        footer={
          <>
            ¿La recordaste?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </>
        }
      >
        {sent ? (
          <div className="rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            Si <b>{email}</b> está registrado, recibirás un correo con el enlace de restablecimiento
            (vence en 30 minutos). Revisa también tu carpeta de spam.
          </div>
        ) : (
          <form
            className="space-y-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Email no válido')
              forgot.mutate()
            }}
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
            {error && (
              <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={forgot.isPending}>
              Enviar enlace
            </Button>
          </form>
        )}
      </AuthShell>
    </PageTransition>
  )
}
