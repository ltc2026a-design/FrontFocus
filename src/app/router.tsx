import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed, RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { Spinner } from '@/components/Spinner'
import { AppLayout } from './layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAndroidBack } from './useAndroidBack'

// Cada página va en su propio chunk: así la app arranca solo con lo necesario
// para la pantalla actual en vez de cargar recharts, dnd-kit y el resto a la vez.
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const LegalPage = lazy(() => import('@/features/auth/LegalPage').then((m) => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('@/features/auth/LegalPage').then((m) => ({ default: m.PrivacyPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const MatrixPage = lazy(() => import('@/features/matrix/MatrixPage').then((m) => ({ default: m.MatrixPage })))
const TaskDetailPage = lazy(() => import('@/features/matrix/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
const PomodoroPage = lazy(() => import('@/features/pomodoro/PomodoroPage').then((m) => ({ default: m.PomodoroPage })))
const TimeBlocksPage = lazy(() => import('@/features/timeblocks/TimeBlocksPage').then((m) => ({ default: m.TimeBlocksPage })))
const MetricsPage = lazy(() => import('@/features/metrics/MetricsPage').then((m) => ({ default: m.MetricsPage })))
const HistoryPage = lazy(() => import('@/features/history/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const ProfilePage = lazy(() => import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const AdminPage = lazy(() => import('@/features/admin/AdminPage').then((m) => ({ default: m.AdminPage })))
const DesignPreviewPage = lazy(() => import('@/features/design/DesignPreviewPage').then((m) => ({ default: m.DesignPreviewPage })))
const NotFoundPage = lazy(() => import('@/features/design/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

export function AppRouter() {
  useAndroidBack()

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Públicas */}
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <LoginPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <RegisterPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectIfAuthed>
              <ForgotPasswordPage />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RedirectIfAuthed>
              <ResetPasswordPage />
            </RedirectIfAuthed>
          }
        />
        <Route path="/terminos" element={<LegalPage />} />
        <Route path="/privacidad" element={<PrivacyPage />} />
        <Route path="/design-preview" element={<DesignPreviewPage />} />

        {/* Protegidas */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/matrix" element={<MatrixPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/timeblocks" element={<TimeBlocksPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
