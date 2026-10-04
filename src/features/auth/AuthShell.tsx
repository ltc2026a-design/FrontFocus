import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

/** Fondo animado con orbes de gradiente para las pantallas de auth. */
export function AuthBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,111,255,0.10),transparent_60%)]" />
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/25 blur-[110px]"
      />
      <motion.div
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#7dd3fc]/10 blur-[90px]"
      />
    </div>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="glass-strong relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-black/40"
      >
        <Link to="/login" className="mb-6 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_22px_rgba(76,111,255,0.5)]">
            <Zap className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gradient">FocusFlow</span>
        </Link>
        <h1 className="text-center text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-400 dark:text-slate-500">
          {subtitle}
        </p>
        {children}
        <div className="mt-6 text-center text-sm text-slate-400 dark:text-slate-500">{footer}</div>
      </motion.div>
    </div>
  )
}
