import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ROUTES } from './constants/routes';
import { HomePage } from './components/pages/HomePage';

// Placeholder pages for demonstration
const DashboardPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Dashboard</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Welcome to ESCV - Egypt Supply Chain Visibility</p>
  </div>
);

const ShipmentsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Manage your shipments here</p>
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

const HelpPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Help Center</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Get help and support</p>
  </div>
);

const AboutPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">About ESCV</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Bringing visibility to Egypt's supply chains</p>
  </div>
);

const ContactPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Contact Us</h1>
    <p className="text-[#1A2A3A] dark:text-[#94A3B8]">Get in touch with our team</p>
  </div>
);

const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A2E4A]">
    <div className="bg-white dark:bg-[#1A3D5A] p-8 rounded-2xl shadow-lg max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
          E
        </div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Welcome Back</h1>
        <p className="text-[#94A3B8] mt-2">Sign in to your account</p>
      </div>
    </div>
  </div>
);

const RegisterPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A2E4A]">
    <div className="bg-white dark:bg-[#1A3D5A] p-8 rounded-2xl shadow-lg max-w-md w-full">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg">
          E
        </div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Create Account</h1>
        <p className="text-[#94A3B8] mt-2">Join the ESCV platform</p>
      </div>
    </div>
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
  // For demonstration - set to false for guest mode
  const isAuthenticated = false;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          
          <Route element={<AppLayout isAuthenticated={isAuthenticated} />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={ROUTES.CONTACT} element={<ContactPage />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.SHIPMENTS} element={<ShipmentsPage />} />
            <Route path={ROUTES.TRACKING} element={<TrackingPage />} />
            <Route path={ROUTES.ALERTS} element={<AlertsPage />} />
            <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.HELP} element={<HelpPage />} />
            <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;