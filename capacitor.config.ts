import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Configuración de Capacitor para FocusFlow (app móvil).
 * El webDir apunta al build de Vite (dist). La app NO hace fetch a localhost en
 * el dispositivo: define VITE_API_URL a la URL pública de la API antes de compilar.
 *
 * Uso (requiere Android Studio / Xcode para el build nativo):
 *   npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/local-notifications
 *   npm run build && npx cap sync
 *   npx cap add android && npx cap open android
 */
const config: CapacitorConfig = {
  appId: 'app.focusflow.mobile',
  appName: 'FocusFlow',
  webDir: 'dist',
  backgroundColor: '#070B14',
  android: { allowMixedContent: false },
  ios: {
    scheme: 'FocusFlow',
    preferences: {
      // Permite que la WebView use la Web Notification API donde aplique.
      ScrollEnabled: true,
      WKWebViewConfiguration: {},
    },
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#4C6FFF',
    },
  },
}

export default config
