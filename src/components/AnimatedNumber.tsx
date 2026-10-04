import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  decimals?: number
  suffix?: string
  duration?: number
  className?: string
}

/** Número con animación de conteo cuando entra en viewport. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  duration = 0.9,
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  // once: con inView repetido, cada scroll reiniciaba el conteo y re-renderizaba
  // el componente un par de decenas de veces por segundo.
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const progress = useMotionValue(0)
  const display = useTransform(progress, (v) => `${v.toFixed(decimals)}${suffix}`)

  useEffect(() => {
    if (!inView) return
    const from = progress.get()
    const controls = animate(from, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => progress.set(v),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, duration])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 6 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: 0.3 }}
      className={cn('tabular-nums', className)}
    >
      {display}
    </motion.span>
  )
}
