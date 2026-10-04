import { motion } from 'framer-motion'

/** Transición de página (fade + slide) usada al cambiar de ruta. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

/** Entrada escalonada para listas de tarjetas. */
export function StaggerItem({
  index,
  children,
  className,
}: {
  index: number
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.045, 0.45), ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
