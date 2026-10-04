import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary',
        className,
      )}
    />
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-40 w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
