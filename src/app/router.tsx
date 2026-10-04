import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layout'
import { RedirectIfAuthed, RequireAdmin, RequireAuth } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { PrivacyPage, TermsPage } from '@/features/auth/LegalPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MatrixPage } from '@/features/matrix/MatrixPage'
import { TaskDetailPage } from '@/features/matrix/TaskDetailPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { PomodoroPage } from '@/features/pomodoro/PomodoroPage'
import { TimeBlocksPage } from '@/features/timeblocks/TimeBlocksPage'
import { MetricsPage } from '@/features/metrics/MetricsPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AdminPage } from '@/features/admin/AdminPage'
import { DesignPreviewPage } from '@/features/design/DesignPreviewPage'
import { NotFoundPage } from '@/features/design/NotFoundPage'

export function AppRouter() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
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
        <Route path="/terminos" element={<TermsPage />} />
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
    </AnimatePresence>
  )
}
