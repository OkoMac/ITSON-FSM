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
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const StoriesPage = lazy(() => import('@/pages/StoriesPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

// Layout components
import { MainLayout } from '@/components/layout/MainLayout';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { PWAInstallPrompt } from '@/components/shared/PWAInstallPrompt';

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

  return (
    <BrowserRouter>
      <div className="app">
        {/* Offline banner */}
        {!isOnline && <OfflineBanner />}

        {/* PWA install prompt */}
        <PWAInstallPrompt />

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

              {/* Admin routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute roles={['property-point', 'project-manager']}>
                    <AdminPage />
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
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
