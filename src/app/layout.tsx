import { Outlet } from 'react-router-dom'
import { useUiStore } from '@/stores/uiStore'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useNotificationConsent } from './useNotificationConsent'

/**
 * Layout autenticado. En modo foco (sesión pomodoro de trabajo activa)
 * oculta sidebar/header/bottom-nav y deja la pantalla completa al temporizador.
 */
export function AppLayout() {
  const focusMode = useUiStore((s) => s.focusMode)
  useNotificationConsent()

  // El árbol debe permanecer estable entre modos: si cambiamos la estructura
  // (p. ej. <div> vs <main>) React remonta el <Outlet/> y las páginas pierden
  // su estado local (sesión del pomodoro). Por eso el modo foco solo oculta
  // los elementos de navegación como siblings condicionales.
  return (
    <div className="flex min-h-screen">
      {!focusMode && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!focusMode && <Header />}
        <main
          className={
            focusMode ? 'flex-1' : 'flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8'
          }
        >
          <Outlet />
        </main>
      </div>
      {!focusMode && <BottomNav />}
    </div>
  )
}
