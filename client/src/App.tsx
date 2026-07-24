import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './store/auth.store';
import { ProtectedRoute, RoleRoute } from './router';
import type { User } from './store/auth.store';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DashboardPage } from './components';

// Lazy-loaded pages — each becomes its own chunk
const HomePage = lazy(() =>
  import('./components/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const AboutPage = lazy(() =>
  import('./components/pages/AboutPage').then((m) => ({ default: m.AboutPage })),
);
const ContactPage = lazy(() =>
  import('./components/pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const LoginPage = lazy(() =>
  import('./components/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./components/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./components/pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const NotFoundPage = lazy(() =>
  import('./components/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./components/pages/org-admin/DashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const ShipperDashboardPage = lazy(() =>
  import('./components/pages/shipper/DashboardPage').then((m) => ({
    default: m.ShipperDashboardPage,
  })),
);
const CarrierDashboardPage = lazy(() =>
  import('./components/pages/carrier/DashboardPage').then((m) => ({
    default: m.CarrierDashboardPage,
  })),
);
const RegulatorDashboardPage = lazy(() =>
  import('./components/pages/regulator/DashboardPage').then((m) => ({
    default: m.RegulatorDashboardPage,
  })),
);
const ShipmentsPage = lazy(() =>
  import('./components/pages/ShipmentsPage').then((m) => ({ default: m.ShipmentsPage })),
);
const TrackingPage = lazy(() =>
  import('./components/pages/TrackingPage').then((m) => ({ default: m.TrackingPage })),
);
const AlertsPage = lazy(() =>
  import('./components/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
);
const OrganizationsPage = lazy(() =>
  import('./components/pages/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })),
);
const InvitationsPage = lazy(() =>
  import('./components/pages/InvitationsPage').then((m) => ({ default: m.InvitationsPage })),
);
const AcceptInvitationPage = lazy(() =>
  import('./components/pages/AcceptInvitationPage').then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);
const ReportsPage = lazy(() =>
  import('./components/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const AdminPage = lazy(() =>
  import('./components/pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const ProfilePage = lazy(() =>
  import('./components/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import('./components/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Shared Suspense wrapper — shows a spinner while lazy chunk loads */
function PageLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

/** Redirects /dashboard to the role-specific dashboard route */
function DashboardRedirect({ user }: { user: User | null }) {
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const routeMap: Record<string, string> = {
    super_admin: ROUTES.DASHBOARD_ADMIN,
    admin: ROUTES.DASHBOARD_ADMIN,
    shipper: ROUTES.DASHBOARD_SHIPPER,
    carrier: ROUTES.DASHBOARD_CARRIER,
    regulator: ROUTES.DASHBOARD_REGULATOR,
  };

  const target = routeMap[user.role] || ROUTES.DASHBOARD_ADMIN;
  return <Navigate to={target} replace />;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const userName = user?.name || 'Guest User';
  const userRole = user?.role || 'Guest';

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <AppLayout
                isAuthenticated={isAuthenticated}
                userName={userName}
                userRole={userRole}
              />
            }
          >
            {/* Public pages */}
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
            
            {/* Auth pages - now with Topbar and Footer */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

            {/* Protected pages */}
            <Route 
              path={ROUTES.DASHBOARD} 
              element={
                isAuthenticated ? <DashboardPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.SHIPMENTS} 
              element={
                isAuthenticated ? <ShipmentsPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.TRACKING} 
              element={
                isAuthenticated ? <TrackingPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.ALERTS} 
              element={
                isAuthenticated ? <AlertsPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.ORGANIZATIONS} 
              element={
                isAuthenticated ? <OrganizationsPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.REPORTS} 
              element={
                isAuthenticated ? <ReportsPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.ADMIN} 
              element={
                isAuthenticated && user?.role === 'super_admin' ? 
                  <AdminPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.PROFILE} 
              element={
                isAuthenticated ? <ProfilePage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />
            <Route 
              path={ROUTES.SETTINGS} 
              element={
                isAuthenticated ? <SettingsPage /> : <Navigate to={ROUTES.LOGIN} replace />
              } 
            />

            {/* ═══════════════════════════════════════════════
                 PROTECTED PAGES — require valid JWT
               ═══════════════════════════════════════════════ */}
            {/* Role-based dashboard redirect */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardRedirect user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD_ADMIN}
            element={
              <RoleRoute roles={['super_admin', 'admin']}>
                <PageLoader><AdminDashboardPage /></PageLoader>
              </RoleRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD_SHIPPER}
            element={
              <RoleRoute roles={['shipper']}>
                <PageLoader><ShipperDashboardPage /></PageLoader>
              </RoleRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD_CARRIER}
            element={
              <RoleRoute roles={['carrier']}>
                <PageLoader><CarrierDashboardPage /></PageLoader>
              </RoleRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD_REGULATOR}
            element={
              <RoleRoute roles={['regulator']}>
                <PageLoader><RegulatorDashboardPage /></PageLoader>
              </RoleRoute>
            }
          />
            <Route
              path={ROUTES.SHIPMENTS}
              element={
                <ProtectedRoute>
                  <PageLoader><ShipmentsPage /></PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.TRACKING}
              element={
                <ProtectedRoute>
                  <PageLoader><TrackingPage /></PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ALERTS}
              element={
                <ProtectedRoute>
                  <PageLoader><AlertsPage /></PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.ORGANIZATIONS}
              element={
                <RoleRoute roles={['super_admin', 'admin']}>
                  <PageLoader><OrganizationsPage /></PageLoader>
                </RoleRoute>
              }
            />
            <Route
              path={ROUTES.ORGANIZATIONS_INVITATIONS}
              element={
                <RoleRoute roles={['super_admin', 'admin']}>
                  <PageLoader><InvitationsPage /></PageLoader>
                </RoleRoute>
              }
            />
            <Route
              path={ROUTES.REPORTS}
              element={
                <ProtectedRoute>
                  <PageLoader><ReportsPage /></PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <PageLoader><ProfilePage /></PageLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.SETTINGS}
              element={
                <ProtectedRoute>
                  <PageLoader><SettingsPage /></PageLoader>
                </ProtectedRoute>
              }
            />

            {/* ═══════════════════════════════════════════════
                 ADMIN PAGES — require super_admin or admin
               ═══════════════════════════════════════════════ */}
            <Route
              path={ROUTES.ADMIN}
              element={
                <RoleRoute roles={['super_admin', 'admin']}>
                  <PageLoader><AdminPage /></PageLoader>
                </RoleRoute>
              }
            />

            {/* ═══════════════════════════════════════════════
                 FALLBACKS
               ═══════════════════════════════════════════════ */}
            <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
            <Route path="*" element={<PageLoader><NotFoundPage /></PageLoader>} />
          </Route>

          {/* ═══════════════════════════════════════════════
               FULL-SCREEN PUBLIC PAGES — outside AppLayout
             ═══════════════════════════════════════════════ */}
          <Route
            path={ROUTES.ACCEPT_INVITATION}
            element={<PageLoader><AcceptInvitationPage /></PageLoader>}
          />
        </Routes>
      </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
