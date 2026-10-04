import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { saveOrShareFile } from '@/platform/files'
import { useAuthStore } from '@/stores/authStore'
import type {
  AdminStats,
  AdminUser,
  AuthResponse,
  HistoryEvent,
  HistoryResponse,
  MetricsResponse,
  Notification,
  NotificationsResponse,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Plan,
  Project,
  ProjectStatus,
  Quadrant,
  PomodoroSession,
  PomodoroType,
  SubscriptionCurrent,
  Subtask,
  Task,
  TaskStatus,
  TimeBlock,
  User,
} from './types'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Extrae el mensaje legible de un error de la API (contrato: { error: { code, message } }). */
export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (err instanceof AxiosError) {
    if (!err.response) {
      // Error de red / servidor caído: mensaje amigable en vez de "Network Error".
      return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.'
    }
    const data = err.response?.data as { error?: { code?: string; message?: string } } | undefined
    return data?.error?.message || err.message || fallback
  }
  if (err instanceof Error) return err.message || fallback
  return fallback
}

export function apiErrorCode(err: unknown): string | undefined {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { code?: string } } | undefined
    return data?.error?.code
  }
  return undefined
}

// Interceptor de request: adjunta el accessToken del store de auth.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de respuesta 401: intenta POST /auth/refresh una sola vez y reintenta.
let refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState()
  if (!refreshToken) return null
  try {
    // Usamos axios "pelado" para evitar el interceptor y loops.
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    )
    setTokens({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    })
    return res.data.accessToken
  } catch {
    logout()
    if (window.location.pathname !== '/login') {
      window.location.assign('/login')
    }
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      // No intentar refrescar con las propias rutas de auth.
      const url = original.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return Promise.reject(error)
      }
      original._retry = true
      refreshPromise = refreshPromise || tryRefresh()
      const newToken = await refreshPromise
      refreshPromise = null
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Auth / usuario
// ---------------------------------------------------------------------------

