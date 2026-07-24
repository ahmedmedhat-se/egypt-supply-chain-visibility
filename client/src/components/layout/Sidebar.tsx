import { NavLink, useLocation, Link } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaShip, 
  FaMapMarkedAlt, 
  FaBell, 
  FaFileAlt, 
  FaUsersCog,
  FaSignOutAlt,
  FaCog,
  FaQuestionCircle,
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
} from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (path: string) => {
    scrollToTop();
    if (location.pathname !== path) {
      setTimeout(() => {
        window.location.href = path;
      }, 300);
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

  const authenticatedNavigation: NavItem[] = [
    { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: FaTachometerAlt, authRequired: true },
    { name: 'Shipments', to: ROUTES.SHIPMENTS, icon: FaShip, authRequired: true },
    { name: 'Tracking', to: ROUTES.TRACKING, icon: FaMapMarkedAlt, authRequired: true },
    { name: 'Alerts', to: ROUTES.ALERTS, icon: FaBell, badge: 3, authRequired: true },
    ...(isAdmin && !isSuperAdmin ? [
      { name: 'Users Report', to: ROUTES.USERS_REPORT, icon: FaUsers, authRequired: true } as NavItem,
      { name: 'Invitations', to: ROUTES.INVITATIONS, icon: FaPaperPlane, authRequired: true } as NavItem,
    ] : []),
    ...(isSuperAdmin ? [
      { name: 'Users Report', to: ROUTES.SUPER_ADMIN_USERS_REPORT, icon: FaUsers, authRequired: true } as NavItem,
      { name: 'Invitations', to: ROUTES.SUPER_ADMIN_INVITATIONS, icon: FaPaperPlane, authRequired: true } as NavItem,
      { name: 'Organizations', to: ROUTES.SUPER_ADMIN_ORGANIZATIONS, icon: FaGlobe, authRequired: true } as NavItem,
      { name: 'Routes', to: ROUTES.SUPER_ADMIN_ROUTES, icon: FaRoute, authRequired: true } as NavItem,
      { name: 'Checkpoints', to: ROUTES.SUPER_ADMIN_CHECKPOINTS, icon: FaMapMarkerAlt, authRequired: true } as NavItem,
    ] : []),
    { name: 'Reports', to: ROUTES.REPORTS, icon: FaFileAlt, authRequired: true },
    ...(isSuperAdmin ? [
      { name: 'Admin', to: ROUTES.ADMIN, icon: FaUsersCog, authRequired: true } as NavItem,
    ] : []),
  ];

  const bottomNav: NavItem[] = [
    { name: 'Profile', to: ROUTES.PROFILE, icon: FaUser, authRequired: true },
    { name: 'Settings', to: ROUTES.SETTINGS, icon: FaCog, authRequired: true },
    { name: 'Help', to: ROUTES.HELP, icon: FaQuestionCircle },
  ];

  const navigation = isAuthenticated ? authenticatedNavigation : publicNavigation;

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#0A2E4A] z-50 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-[#1A3D5A] flex-shrink-0">
          <Link 
            to={ROUTES.HOME} 
            className="flex items-center gap-3 group" 
            onClick={() => handleNavigation(ROUTES.HOME)}
          >
            <div className="w-10 h-10 rounded-lg bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#2D9B6E]/20 group-hover:shadow-[#2D9B6E]/40 transition-all duration-300 group-hover:scale-105">
              E
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#0A2E4A] dark:text-white">ESCV</h1>
              <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">Supply Chain Visibility</p>
            </div>
          </Link>
          <ThemeToggle className="lg:hidden" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              item.name === 'Dashboard'
                    ? ['/admin/dashboard', '/super-admin/dashboard', '/shipper/dashboard', '/carrier/dashboard', '/regulator/dashboard']
                    .some((p) => location.pathname.startsWith(p))
                : location.pathname === item.to;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => handleNavigation(item.to)}
                className={({ isActive: navActive }) => {
                  const active = item.name === 'Dashboard' ? isActive : navActive;
                  return cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative',
                    'hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] hover:text-[#0A2E4A] dark:hover:text-white',
                    'active:scale-95',
                    active 
                      ? 'bg-[#2D9B6E] text-white shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/30' 
                      : 'text-[#94A3B8] dark:text-[#94A3B8]'
                  );
                }}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#DC2626] text-white rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] p-4 flex-shrink-0">
          <div className="space-y-1">
            {bottomNav
              .filter(item => !item.authRequired || isAuthenticated)
              .map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={() => handleNavigation(item.to)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all duration-200 text-sm font-medium',
                    'hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] hover:text-[#0A2E4A] dark:hover:text-white',
                    'active:scale-95',
                    isActive ? 'bg-[#E8F0F8] dark:bg-[#1A3D5A] text-[#0A2E4A] dark:text-white' : 'text-[#94A3B8] dark:text-[#94A3B8]'
                  )}
                >
                  <item.icon className="w-4.5 h-4.5" />
                  <span className="flex-1">{item.name}</span>
                </NavLink>
              ))}
          </div>
          
          {!isAuthenticated ? (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
              <div className="flex flex-col gap-3">
                <Link to={ROUTES.LOGIN} onClick={() => handleNavigation(ROUTES.LOGIN)}>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    className="text-[#0A2E4A] dark:text-white border-2 border-[#0A2E4A] dark:border-white hover:bg-[#0A2E4A] dark:hover:bg-white hover:text-white dark:hover:text-[#0A2E4A] transition-all duration-300 py-2.5 rounded-xl"
                  >
                    <FaSignInAlt className="mr-2 w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} onClick={() => handleNavigation(ROUTES.REGISTER)}>
                  <Button 
                    fullWidth 
                    className="bg-[#2D9B6E] hover:bg-[#1F7A52] transition-all duration-300 py-2.5 rounded-xl shadow-lg shadow-[#2D9B6E]/20 hover:shadow-[#2D9B6E]/30"
                  >
                    <FaUserPlus className="mr-2 w-4 h-4" />
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
              <button
                onClick={() => {
                  scrollToTop();
                  onLogout?.();
                }}
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all duration-200 text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 active:scale-95"
              >
                <FaSignOutAlt className="w-4.5 h-4.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};