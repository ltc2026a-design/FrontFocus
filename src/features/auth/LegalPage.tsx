import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { PageTransition } from '@/components/PageTransition'

function LegalShell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Zap className="h-4 w-4 text-white" fill="currentColor" />
          </div>
          <span className="text-lg font-extrabold text-gradient">FocusFlow</span>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-1 text-xs text-slate-400">Última actualización: {updated}</p>
        <div className="prose-legal mt-6 space-y-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {children}
        </div>
        <div className="mt-8 flex gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Volver
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(76,111,255,0.35)]"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-6 text-base font-bold text-slate-800 dark:text-slate-100">{children}</h2>
)

export function TermsPage() {
  return (
    <LegalShell title="Términos y Condiciones" updated="3 de octubre de 2026">
      <p>
        Al crear una cuenta en <b>FocusFlow</b> aceptas estos términos. El servicio se ofrece "tal
        cual", para uso personal de organización y productividad.
      </p>
      <H>1. Tu cuenta</H>
      <p>
        Debes suministrar un correo real y mantener tu contraseña segura. Eres responsable de toda
        actividad bajo tu cuenta. Puedes cerrar tu cuenta cuando quieras.
      </p>
      <H>2. Uso permitido</H>
      <p>
        No puedes usar FocusFlow para actividades ilegales, ni intentar acceder a datos de otros
        usuarios, ni sobrecargar el servicio.
      </p>
      <H>3. Planes y pagos</H>
      <p>
        Los planes de pago (Pro mensual, Pro anual y Lifetime) se activan al completarse el cobro.
        Puedes <b>mejorar</b> tu plan en cualquier momento; no se te permite adquirir un plan igual o
        inferior al que ya tienes activo. Las suscripciones pueden cancelarse y mantenerán el acceso
        hasta el final del periodo pagado. Los reembolsos se gestionan contacto con soporte.
      </p>
      <H>4. Disponibilidad</H>
      <p>
        Nos esforzamos por mantener el servicio disponible, pero no garantizamos funcionamiento
        ininterrumpido. Podemos cambiar o descontinuar funcionalidades avisando con antelación.
      </p>
      <H>5. Limitación de responsabilidad</H>
      <p>
        FocusFlow no es responsable por pérdidas de datos ni por decisiones tomadas con base en la
        información de la app. Exporta tus datos periódicamente.
      </p>
    </LegalShell>
  )
}

export function PrivacyPage() {
  return (
    <LegalShell title="Política de Privacidad" updated="3 de octubre de 2026">
      <p>
        Tu privacidad importa. Esta política describe qué datos recogemos y cómo los usamos.
      </p>
      <H>Datos que recogemos</H>
      <p>
        Nombre, correo electrónico y contraseña (almacenada cifrada con bcrypt). Además, el contenido
        que creas: tareas, proyectos, sesiones y métricas. Puedes editar o eliminar esta información.
      </p>
      <H>Permisos del dispositivo</H>
      <p>
        <b>Notificaciones:</b> las solicitamos solo para avisos de productividad (fines de pomodoro,
        vencimientos). Puedes revocarlas desde la configuración de tu navegador o del sistema.
        No usamos otros permisos sin tu consentimiento.
      </p>
      <H>Pagos</H>
      <p>
        No almacenamos números de tarjeta completos: solo los últimos 4 dígitos y la marca. Los cobros
        se procesan de forma simulada en este entorno.
      </p>
      <H>Tus derechos</H>
      <p>
        Puedes acceder y exportar tus datos (JSON/CSV) desde tu perfil, corregirlos y solicitar la
        eliminación de tu cuenta y sus datos asociados.
      </p>
      <H>Contacto</H>
      <p>Para dudas sobre privacidad escribe a soporte@focusflow.app.</p>
    </LegalShell>
  )
}
