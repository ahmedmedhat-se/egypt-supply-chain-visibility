import { Link } from 'react-router-dom';
import { 
  FaGithub, 
  FaLinkedin, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaShieldAlt,
  FaLock,
  FaRegCopyright,
  FaArrowUp
} from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useState(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className={cn(
        'bg-white dark:bg-[#0A2E4A] border-t border-[#E2E8F0] dark:border-[#1A3D5A]',
        className
      )}>
        {/* Main Footer */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            {/* Company Info */}
            <div className="space-y-4">
              <Link to={ROUTES.HOME} className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[#2D9B6E]/20">
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
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] leading-relaxed max-w-xs">
                Egypt's leading supply chain intelligence platform. Real-time visibility across ports, customs, and logistics networks.
              </p>
              <div className="flex items-center gap-3 pt-2">
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

            {/* Platform */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-4">
                Platform
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to={ROUTES.DASHBOARD} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.SHIPMENTS} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Shipment Tracking
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.TRACKING} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Live Maps
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.REPORTS} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Analytics & Reports
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.ALERTS} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Alert Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to={ROUTES.ABOUT} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    About ESCV
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.CONTACT} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link to={ROUTES.HELP} className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Help Center
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[#94A3B8] dark:text-[#94A3B8] hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div>
              <h3 className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider mb-4">
                Connect
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                  <FaEnvelope className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                  <a href="mailto:support@escv.com" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors">
                    support@escv.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                  <FaPhone className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                  <a href="tel:+201234567890" className="hover:text-[#2D9B6E] dark:hover:text-[#2D9B6E] transition-colors">
                    +20 123 456 7890
                  </a>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                  <FaMapMarkerAlt className="text-[#2D9B6E] w-4 h-4 flex-shrink-0" />
                  <span>Cairo, Egypt</span>
                </li>
              </ul>
              
              <div className="mt-6">
                <p className="text-xs font-medium text-[#0A2E4A] dark:text-[#94A3B8] mb-3">
                  Follow us
                </p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-xl bg-[#E8F0F8] dark:bg-[#1A3D5A] flex items-center justify-center text-[#0A2E4A] dark:text-white hover:bg-[#2D9B6E] hover:text-white dark:hover:bg-[#2D9B6E] transition-all duration-200 hover:scale-105"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-xl bg-[#E8F0F8] dark:bg-[#1A3D5A] flex items-center justify-center text-[#0A2E4A] dark:text-white hover:bg-[#2D9B6E] hover:text-white dark:hover:bg-[#2D9B6E] transition-all duration-200 hover:scale-105"
                    aria-label="GitHub"
                  >
                    <FaGithub className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] bg-[#F8FAFC] dark:bg-[#061F33]">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-[#94A3B8] dark:text-[#94A3B8]">
                <FaRegCopyright className="w-3 h-3" />
                <span>{currentYear} ESCV. All rights reserved.</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Egypt Supply Chain Visibility Platform</span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-[#94A3B8] dark:text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D9B6E] animate-pulse"></span>
                  <span>All systems operational</span>
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">v1.0.0</span>
              </div>

              <button
                onClick={scrollToTop}
                className={cn(
                  'p-2 rounded-xl bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white hover:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] transition-all duration-200 hover:scale-105 shadow-lg',
                  showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                aria-label="Scroll to top"
              >
                <FaArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};