import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaShip, 
  FaMapMarkedAlt, 
  FaBell, 
  FaFileAlt, 
  FaSignOutAlt,
  FaUser,
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaSignInAlt,
  FaUserPlus,
  FaPaperPlane,
  FaUsers,
  FaGlobe,
  FaRoute,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
  FaHistory,
  FaShieldAlt,
} from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useState } from 'react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  authRequired?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  isAuthenticated?: boolean;
  userRole?: string;
  onClose?: () => void;
  onLogout?: () => void;
}

export const Sidebar = ({ 
  isOpen, 
  isAuthenticated = false,
  userRole,
  onClose, 
  onLogout 
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const handleNavigation = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (location.pathname !== path) {
      setTimeout(() => {
        navigate(path);
      }, 150);
    }
    onClose?.();
  };

  const publicNavigation: NavItem[] = [
    { name: 'Home', to: ROUTES.HOME, icon: FaHome },
    { name: 'About', to: ROUTES.ABOUT, icon: FaInfoCircle },
    { name: 'Contact', to: ROUTES.CONTACT, icon: FaEnvelope },
  ];

  const adminOnlyRoles = ['super_admin', 'admin'];
  const isAdmin = adminOnlyRoles.includes(userRole || '');
  const isSuperAdmin = userRole === 'super_admin';

  const getShipmentsRoute = () => {
    switch (userRole) {
      case 'admin': return ROUTES.SHIPMENTS_ADMIN;
      case 'shipper': return ROUTES.SHIPMENTS_SHIPPER;
      case 'carrier': return ROUTES.SHIPMENTS_CARRIER;
      case 'regulator': return ROUTES.SHIPMENTS_REGULATOR;
      case 'super_admin': return ROUTES.SHIPMENTS_SUPER_ADMIN;
      default: return ROUTES.SHIPMENTS;
    }
  };

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin': return ROUTES.DASHBOARD_ADMIN;
      case 'shipper': return ROUTES.DASHBOARD_SHIPPER;
      case 'carrier': return ROUTES.DASHBOARD_CARRIER;
      case 'regulator': return ROUTES.DASHBOARD_REGULATOR;
      case 'super_admin': return ROUTES.DASHBOARD_SUPER_ADMIN;
      default: return ROUTES.DASHBOARD;
    }
  };

  const authenticatedNavigation: NavItem[] = [
    { name: 'Dashboard', to: getDashboardRoute(), icon: FaTachometerAlt, authRequired: true },
    { name: 'Shipments', to: getShipmentsRoute(), icon: FaShip, authRequired: true },
    { name: 'Tracking', to: ROUTES.TRACKING, icon: FaMapMarkedAlt, authRequired: true },
    { name: 'Alerts', to: ROUTES.ALERTS, icon: FaBell, badge: 3, authRequired: true },
    ...(isAdmin && !isSuperAdmin ? [
      { name: 'Users Report', to: ROUTES.USERS_REPORT, icon: FaUsers, authRequired: true } as NavItem,
      { name: 'Invitations', to: ROUTES.INVITATIONS, icon: FaPaperPlane, authRequired: true } as NavItem,
      { name: 'Audit Logs', to: ROUTES.AUDIT_LOGS, icon: FaHistory, authRequired: true } as NavItem,
    ] : []),
    ...(isSuperAdmin ? [
      { name: 'Users Report', to: ROUTES.SUPER_ADMIN_USERS_REPORT, icon: FaUsers, authRequired: true } as NavItem,
      { name: 'Invitations', to: ROUTES.SUPER_ADMIN_INVITATIONS, icon: FaPaperPlane, authRequired: true } as NavItem,
      { name: 'Organizations', to: ROUTES.SUPER_ADMIN_ORGANIZATIONS, icon: FaGlobe, authRequired: true } as NavItem,
      { name: 'Routes', to: ROUTES.SUPER_ADMIN_ROUTES, icon: FaRoute, authRequired: true } as NavItem,
      { name: 'Checkpoints', to: ROUTES.SUPER_ADMIN_CHECKPOINTS, icon: FaMapMarkerAlt, authRequired: true } as NavItem,
      { name: 'Audit Logs', to: ROUTES.SUPER_ADMIN_AUDIT_LOGS, icon: FaShieldAlt, authRequired: true } as NavItem,
    ] : []),
    { name: 'Reports', to: ROUTES.REPORTS, icon: FaFileAlt, authRequired: true },
  ];

  const bottomNav: NavItem[] = [
    { name: 'Profile', to: ROUTES.PROFILE, icon: FaUser, authRequired: true },
  ];

  const navigation = isAuthenticated ? authenticatedNavigation : publicNavigation;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        className={cn(
          'fixed top-0 left-0 h-full z-50 flex flex-col',
          'bg-white dark:bg-black',
          'border-r border-[#E2E8F0] dark:border-[#2A2A2A]',
          'transition-all duration-300 ease-in-out',
          'lg:relative lg:z-auto',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo section */}
        <div className={cn(
          'flex items-center px-4 py-5 border-b border-[#E2E8F0] dark:border-[#2A2A2A] flex-shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          <Link 
            to={ROUTES.HOME} 
            className="flex items-center gap-3 group min-w-0"
            onClick={() => handleNavigation(ROUTES.HOME)}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#2D9B6E]/20 group-hover:shadow-[#2D9B6E]/40 transition-all duration-300 group-hover:scale-105 flex-shrink-0',
              isCollapsed ? 'w-9 h-9' : 'w-10 h-10'
            )}>
              E
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-[#0A2E4A] dark:text-white leading-tight">
                  ESCV
                </h1>
                <p className="text-[10px] text-[#94A3B8] dark:text-[#94A3B8] font-medium tracking-wider uppercase truncate">
                  Supply Chain
                </p>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <ThemeToggle className="flex-shrink-0" />
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navigation.map((item) => {
            const isActive = location.pathname === item.to || 
              (item.name === 'Dashboard' && location.pathname.startsWith('/dashboard'));
            
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => handleNavigation(item.to)}
                className={({ isActive: navActive }) => {
                  const active = isActive || navActive;
                  return cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative group',
                    'hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]',
                    'active:scale-95',
                    active 
                      ? 'bg-[#2D9B6E] text-white shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/30' 
                      : 'text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#0A2E4A] dark:hover:text-white',
                    isCollapsed && 'justify-center px-2'
                  );
                }}
              >
                <item.icon className={cn(
                  'flex-shrink-0 transition-all duration-200',
                  isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5'
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-[#DC2626] text-white rounded-full font-bold min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-black dark:bg-[#1A1A1A] text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg pointer-events-none border border-[#2A2A2A]">
                    {item.name}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-[#DC2626] text-white rounded-full text-[10px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section with profile and auth actions */}
        <div className="border-t border-[#E2E8F0] dark:border-[#2A2A2A] p-3 flex-shrink-0">
          <div className="space-y-1">
            {bottomNav
              .filter(item => !item.authRequired || isAuthenticated)
              .map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => handleNavigation(item.to)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all duration-200 text-sm font-medium',
                    'hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]',
                    'active:scale-95',
                    isActive 
                      ? 'bg-[#E8F0F8] dark:bg-[#1A1A1A] text-[#0A2E4A] dark:text-white' 
                      : 'text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#0A2E4A] dark:hover:text-white',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className={cn(
                    'flex-shrink-0 transition-all duration-200',
                    isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5'
                  )} />
                  {!isCollapsed && (
                    <span className="flex-1 truncate">{item.name}</span>
                  )}
                </NavLink>
              ))}
          </div>
          
          {/* Auth actions for unauthenticated users */}
          {!isAuthenticated ? (
            <div className={cn(
              'mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A]',
              isCollapsed ? 'flex flex-col items-center gap-3' : 'space-y-3'
            )}>
              <Link to={ROUTES.LOGIN} onClick={() => handleNavigation(ROUTES.LOGIN)} className={cn(
                'w-full',
                isCollapsed && 'flex justify-center'
              )}>
                <Button 
                  variant="outline" 
                  fullWidth={!isCollapsed}
                  className={cn(
                    'text-[#0A2E4A] dark:text-white border-2 border-[#0A2E4A] dark:border-white hover:bg-[#0A2E4A] dark:hover:bg-white hover:text-white dark:hover:text-[#0A2E4A] transition-all duration-300 rounded-xl mb-2',
                    isCollapsed && 'px-3 py-2.5 w-auto mb-0'
                  )}
                >
                  <FaSignInAlt className={cn(
                    'w-4 h-4',
                    !isCollapsed && 'mr-2'
                  )} />
                  {!isCollapsed && 'Sign In'}
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER} onClick={() => handleNavigation(ROUTES.REGISTER)} className={cn(
                'w-full',
                isCollapsed && 'flex justify-center'
              )}>
                <Button 
                  fullWidth={!isCollapsed}
                  className={cn(
                    'bg-[#2D9B6E] hover:bg-[#1F7A52] transition-all duration-300 rounded-xl shadow-lg shadow-[#2D9B6E]/20 hover:shadow-[#2D9B6E]/30',
                    isCollapsed && 'px-3 py-2.5 w-auto'
                  )}
                >
                  <FaUserPlus className={cn(
                    'w-4 h-4',
                    !isCollapsed && 'mr-2'
                  )} />
                  {!isCollapsed && 'Create Account'}
                </Button>
              </Link>
            </div>
          ) : (
            /* Sign out button for authenticated users */
            <div className={cn(
              'mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A]',
              isCollapsed && 'flex justify-center'
            )}>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onLogout?.();
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl transition-all duration-200 text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 active:scale-95',
                  isCollapsed && 'justify-center px-2 w-auto'
                )}
              >
                <FaSignOutAlt className={cn(
                  'flex-shrink-0 transition-all duration-200',
                  isCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5'
                )} />
                {!isCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'absolute -right-3 top-1/2 -translate-y-1/2 hidden lg:flex',
            'w-6 h-6 rounded-full bg-white dark:bg-[#1A1A1A] border border-[#E2E8F0] dark:border-[#2A2A2A]',
            'items-center justify-center hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]',
            'transition-all duration-300 shadow-md hover:shadow-lg',
            'z-10'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <FaChevronRight className="w-3 h-3 text-[#0A2E4A] dark:text-white" />
          ) : (
            <FaChevronLeft className="w-3 h-3 text-[#0A2E4A] dark:text-white" />
          )}
        </button>
      </aside>
    </>
  );
};