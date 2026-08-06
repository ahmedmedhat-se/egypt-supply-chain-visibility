import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Footer } from './Footer';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { alertsApi } from '../../api/alerts.api';

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

  const { data: unreadData } = useQuery({
    queryKey: ['unread-alerts-count'],
    queryFn: async () => {
      const res = await alertsApi.getUnreadCount();
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 15000, // Poll every 15s
  });

  const notificationCount = unreadData?.count || 0;

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-black overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        unreadCount={notificationCount}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar 
          onMenuClick={() => setSidebarOpen(true)}
          isAuthenticated={isAuthenticated}
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
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
            background: '#111111',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #2A2A2A',
          },
          success: {
            style: {
              background: '#065F46',
              border: '1px solid #2D9B6E',
            },
          },
          error: {
            style: {
              background: '#991B1B',
              border: '1px solid #DC2626',
            },
          },
          loading: {
            style: {
              background: '#1A1A1A',
              border: '1px solid #3A3A3A',
            },
          },
        }}
      />
    </div>
  );
};