import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaBell, FaSearch, FaCaretDown, FaUser, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { ROUTES } from '../../constants/routes';

interface TopbarProps {
  onMenuClick: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
  onLogout?: () => void; // Add this
}

export const Topbar = ({ 
  onMenuClick, 
  isAuthenticated = false,
  userName = 'Guest User', 
  userRole = 'Guest',
  notificationCount = 0,
  onLogout // Add this
}: TopbarProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0A2E4A]/95 backdrop-blur-lg border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] transition-colors lg:hidden"
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
                  className="w-full px-4 py-2 pr-10 rounded-lg border border-[#D1D9E6] dark:border-[#1A3D5A] focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] dark:focus:ring-[#2D9B6E] focus:border-transparent text-sm bg-white dark:bg-[#1A3D5A] text-[#1A2A3A] dark:text-white placeholder:text-[#94A3B8] dark:placeholder:text-[#94A3B8]"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                />
                <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#94A3B8]" />
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] transition-colors"
                aria-label="Search"
              >
                <FaSearch className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
              </button>
            )}
          </div>

          <ThemeToggle />

          {/* Notifications - only for authenticated users */}
          {isAuthenticated && (
            <button className="relative p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A] transition-colors" aria-label="Notifications">
              <FaBell className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white dark:ring-[#0A2E4A]">
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Auth buttons for guest */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm" className="hidden sm:flex text-[#0A2E4A] dark:text-white hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A]">
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
              <Link to={ROUTES.LOGIN} className="sm:hidden p-2 rounded-lg hover:bg-[#E8F0F8] dark:hover:bg-[#1A3D5A]">
                <FaSignInAlt className="w-5 h-5 text-[#0A2E4A] dark:text-white" />
              </Link>
            </div>
          ) : (
            /* Profile - for authenticated users */
            <div className="relative ml-2 pl-3 border-l border-[#E2E8F0] dark:border-[#1A3D5A]">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1A3D5A] rounded-xl shadow-lg border border-[#E2E8F0] dark:border-[#1A3D5A] py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
                      <p className="text-sm font-medium text-[#0A2E4A] dark:text-white">{userName}</p>
                      <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8]">{userRole}</p>
                    </div>
                    <Link to={ROUTES.PROFILE} className="w-full text-left px-4 py-2 text-sm text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#E8F0F8] dark:hover:bg-[#0A2E4A] transition-colors block">
                      <FaUser className="inline mr-2" /> Profile
                    </Link>
                    <Link to={ROUTES.SETTINGS} className="w-full text-left px-4 py-2 text-sm text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#E8F0F8] dark:hover:bg-[#0A2E4A] transition-colors block">
                      <FaCaretDown className="inline mr-2" /> Settings
                    </Link>
                    <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 transition-colors border-t border-[#E2E8F0] dark:border-[#1A3D5A]"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};