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
const TermsPage = lazy(() =>
  import('./components/pages/TermsPage').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import('./components/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
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
    super_admin: ROUTES.DASHBOARD_SUPER_ADMIN,
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
              <Route path={ROUTES.TERMS} element={<PageLoader><TermsPage /></PageLoader>} />
              <Route path={ROUTES.PRIVACY} element={<PageLoader><PrivacyPage /></PageLoader>} />

              {/* Auth pages - now with Topbar and Footer */}
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />

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
              {/* ── Org Admin Routes ── */}
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

              {/* ── Super Admin Routes ── */}
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
                 ADMIN PANEL — super_admin only
               ═══════════════════════════════════════════════ */}
              <Route
                path={ROUTES.ADMIN}
                element={
                  <RoleRoute roles={['super_admin']}>
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