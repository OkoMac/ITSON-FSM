import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { Skeleton } from '@/components/ui';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const CheckInPage = lazy(() => import('@/pages/CheckInPage'));
const TasksPage = lazy(() => import('@/pages/TasksPage'));
const SitesPage = lazy(() => import('@/pages/SitesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AdminPanelPage = lazy(() => import('@/pages/AdminPanelPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

// Enterprise feature pages
const DocumentUploadPage = lazy(() => import('@/pages/DocumentUploadPage'));
const BulkImportPage = lazy(() => import('@/pages/BulkImportPage'));
const WorkSchedulesPage = lazy(() => import('@/pages/WorkSchedulesPage'));
const PPEManagementPage = lazy(() => import('@/pages/PPEManagementPage'));
const IncidentReportPage = lazy(() => import('@/pages/IncidentReportPage'));
const BiometricMonitoringPage = lazy(() => import('@/pages/BiometricMonitoringPage'));
const DeviceManagementPage = lazy(() => import('@/pages/DeviceManagementPage'));
const MonthlyReportsPage = lazy(() => import('@/pages/MonthlyReportsPage'));
const ReferenceLetterPage = lazy(() => import('@/pages/ReferenceLetterPage'));
const TrainingPathwaysPage = lazy(() => import('@/pages/TrainingPathwaysPage'));
const MentorshipPage = lazy(() => import('@/pages/MentorshipPage'));
const JournalingPage = lazy(() => import('@/pages/JournalingPage'));
const LifecycleManagementPage = lazy(() => import('@/pages/LifecycleManagementPage'));
const OfflineSyncPage = lazy(() => import('@/pages/OfflineSyncPage'));
const WhatsAppOnboardingPage = lazy(() => import('@/pages/WhatsAppOnboardingPage'));

// Layout components
import { MainLayout } from '@/components/layout/MainLayout';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';
import { AIAssistant } from '@/components/ai';
import MockModeBanner from '@/components/MockModeBanner';

// Accessibility components
import { SkipLink, LiveRegionProvider } from '@/components/accessibility';

// Loading fallback
const PageLoader: React.FC = () => (
  <div className="page-container">
    <div className="content-wrapper space-y-24">
      <Skeleton variant="title" />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="rectangular" height={300} />
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirects to dashboard if logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isOnline } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <LiveRegionProvider>
        <div className="app">
          {/* Skip to main content link for keyboard users */}
          <SkipLink />

          {/* Mock mode banner */}
          <MockModeBanner />

          {/* Offline banner */}
          {!isOnline && <OfflineBanner />}

          {/* PWA install prompt */}
          <PWAInstallPrompt />

          {/* AI Assistant */}
          {isAuthenticated && <AIAssistant />}

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="check-in" element={<CheckInPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="sites" element={<SitesPage />} />
              <Route path="stories" element={<StoriesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Participant features */}
              <Route path="journaling" element={<JournalingPage />} />
              <Route path="training" element={<TrainingPathwaysPage />} />
              <Route path="mentorship" element={<MentorshipPage />} />

              {/* Operations features */}
              <Route path="schedules" element={<WorkSchedulesPage />} />
              <Route path="ppe" element={<PPEManagementPage />} />
              <Route path="incidents" element={<IncidentReportPage />} />
              <Route path="offline-sync" element={<OfflineSyncPage />} />
              <Route path="whatsapp-onboarding" element={
                <ProtectedRoute roles={['supervisor', 'property-point', 'project-manager']}>
                  <WhatsAppOnboardingPage />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={['admin', 'manager', 'property-point', 'project-manager']}>
                    <AdminPanelPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute roles={['supervisor', 'property-point', 'project-manager']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="document-upload"
                element={
                  <ProtectedRoute roles={['supervisor', 'property-point', 'project-manager']}>
                    <DocumentUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="bulk-import"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <BulkImportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="biometric-monitoring"
                element={
                  <ProtectedRoute roles={['supervisor', 'property-point', 'project-manager']}>
                    <BiometricMonitoringPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="device-management"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <DeviceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="monthly-reports"
                element={
                  <ProtectedRoute roles={['supervisor', 'property-point', 'project-manager']}>
                    <MonthlyReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reference-letters"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <ReferenceLetterPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="lifecycle-management"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <LifecycleManagementPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </div>
      </LiveRegionProvider>
    </BrowserRouter>
  );
};

export default App;
