import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  /** Modo foco del Pomodoro: oculta sidebar/header y muestra solo el temporizador. */
  focusMode: boolean
  setFocusMode: (value: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (value: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      focusMode: false,
      setFocusMode: (value) => set({ focusMode: value }),
      sidebarCollapsed: false,
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
    }),
    {
      name: 'focusflow-ui',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
