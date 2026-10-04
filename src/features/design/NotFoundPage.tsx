import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { PageTransition } from '@/components/PageTransition'
import { AuthBackground } from '@/features/auth/AuthShell'

export function NotFoundPage() {
  return (
    <PageTransition>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <AuthBackground />
        <p className="relative z-10 text-7xl font-extrabold text-gradient">404</p>
        <h1 className="relative z-10 mt-3 text-xl font-bold text-slate-700 dark:text-slate-200">
          Página no encontrada
        </h1>
        <p className="relative z-10 mt-1 max-w-sm text-sm text-slate-400 dark:text-slate-500">
          La ruta que buscas no existe o fue movida. Vuelve al inicio y retoma tu foco.
        </p>
        <Link to="/" className="relative z-10 mt-6">
          <Button>
            <Compass className="h-4 w-4" /> Ir al Dashboard
          </Button>
        </Link>
      </div>
    </PageTransition>
  )
}
