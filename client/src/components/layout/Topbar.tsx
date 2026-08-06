import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaBars,
  FaBell,
  FaSearch,
  FaCaretDown,
  FaUser,
  FaSignInAlt,
  FaUserPlus,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';
import { alertsApi, type UserAlert } from '../../api/alerts.api';
import { formatDate } from '../../lib/utils';

interface TopbarProps {
  onMenuClick: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  onLogout?: () => void;
}

const getSeverityIcon = (severity: string, className: string) => {
  switch (severity) {
    case 'critical':
      return <FaExclamationCircle className={`${className} text-red-500`} />;
    case 'warning':
      return <FaExclamationTriangle className={`${className} text-orange-500`} />;
    default:
      return <FaInfoCircle className={`${className} text-blue-500`} />;
  }
};

export const Topbar = ({
  onMenuClick,
  isAuthenticated = false,
  userName = 'Guest User',
  userRole = 'Guest',
  notificationCount = 0,
  onLogout,
}: TopbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const displayCount = notificationCount > 99 ? '99+' : notificationCount;

  useEffect(() => {
    if (!isProfileOpen && !isAlertsOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && profileRef.current.contains(target)) return;
      if (alertsRef.current && alertsRef.current.contains(target)) return;
      setIsProfileOpen(false);
      setIsAlertsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isAlertsOpen]);

  // Fetch latest alerts lazily — only when the popup is open.
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', { page: 1, limit: 5 }],
    queryFn: async () => {
      const res = await alertsApi.getAlerts({ page: 1, limit: 5 });
      return res.data;
    },
    enabled: isAuthenticated && isAlertsOpen,
  });

  const latestAlerts: UserAlert[] = alertsData?.data ?? [];

  const invalidateAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => alertsApi.markAsRead(id),
    onSuccess: () => invalidateAlerts(),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => alertsApi.markAllAsRead(),
    onSuccess: () => invalidateAlerts(),
  });

  const openAlert = (userAlert: UserAlert) => {
    if (!userAlert.is_read) markAsRead.mutate(userAlert.user_alert_id);
    setIsAlertsOpen(false);
    navigate(ROUTES.ALERTS);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/95 backdrop-blur-lg border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A] transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <FaBars className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
          </button>

          <div className="hidden md:flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">
                {isAuthenticated ? `Welcome back, ${userName.split(' ')[0]}` : 'Welcome to ESCV'}
              </h2>
              <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {isAuthenticated && (
              <Badge variant="success" size="sm" dot>Online</Badge>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={cn(
            'flex items-center transition-all duration-300',
            isSearchOpen ? 'w-64 md:w-80' : 'w-auto'
          )}>
            {isSearchOpen ? (
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search shipments, organizations..."
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-[#D1D9E6] dark:border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] focus:border-transparent text-sm bg-white dark:bg-[#111111] text-[#1A2A3A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#94A3B8]"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#94A3B8]" />
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A] transition-colors"
                aria-label="Search"
              >
                <FaSearch className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
              </button>
            )}
          </div>

          <ThemeToggle />

          {/* Notifications - only for authenticated users */}
          {isAuthenticated && (
            <div ref={alertsRef} className="relative">
              <button
                onClick={() => {
                  setIsAlertsOpen((open) => !open);
                  setIsProfileOpen(false);
                }}
                className={cn(
                  'relative p-2 rounded-lg transition-colors',
                  isAlertsOpen
                    ? 'bg-[#E8F0F8] dark:bg-[#1A1A1A] text-[#0A2E4A] dark:text-white'
                    : 'hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]'
                )}
                aria-label="Notifications"
                aria-haspopup="dialog"
                aria-expanded={isAlertsOpen}
              >
                <FaBell className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center ring-2 ring-white dark:ring-black">
                    {displayCount}
                  </span>
                )}
              </button>

              {/* Alerts dropdown */}
              {isAlertsOpen && (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111111] rounded-xl shadow-lg border border-[#E2E8F0] dark:border-[#2A2A2A] z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
                    <p className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
                      Notifications
                      {notificationCount > 0 && (
                        <span className="ml-2 text-xs font-medium text-[#94A3B8]">
                          {notificationCount} unread
                        </span>
                      )}
                    </p>
                    {notificationCount > 0 && (
                      <button
                        onClick={() => markAllAsRead.mutate()}
                        disabled={markAllAsRead.isPending}
                        className="text-xs font-medium text-[#2D9B6E] hover:text-[#1F7A52] disabled:opacity-50 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {alertsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1A1A1A] flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                            <div className="h-2.5 w-1/2 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                          </div>
                        </div>
                      ))
                    ) : latestAlerts.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <FaBell className="w-10 h-10 mx-auto mb-3 text-[#E2E8F0] dark:text-[#2A2A2A]" />
                        <p className="text-sm font-medium text-[#0A2E4A] dark:text-white">
                          You're all caught up
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-1">
                          New alerts about your shipments will show up here.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#F1F5F9] dark:divide-[#1A1A1A]">
                        {latestAlerts.map((userAlert) => (
                          <li key={userAlert.user_alert_id}>
                            <button
                              onClick={() => openAlert(userAlert)}
                              className={cn(
                                'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A]',
                                !userAlert.is_read && 'bg-[#F8FAFC] dark:bg-[#14181D]'
                              )}
                            >
                              <span className="p-1.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1A1A1A] flex-shrink-0">
                                {getSeverityIcon(userAlert.alert.alert_severity, 'w-4 h-4')}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="flex items-center justify-between gap-2">
                                  <span className={cn(
                                    'text-sm font-medium truncate',
                                    userAlert.is_read
                                      ? 'text-[#64748B] dark:text-[#94A3B8]'
                                      : 'text-[#0A2E4A] dark:text-white'
                                  )}>
                                    {userAlert.alert.alert_title}
                                  </span>
                                  {!userAlert.is_read && (
                                    <span className="w-2 h-2 rounded-full bg-[#2D9B6E] flex-shrink-0" />
                                  )}
                                </span>
                                <span className="block text-xs text-[#94A3B8] truncate mt-0.5">
                                  {userAlert.alert.alert_message}
                                </span>
                                <span className="block text-[10px] text-[#CBD5E1] dark:text-[#555] mt-1">
                                  {formatDate(userAlert.notified_at)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Link
                    to={ROUTES.ALERTS}
                    onClick={() => setIsAlertsOpen(false)}
                    className="block text-center text-sm font-medium text-[#2D9B6E] hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A] px-4 py-3 border-t border-[#E2E8F0] dark:border-[#2A2A2A] transition-colors"
                  >
                    View all alerts
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Auth buttons for guest */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm" className="hidden sm:flex text-[#0A2E4A] dark:text-white hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]">
                  <FaSignInAlt className="mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button size="sm" className="hidden sm:flex bg-[#2D9B6E] hover:bg-[#1F7A52]">
                  <FaUserPlus className="mr-2" />
                  Sign Up
                </Button>
              </Link>
              {/* Mobile auth buttons */}
              <Link to={ROUTES.LOGIN} className="sm:hidden p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]">
                <FaSignInAlt className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
              </Link>
            </div>
          ) : (
            /* Profile - for authenticated users */
            <div ref={profileRef} className="relative ml-2 pl-3 border-l border-[#E2E8F0] dark:border-[#2A2A2A]">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsAlertsOpen(false);
                }}
                className="flex items-center gap-3 focus:outline-none"
                aria-label="Profile"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-[#0A2E4A] dark:text-white">{userName}</p>
                  <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">{userRole}</p>
                </div>
                <Avatar size="md" fallback={userName.split(' ').map(n => n[0]).join('')} />
                <FaCaretDown className="text-[#94A3B8] dark:text-[#94A3B8] hidden sm:block" />
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#111111] rounded-xl shadow-lg border border-[#E2E8F0] dark:border-[#2A2A2A] py-1 z-50">
                  <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
                    <p className="text-sm font-medium text-[#0A2E4A] dark:text-white">{userName}</p>
                    <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">{userRole}</p>
                  </div>
                  <Link to={ROUTES.PROFILE} className="w-full text-left px-4 py-2 text-sm text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A] transition-colors block">
                    <FaUser className="inline mr-2" /> Profile
                  </Link>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 transition-colors border-t border-[#E2E8F0] dark:border-[#2A2A2A]"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