export const authApi = {
  register: (body: { nombre: string; email: string; password: string; aceptaTerminos: boolean }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  me: () => api.get<{ user: User }>('/me').then((r) => r.data.user),
  updateMe: (body: {
    nombre?: string
    zonaHoraria?: string
    temaPreferido?: string
    avatarUrl?: string | null
  }) => api.patch<{ user: User }>('/me', body).then((r) => r.data.user),
}

// ---------------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------------

export const projectsApi = {
  list: () => api.get<{ data: Project[] }>('/projects').then((r) => r.data.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (body: { titulo: string; descripcion?: string }) =>
    api.post<Project>('/projects', body).then((r) => r.data),
  update: (id: string, body: { titulo?: string; descripcion?: string; estado?: ProjectStatus }) =>
    api.patch<Project>(`/projects/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/projects/${id}`),
}

// ---------------------------------------------------------------------------
// Tareas y micro-tareas
// ---------------------------------------------------------------------------

export interface TaskQuery {
  proyectoId?: string
  estado?: TaskStatus
  cuadrante?: Quadrant
}

export const tasksApi = {
  list: (query: TaskQuery = {}) =>
    api.get<{ data: Task[] }>('/tasks', { params: query }).then((r) => r.data.data),
  get: (id: string) => api.get<Task>(`/tasks/${id}`).then((r) => r.data),
  create: (body: {
    titulo: string
    descripcion?: string
    cuadrante: Quadrant
    fechaLimite?: string | null
    tiempoEstimadoMin?: number | null
    proyectoId?: string | null
  }) => api.post<Task>('/tasks', body).then((r) => r.data),
  update: (
    id: string,
    body: Partial<{
      titulo: string
      descripcion: string | null
      cuadrante: Quadrant
      estado: TaskStatus
      fechaLimite: string | null
      tiempoEstimadoMin: number | null
      proyectoId: string | null
    }>,
  ) => api.patch<Task>(`/tasks/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`),
}

export const subtasksApi = {
  list: (taskId: string) =>
    api.get<{ data: Subtask[] }>(`/tasks/${taskId}/subtasks`).then((r) => r.data.data),
  create: (taskId: string, titulo: string) =>
    api.post<Subtask>(`/tasks/${taskId}/subtasks`, { titulo }).then((r) => r.data),
  update: (id: string, body: { titulo?: string; completada?: boolean; orden?: number }) =>
    api.patch<Subtask>(`/subtasks/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/subtasks/${id}`),
}

// ---------------------------------------------------------------------------
// Pomodoro
// ---------------------------------------------------------------------------

export const pomodoroApi = {
  start: (body: { duracionPlaneadaMin: number; tipo: PomodoroType; tareaId?: string }) =>
    api.post<PomodoroSession>('/pomodoro/start', body).then((r) => r.data),
  pause: (id: string) => api.patch<PomodoroSession>(`/pomodoro/${id}/pause`).then((r) => r.data),
  resume: (id: string) => api.patch<PomodoroSession>(`/pomodoro/${id}/resume`).then((r) => r.data),
  finish: (id: string, completada: boolean) =>
    api.patch<PomodoroSession>(`/pomodoro/${id}/finish`, { completada }).then((r) => r.data),
  active: () =>
    api.get<{ data: PomodoroSession | null }>('/pomodoro/active').then((r) => r.data.data),
}

// ---------------------------------------------------------------------------
// Time-blocking
// ---------------------------------------------------------------------------

export const timeblocksApi = {
  list: (fecha: string) =>
    api.get<{ data: TimeBlock[] }>('/timeblocks', { params: { fecha } }).then((r) => r.data.data),
  create: (body: { tareaId: string; fecha: string; horaInicio: string; horaFin: string }) =>
    api.post<TimeBlock>('/timeblocks', body).then((r) => r.data),
  update: (
    id: string,
    body: Partial<{ tareaId: string; fecha: string; horaInicio: string; horaFin: string }>,
  ) => api.patch<TimeBlock>(`/timeblocks/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/timeblocks/${id}`),
}

// ---------------------------------------------------------------------------
// Métricas / historial / notificaciones / export
// ---------------------------------------------------------------------------

export const metricsApi = {
  get: (range: '7d' | '30d') =>
    api.get<MetricsResponse>('/metrics', { params: { range } }).then((r) => r.data),
}

export const historyApi = {
  list: (params: { tipo?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    api.get<HistoryResponse>('/history', { params }).then((r) => r.data),
}

export const notificationsApi = {
  list: () => api.get<NotificationsResponse>('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all'),
}

export const exportApi = {
  download: async (format: 'json' | 'csv') => {
    const res = await api.get('/export', {
      params: { format },
      responseType: 'blob',
    })
    const filename = `focusflow-export.${format}`
    return saveOrShareFile(filename, res.data as Blob)
  },
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

export interface CheckoutBody {
  planTipo: string
  metodo: PaymentMethod
  ciclo: 'mensual' | 'anual' | 'unico'
  tarjeta?: { numero: string; nombre: string; expiraMM: string; expiraAA: string; cvv: string }
}

export const paymentsApi = {
  plans: () => api.get<{ data: Plan[] }>('/payments/plans').then((r) => r.data.data),
  checkout: (body: CheckoutBody) => api.post<Payment>('/payments/checkout', body).then((r) => r.data),
  mine: () => api.get<{ data: Payment[] }>('/payments').then((r) => r.data.data),
  get: (id: string) => api.get<Payment>(`/payments/${id}`).then((r) => r.data),
  updateStatus: (id: string, estado: PaymentStatus) =>
    api.patch<Payment>(`/payments/${id}/status`, { estado }).then((r) => r.data),
  currentSubscription: () =>
    api
      .get<{ data: SubscriptionCurrent | null }>('/payments/subscription/current')
      .then((r) => r.data.data),
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats').then((r) => r.data),
  users: (params: { page?: number; limit?: number; q?: string }) =>
    api.get<Paginated<AdminUser>>('/admin/users', { params }).then((r) => r.data),
  updateUser: (id: string, body: { rol?: string; nombre?: string }) =>
    api.patch<AdminUser>(`/admin/users/${id}`, body).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  payments: (params: { estado?: PaymentStatus; page?: number; limit?: number }) =>
    api.get<Paginated<Payment>>('/admin/payments', { params }).then((r) => r.data),
  tasks: (params: { page?: number; limit?: number }) =>
    api
      .get<Paginated<Task & { usuario?: { id: string; nombre: string; email: string } }>>(
        '/admin/tasks',
        { params },
      )
      .then((r) => r.data),
  history: (params: { page?: number; limit?: number }) =>
    api.get<Paginated<HistoryEvent>>('/admin/history', { params }).then((r) => r.data),
}
