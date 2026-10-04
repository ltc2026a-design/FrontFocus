import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              // glass-solid: un modal que entra con scale sobre una capa con
              // backdrop-blur obliga a re-dibujar el desenfoque en cada cuadro.
              'glass-solid relative z-10 w-full max-w-lg rounded-2xl shadow-2xl shadow-black/40',
              'max-h-[90vh] flex flex-col',
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4 dark:border-white/10">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <div className="flex justify-end gap-2 border-t border-slate-200/60 px-5 py-4 dark:border-white/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
