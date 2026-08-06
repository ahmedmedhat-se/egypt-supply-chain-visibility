import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './store/auth.store';
import { ProtectedRoute, RoleRoute } from './router';
import type { User } from './store/auth.store';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LiveSocketBridge } from './components/live/LiveSocketBridge';
import { Toaster } from 'react-hot-toast';

// Lazy-loaded pages
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
const SuperAdminDashboardPage = lazy(() =>
  import('./components/pages/super-admin/DashboardPage').then((m) => ({
    default: m.SuperAdminDashboardPage,
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
const CarrierShipmentsPage = lazy(() =>
  import('./components/pages/carrier/CarrierShipmentsPage').then((m) => ({
    default: m.CarrierShipmentsPage,
  })),
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
const SuperAdminUsersReportPage = lazy(() =>
  import('./components/pages/super-admin/UsersReportPage').then((m) => ({
    default: m.SuperAdminUsersReportPage,
  })),
);
const SuperAdminOrganizationsPage = lazy(() =>
  import('./components/pages/super-admin/OrganizationsPage').then((m) => ({
    default: m.SuperAdminOrganizationsPage,
  })),
);
const SuperAdminInvitationsPage = lazy(() =>
  import('./components/pages/super-admin/InvitationsPage').then((m) => ({ default: m.SuperAdminInvitationsPage })),
);
const SuperAdminRoutesPage = lazy(() =>
  import('./components/pages/super-admin/RoutesPage').then((m) => ({ default: m.RoutesPage })),
);
const SuperAdminCheckpointsPage = lazy(() =>
  import('./components/pages/super-admin/CheckpointsPage').then((m) => ({ default: m.CheckpointsPage })),
);
const AuditLogsPage = lazy(() =>
  import('./components/pages/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);
const AcceptInvitationPage = lazy(() =>
  import('./components/pages/AcceptInvitationPage').then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);
const ShipmentDetailPage = lazy(() =>
  import('./components/pages/ShipmentDetailPage').then((m) => ({
    default: m.ShipmentDetailPage,
  })),
);
const ReportsPage = lazy(() =>
  import('./components/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const ProfilePage = lazy(() =>
  import('./components/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const TermsPage = lazy(() =>
  import('./components/pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./components/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);

// Configure QueryClient with professional settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Suspense wrapper with enhanced loading
function PageLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] animate-pulse">Loading...</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Dashboard redirect based on user role
function DashboardRedirect({ user }: { user: User | null }) {
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const routeMap: Record<string, string> = {
    super_admin: ROUTES.DASHBOARD_SUPER_ADMIN,
    admin: ROUTES.DASHBOARD_ADMIN,
    shipper: ROUTES.DASHBOARD_SHIPPER,
    carrier: ROUTES.DASHBOARD_CARRIER,
    regulator: ROUTES.DASHBOARD_REGULATOR,
  };

  const target = routeMap[user.role] || ROUTES.DASHBOARD_ADMIN;
  return <Navigate to={target} replace />;
}

// Shipments redirect based on user role
function ShipmentsRedirect({ user }: { user: User | null }) {
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;

  const routeMap: Record<string, string> = {
    super_admin: ROUTES.SHIPMENTS_SUPER_ADMIN,
    admin: ROUTES.SHIPMENTS_ADMIN,
    shipper: ROUTES.SHIPMENTS_SHIPPER,
    carrier: ROUTES.SHIPMENTS_CARRIER,
    regulator: ROUTES.SHIPMENTS_REGULATOR,
  };

  const target = routeMap[user.role] || ROUTES.SHIPMENTS_ADMIN;
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
          <LiveSocketBridge />
          <ScrollToTop />
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
              <Route path={ROUTES.HOME} element={<PageLoader><HomePage /></PageLoader>} />
              <Route path={ROUTES.ABOUT} element={<PageLoader><AboutPage /></PageLoader>} />
              <Route path={ROUTES.CONTACT} element={<PageLoader><ContactPage /></PageLoader>} />
              <Route path={ROUTES.TERMS} element={<PageLoader><TermsPage /></PageLoader>} />
              <Route path={ROUTES.PRIVACY} element={<PageLoader><PrivacyPage /></PageLoader>} />

              {/* Auth pages */}
              <Route path={ROUTES.LOGIN} element={<PageLoader><LoginPage /></PageLoader>} />
              <Route path={ROUTES.REGISTER} element={<PageLoader><RegisterPage /></PageLoader>} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<PageLoader><ForgotPasswordPage /></PageLoader>} />

              {/* Protected pages */}
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
                  <RoleRoute roles={['admin']}>
                    <PageLoader><AdminDashboardPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.DASHBOARD_SUPER_ADMIN}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminDashboardPage /></PageLoader>
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

              {/* Shipment routes */}
              <Route
                path={ROUTES.SHIPMENTS}
                element={
                  <ProtectedRoute>
                    <ShipmentsRedirect user={user} />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENTS_ADMIN}
                element={
                  <RoleRoute roles={['admin']}>
                    <PageLoader><ShipmentsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENTS_SHIPPER}
                element={
                  <RoleRoute roles={['shipper']}>
                    <PageLoader><ShipmentsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENTS_CARRIER}
                element={
                  <RoleRoute roles={['carrier']}>
                    <PageLoader><CarrierShipmentsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENTS_REGULATOR}
                element={
                  <RoleRoute roles={['regulator']}>
                    <PageLoader><ShipmentsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENTS_SUPER_ADMIN}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><ShipmentsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SHIPMENT_DETAIL}
                element={
                  <ProtectedRoute>
                    <PageLoader><ShipmentDetailPage /></PageLoader>
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

              {/* Admin routes */}
              <Route
                path={ROUTES.USERS_REPORT}
                element={
                  <RoleRoute roles={['admin']}>
                    <PageLoader><OrganizationsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.INVITATIONS}
                element={
                  <RoleRoute roles={['admin']}>
                    <PageLoader><InvitationsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.AUDIT_LOGS}
                element={
                  <RoleRoute roles={['admin']}>
                    <PageLoader>
                      <AuditLogsPage 
                        orgId={user?.organizationId} 
                        title="Audit Logs" 
                        subtitle="Activity inside your organization — who did what, when, and from where." 
                      />
                    </PageLoader>
                  </RoleRoute>
                }
              />

              {/* Super admin routes */}
              <Route
                path={ROUTES.SUPER_ADMIN_USERS_REPORT}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminUsersReportPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SUPER_ADMIN_ORGANIZATIONS}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminOrganizationsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SUPER_ADMIN_INVITATIONS}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminInvitationsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SUPER_ADMIN_ROUTES}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminRoutesPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SUPER_ADMIN_CHECKPOINTS}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader><SuperAdminCheckpointsPage /></PageLoader>
                  </RoleRoute>
                }
              />
              <Route
                path={ROUTES.SUPER_ADMIN_AUDIT_LOGS}
                element={
                  <RoleRoute roles={['super_admin']}>
                    <PageLoader>
                      <AuditLogsPage 
                        title="Audit Logs" 
                        subtitle="System-wide activity — every action, actor, and change across the platform." 
                      />
                    </PageLoader>
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

              {/* Fallback routes */}
              <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
              <Route path="*" element={<PageLoader><NotFoundPage /></PageLoader>} />
            </Route>

            {/* Full-screen public pages */}
            <Route
              path={ROUTES.ACCEPT_INVITATION}
              element={<PageLoader><AcceptInvitationPage /></PageLoader>}
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0A2E4A',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              },
              success: {
                style: {
                  background: '#065F46',
                },
              },
              error: {
                style: {
                  background: '#991B1B',
                },
              },
            }}
          />
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;