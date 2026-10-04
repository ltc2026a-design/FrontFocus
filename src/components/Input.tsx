import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, suffix, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-xl border bg-white/60 px-3 text-sm text-slate-900 placeholder:text-slate-400',
            'transition-colors duration-150 outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/30',
            'dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500',
            icon && 'pl-9',
            suffix && 'pr-20',
            error
              ? 'border-danger/60 focus:border-danger focus:ring-danger/30'
              : 'border-slate-300/70 dark:border-white/10',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
})

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children?: React.ReactNode
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-10 w-full rounded-xl border bg-white/60 px-3 text-sm text-slate-900',
          'transition-colors duration-150 outline-none',
          'focus:border-primary focus:ring-2 focus:ring-primary/30',
          'dark:bg-night-3 dark:text-slate-100',
          error
            ? 'border-danger/60'
            : 'border-slate-300/70 dark:border-white/10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})
