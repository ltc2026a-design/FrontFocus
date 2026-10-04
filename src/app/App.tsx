import { MotionConfig } from 'framer-motion'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { Providers } from './providers'
import { useTheme } from '@/hooks/useTheme'

function ThemeBootstrap() {
  // Aplica la clase `dark` en <html> según el tema persistido.
  useTheme()
  return null
}

export function App() {
  return (
    <Providers>
      <ThemeBootstrap />
      {/* reducedMotion="user": respeta la preferencia del sistema para
          usuarios que desactivan las animaciones por accesibilidad. */}
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </MotionConfig>
    </Providers>
  )
}
