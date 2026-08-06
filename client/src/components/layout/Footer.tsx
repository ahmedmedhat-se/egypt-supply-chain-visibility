import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  FaYoutube,
  FaWifi
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
  hoverColor: string;
}

interface FooterLink {
  label: string;
  path: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
        navigate(path);
      }, 300);
    }
  };

  const companyLinks: FooterLink[] = [
    { label: 'About ESCV', path: ROUTES.ABOUT },
    { label: 'Contact Support', path: ROUTES.CONTACT },
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
      color: 'bg-[#0A66C2]',
      hoverColor: 'hover:bg-[#0A66C2] hover:shadow-lg hover:shadow-[#0A66C2]/30'
    },
    { 
      icon: FaGithub, 
      href: 'https://github.com/ahmedmedhat-se/egypt-supply-chain-visibility/', 
      label: 'GitHub',
      color: 'bg-[#333333]',
      hoverColor: 'hover:bg-[#333333] hover:shadow-lg hover:shadow-[#333333]/30'
    },
    { 
      icon: FaYoutube, 
      href: 'https://youtube.com/@xoperations', 
      label: 'YouTube',
      color: 'bg-[#FF0000]',
      hoverColor: 'hover:bg-[#FF0000] hover:shadow-lg hover:shadow-[#FF0000]/30'
    },
  ];

  return (
    <footer className={cn(
      'bg-white dark:bg-black border-t border-[#E2E8F0] dark:border-[#2A2A2A] mt-auto',
      className
    )}>
      {/* Main Footer */}
      <div className="px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Brand column */}
            <div className="space-y-4">
              <Link 
                to={ROUTES.HOME} 
                onClick={(e) => handleNavigation(e, ROUTES.HOME)}
                className="inline-flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#2D9B6E]/20 group-hover:shadow-[#2D9B6E]/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  E
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#0A2E4A] dark:text-white leading-tight">
                    ESCV
                  </h1>
                  <p className="text-[10px] text-[#94A3B8] dark:text-[#94A3B8] font-medium tracking-[0.2em] uppercase">
                    Supply Chain
                  </p>
                </div>
              </Link>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-xs">
                Egypt's leading supply chain intelligence platform. Real-time visibility across ports, customs, and logistics networks.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 text-xs font-medium text-[#065F46] dark:text-[#2D9B6E] border border-[#2D9B6E]/20">
                  <FaLock className="w-3 h-3" />
                  SSL Secure
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] text-xs font-medium text-[#0A2E4A] dark:text-[#94A3B8] border border-[#94A3B8]/20 dark:border-[#2A2A2A]">
                  <FaShieldAlt className="w-3 h-3" />
                  ISO 27001
                </span>
              </div>
            </div>

            {/* Company links */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#2D9B6E] rounded-full" />
                Company
              </h3>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={(e) => handleNavigation(e, link.path)}
                      className="text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 font-medium hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#2D9B6E] rounded-full" />
                Legal
              </h3>
              <ul className="space-y-2.5">
                {legalLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      onClick={(e) => handleNavigation(e, link.path)}
                      className="text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-all duration-200 font-medium hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact and social */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#2D9B6E] rounded-full" />
                Connect
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] group">
                  <div className="w-8 h-8 rounded-lg bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <FaEnvelope className="text-[#2D9B6E] w-3.5 h-3.5" />
                  </div>
                  <a href="mailto:xoperations.contact@gmail.com" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors font-medium truncate">
                    xoperations.contact@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] group">
                  <div className="w-8 h-8 rounded-lg bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <FaPhone className="text-[#2D9B6E] w-3.5 h-3.5" />
                  </div>
                  <a href="tel:+201234567890" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors font-medium">
                    +20 123 456 7890
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] group">
                  <div className="w-8 h-8 rounded-lg bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <FaMapMarkerAlt className="text-[#2D9B6E] w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">Cairo, Egypt</span>
                </li>
              </ul>
              
              <div className="flex gap-2.5 mt-5">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:-translate-y-1',
                        social.color,
                        social.hoverColor
                      )}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#E2E8F0] dark:border-[#2A2A2A] bg-[#F8FAFC] dark:bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <FaRegCopyright className="w-3 h-3" />
              <span>{currentYear} ESCV. All rights reserved.</span>
              <span className="hidden sm:inline text-[#94A3B8]/30">•</span>
              <Link 
                to={ROUTES.PRIVACY} 
                onClick={(e) => handleNavigation(e, ROUTES.PRIVACY)}
                className="hover:text-[#2D9B6E] transition-colors font-medium"
              >
                Privacy
              </Link>
              <span className="hidden sm:inline text-[#94A3B8]/30">•</span>
              <Link 
                to={ROUTES.TERMS} 
                onClick={(e) => handleNavigation(e, ROUTES.TERMS)}
                className="hover:text-[#2D9B6E] transition-colors font-medium"
              >
                Terms
              </Link>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A]">
                <FaWifi className={cn(
                  'w-3 h-3',
                  isOnline ? 'text-[#2D9B6E]' : 'text-[#DC2626] opacity-50'
                )} />
                <span className={cn(
                  'font-medium',
                  isOnline ? 'text-[#2D9B6E]' : 'text-[#DC2626]'
                )}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </span>
              <span className="hidden sm:inline text-[#94A3B8]/30">|</span>
              <span className="hidden sm:inline font-mono text-[#94A3B8]/60 bg-[#E8F0F8] dark:bg-[#1A1A1A] px-2 py-0.5 rounded-full text-[10px]">
                v1.0.0
              </span>
            </div>

            {/* Scroll to top button */}
            <button
              onClick={scrollToTop}
              className={cn(
                'fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] text-white hover:from-[#1F7A52] hover:to-[#166B44] transition-all duration-300 hover:scale-110 shadow-lg shadow-[#2D9B6E]/30 hover:shadow-xl hover:shadow-[#2D9B6E]/40',
                showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
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