/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  /** Presente cuando la app corre dentro de un WebView de Tauri. */
  __TAURI__?: unknown
  /** Presente cuando la app corre dentro de Capacitor (nativo). */
  Capacitor?: unknown
}
