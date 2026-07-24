import { Link, useLocation } from 'react-router-dom';
import { 
  FaGithub, 
  FaLinkedin, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaShieldAlt,
  FaLock,
  FaRegCopyright,
  FaArrowUp,
  FaYoutube
} from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

interface FooterProps {
  className?: string;
}

interface SocialLink {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
  color: string;
}

interface FooterLink {
  label: string;
  path: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    if (location.pathname === path) {
      scrollToTop();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.href = path;
      }, 300);
    }
  };

  const platformLinks: FooterLink[] = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Shipments', path: ROUTES.SHIPMENTS },
    { label: 'Live Tracking', path: ROUTES.TRACKING },
    { label: 'Analytics & Reports', path: ROUTES.REPORTS },
    { label: 'Alert Center', path: ROUTES.ALERTS },
  ];

  const companyLinks: FooterLink[] = [
    { label: 'About ESCV', path: ROUTES.ABOUT },
    { label: 'Contact Support', path: ROUTES.CONTACT },
    { label: 'Help Center', path: ROUTES.HELP },
  ];

  const legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', path: ROUTES.PRIVACY },
    { label: 'Terms of Service', path: ROUTES.TERMS },
  ];

  const socialLinks: SocialLink[] = [
    { 
      icon: FaLinkedin, 
      href: 'https://www.linkedin.com/company/xoperations-official/', 
      label: 'LinkedIn',
      color: 'hover:bg-[#0A66C2]'
    },
    { 
      icon: FaGithub, 
      href: 'https://github.com/ahmedmedhat-se/egypt-supply-chain-visibility/', 
      label: 'GitHub',
      color: 'hover:bg-[#333333]'
    },
    { 
      icon: FaYoutube, 
      href: 'https://youtube.com/@xoperations', 
      label: 'YouTube',
      color: 'hover:bg-[#FF0000]'
    },
  ];

  return (
    <footer className={cn(
      'bg-white dark:bg-[#0A2E4A] border-t border-[#E2E8F0] dark:border-[#1A3D5A]',
      className
    )}>
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link 
              to={ROUTES.HOME} 
              onClick={(e) => handleNavigation(e, ROUTES.HOME)}
              className="inline-flex items-center gap-3 group mb-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[#2D9B6E]/20 group-hover:shadow-[#2D9B6E]/40 transition-all duration-300 group-hover:scale-105">
                E
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#0A2E4A] dark:text-white">
                  ESCV
                </h1>
                <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8] font-medium tracking-wider uppercase">
                  Supply Chain Visibility
                </p>
              </div>
            </Link>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-xs">
              Egypt's leading supply chain intelligence platform. Real-time visibility across ports, customs, and logistics networks.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 text-xs font-medium text-[#065F46] dark:text-[#2D9B6E]">
                <FaLock className="w-3 h-3" />
                SSL Secure
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0F8] dark:bg-[#1A3D5A] text-xs font-medium text-[#0A2E4A] dark:text-[#94A3B8]">
                <FaShieldAlt className="w-3 h-3" />
                ISO 27001
              </span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-5">
              Platform
            </h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={(e) => handleNavigation(e, link.path)}
                    className="text-base text-[#64748B] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-5">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={(e) => handleNavigation(e, link.path)}
                    className="text-base text-[#64748B] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-5">
              Legal
            </h3>
            <ul className="space-y-3 mb-6">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={(e) => handleNavigation(e, link.path)}
                    className="text-base text-[#64748B] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-5">
              Connect
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-base text-[#64748B] dark:text-[#94A3B8] group">
                <FaEnvelope className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                <a href="mailto:xoperations.contact@gmail.com" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors font-medium">
                  xoperations.contact@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-base text-[#64748B] dark:text-[#94A3B8] group">
                <FaPhone className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                <a href="tel:+201234567890" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors font-medium">
                  +20 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-3 text-base text-[#64748B] dark:text-[#94A3B8] group">
                <FaMapMarkerAlt className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Cairo, Egypt</span>
              </li>
            </ul>
            
            <div className="mt-6">
              <p className="text-sm font-medium text-[#0A2E4A] dark:text-[#94A3B8] mb-3">
                Follow us
              </p>
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className={cn(
                        'w-11 h-11 rounded-xl bg-[#E8F0F8] dark:bg-[#1A3D5A] flex items-center justify-center text-[#0A2E4A] dark:text-white transition-all duration-300 hover:scale-110 hover:text-white',
                        social.color
                      )}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] bg-[#F8FAFC] dark:bg-[#061F33]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <FaRegCopyright className="w-4 h-4" />
              <span>{currentYear} ESCV. All rights reserved.</span>
              <span className="hidden sm:inline text-[#94A3B8]/30">|</span>
              <Link 
                to={ROUTES.PRIVACY} 
                onClick={(e) => handleNavigation(e, ROUTES.PRIVACY)}
                className="hover:text-[#2D9B6E] transition-colors font-medium"
              >
                Privacy
              </Link>
              <span className="hidden sm:inline text-[#94A3B8]/30">|</span>
              <Link 
                to={ROUTES.TERMS} 
                onClick={(e) => handleNavigation(e, ROUTES.TERMS)}
                className="hover:text-[#2D9B6E] transition-colors font-medium"
              >
                Terms
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2D9B6E] animate-pulse"></span>
                <span className="font-medium">All systems operational</span>
              </span>
              <span className="hidden sm:inline text-[#94A3B8]/30">|</span>
              <span className="hidden sm:inline font-mono text-[#94A3B8]/70">v1.0.0</span>
            </div>

            <button
              onClick={scrollToTop}
              className={cn(
                'p-2.5 rounded-xl bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white hover:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-[#2D9B6E]/30',
                showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              )}
              aria-label="Scroll to top"
            >
              <FaArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};