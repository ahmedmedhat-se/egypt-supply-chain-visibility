import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ROUTES } from './constants/routes';
import { useAuthStore } from './store/auth.store';
import { useEffect } from 'react';

// Import pages
import { HomePage } from './components/pages/HomePage';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { LoginPage } from './components/pages/LoginPage';
import { RegisterPage } from './components/pages/RegisterPage';
import { ForgotPasswordPage } from './components/pages/ForgotPasswordPage';
// src/App.tsx - Add the NotFoundPage import and route
import { NotFoundPage } from './components/pages/NotFoundPage';

// Placeholder pages
const DashboardPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Dashboard</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Welcome to ESCV</p>
  </div>
);

const ShipmentsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Manage your shipments</p>
  </div>
);

const TrackingPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Live Tracking</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Real-time shipment tracking</p>
  </div>
);

const AlertsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Alerts</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Your notification center</p>
  </div>
);

const OrganizationsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Organizations</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Manage organizations</p>
  </div>
);

const ReportsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Reports</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Generate and view reports</p>
  </div>
);

const AdminPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Admin</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Platform administration</p>
  </div>
);

const ProfilePage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Profile</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Your profile settings</p>
  </div>
);

const SettingsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Settings</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Application settings</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      clearAuth();
    }
  }, [clearAuth]);

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest User';
  const userRole = user?.role || 'Guest';

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* AppLayout Interface */}
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

            {/* Redirect root to home */}
            <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;