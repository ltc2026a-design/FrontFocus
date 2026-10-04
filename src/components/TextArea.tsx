import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const areaId = id ?? generatedId
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={areaId}
          className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        className={cn(
          'w-full rounded-xl border bg-white/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
          'transition-colors duration-150 outline-none resize-y min-h-20',
          'focus:border-primary focus:ring-2 focus:ring-primary/30',
          'dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500',
          error ? 'border-danger/60' : 'border-slate-300/70 dark:border-white/10',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})
