// Tipos según docs/API_CONTRACT.md — deben coincidir 1:1 con el backend.

export type Rol = 'USER' | 'ADMIN'

export interface User {
  id: string
  nombre: string
  email: string
  rol: Rol
  zonaHoraria: string
  temaPreferido: string | null
  avatarUrl: string | null
  aceptaTerminos: boolean
  creadoEn: string
}

export type Quadrant =
  | 'urgente_importante'
  | 'urgente_no_importante'
  | 'no_urgente_importante'
  | 'no_urgente_no_importante'

export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada' | 'eliminada'

export type ProjectStatus = 'activo' | 'pausado' | 'completado' | 'archivado'

export type PomodoroType = 'trabajo' | 'descanso'

export type PomodoroState = 'activa' | 'pausada' | 'completada' | 'cancelada'

export type PaymentStatus = 'pendiente' | 'completado' | 'fallido' | 'reembolsado'

export type PaymentMethod = 'tarjeta' | 'paypal' | 'transferencia' | 'nequi' | 'llave'

export type PlanType = 'free' | 'pro_mensual' | 'pro_anual' | 'lifetime'

export type NotificationType = 'info' | 'warning' | 'deadline' | 'payment'

export interface Project {
  id: string
  titulo: string
  descripcion: string | null
  estado: ProjectStatus
  creadoEn: string
  _count?: { tareas: number }
}

export interface Subtask {
  id: string
  tareaId: string
  titulo: string
  completada: boolean
  orden: number
  creadoEn: string
}

export interface Task {
  id: string
  titulo: string
  descripcion: string | null
  cuadrante: Quadrant
  estado: TaskStatus
  fechaLimite: string | null
  tiempoEstimadoMin: number | null
  proyectoId: string | null
  creadoEn: string
  microTareas: Subtask[]
}

export interface PomodoroSession {
  id: string
  tareaId: string | null
  inicio: string
  fin: string | null
  duracionPlaneadaMin: number
  duracionRealMin: number | null
  tipo: PomodoroType
  estado: PomodoroState
  completada: boolean
}

export interface TimeBlock {
  id: string
  tareaId: string
  fecha: string
  horaInicio: string
  horaFin: string
  tarea?: { id: string; titulo: string; cuadrante: Quadrant }
}

export interface MetricaPorDia {
  fecha: string
  tareasCompletadas: number
  tiempoEstimadoMin: number
  tiempoRealMin: number
  sesionesCompletadas: number
}

export interface MetricsResponse {
  porDia: MetricaPorDia[]
  totales: {
    tareasCompletadas: number
    tareasCreadas: number
    tiempoEstimadoMin: number
    tiempoRealMin: number
    sesionesCompletadas: number
  }
  rachaActual: number
  tasaCumplimiento: number
}

export interface HistoryEvent {
  id: string
  entidadTipo: string
  entidadId: string
  accion: string
  detalle: string | null
  creadoEn: string
  usuario?: { id: string; nombre: string; email: string }
}

export interface HistoryResponse {
  data: HistoryEvent[]
  page: number
  totalPages: number
  total: number
}

export interface Notification {
  id: string
  tipo: NotificationType
  mensaje: string
  leida: boolean
  programadaPara: string | null
  creadoEn: string
}

export interface NotificationsResponse {
  data: Notification[]
  noLeidas: number
}

export interface Plan {
  id: string
  tipo: PlanType
  nombre: string
  precioMensual: number
  precioAnual: number | null
  descripcion: string | null
  caracteristicas: string[]
}

export interface Payment {
  id: string
  usuarioId: string
  planTipo: PlanType
  monto: number
  moneda: 'USD'
  metodo: PaymentMethod
  ciclo: 'mensual' | 'anual' | 'unico'
  estado: PaymentStatus
  referencia: string
  detalleTarjeta?: { ultimos4: string; marca: string } | null
  creadoEn: string
  usuario?: { id: string; nombre: string; email: string }
}

export interface SubscriptionCurrent {
  planTipo: PlanType
  activa: boolean
  desde: string
  hasta: string | null
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AdminStats {
  usuarios: number
  tareas: number
  tareasCompletadas: number
  sesionesPomodoro: number
  pagosCompletados: number
  ingresosTotales: number
  proyectos: number
}

export interface AdminUser extends User {
  _count: { tareas: number; proyectos: number; pagos: number }
}

export interface Paginated<T> {
  data: T[]
  page: number
  totalPages: number
  total: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
