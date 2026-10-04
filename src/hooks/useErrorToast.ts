import { useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'
import { apiErrorMessage } from '@/lib/api'

/**
 * Muestra un toast de error una sola vez por "key" cuando una query falla.
 * Evita spam de toasts al reintentar y garantiza que ningún error pase en silencio.
 */
export function useErrorToast(error: unknown, key: string, fallback?: string) {
  const toast = useToast()
  const shown = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (error && !shown.current.has(key)) {
      shown.current.add(key)
      toast.error(apiErrorMessage(error, fallback ?? 'No se pudieron cargar los datos'))
    }
  }, [error, key, toast, fallback])
}
