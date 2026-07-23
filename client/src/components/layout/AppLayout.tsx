import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  isAuthenticated?: boolean;
  userName?: string;
  userRole?: string;
}

export const AppLayout = ({ 
  isAuthenticated = false,
  userName = 'Guest User',
  userRole = 'Guest',
}: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#0A2E4A] overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        isAuthenticated={isAuthenticated}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          isAuthenticated={isAuthenticated}
          userName={userName}
          userRole={userRole}
          onLogout={logout}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
            <Footer />
          </div>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0A2E4A',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
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
    </div>
  );
};