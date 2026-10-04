import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  /** Aplica glassmorphism sutil (por defecto true). */
  glass?: boolean
  hoverable?: boolean
  children?: React.ReactNode
}

export function Card({ glass = true, hoverable = false, className, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={
        hoverable
          ? {
              y: -3,
              boxShadow: '0 10px 40px -10px rgba(76,111,255,0.35)',
              transition: { duration: 0.2, ease: 'easeOut' },
            }
          : undefined
      }
      className={cn(
        'rounded-2xl',
        glass && 'glass',
        !glass && 'bg-white border border-slate-200 dark:bg-night-2 dark:border-white/10',
        hoverable && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
