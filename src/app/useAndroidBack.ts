import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { detectPlatform } from '@/platform/notifications'
import { useUiStore } from '@/stores/uiStore'

/**
 * Botón Atrás de Android. Sin esto la WebView hace `history.back()` y en la
 * pantalla inicial saca de la app. Orden de prioridad: cerrar modal abierto →
 * salir del modo foco → retroceder en la SPA → (doble pulsación) salir.
 */
export function useAndroidBack() {
  const navigate = useNavigate()
  const toast = useToast()
  const setFocusMode = useUiStore((s) => s.setFocusMode)
  const lastExitAttempt = useRef(0)

  useEffect(() => {
    if (detectPlatform() !== 'capacitor') return
    let remove: (() => void) | undefined
    let disposed = false

    import('@capacitor/app').then(({ App }) => {
      if (disposed) return
      App.addListener('backButton', () => {
        if (document.querySelector('[role="dialog"]')) {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
          return
        }
        if (useUiStore.getState().focusMode) {
          setFocusMode(false)
          return
        }
        // react-router guarda en el estado de history su índice dentro del historial.
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
        if (idx > 0) {
          navigate(-1)
          return
        }
        const now = Date.now()
        if (now - lastExitAttempt.current < 2000) {
          void App.exitApp()
          return
        }
        lastExitAttempt.current = now
        toast.info('Presiona Atrás otra vez para salir')
      }).then((handle) => {
        remove = () => void handle.remove()
      })
    })

    return () => {
      disposed = true
      remove?.()
    }
  }, [navigate, setFocusMode, toast])
}
