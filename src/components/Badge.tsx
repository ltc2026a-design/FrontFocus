import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'custom'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children?: React.ReactNode
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary/15 text-primary border border-primary/30',
  secondary: 'bg-secondary/15 text-secondary border border-secondary/30',
  warning: 'bg-warning/15 text-warning border border-warning/30',
  danger: 'bg-danger/15 text-danger border border-danger/30',
  neutral: 'bg-slate-500/10 text-slate-500 dark:text-slate-300 border border-slate-400/20',
  custom: '',
}

export function Badge({ variant = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
