import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';
import { FaHome, FaArrowLeft } from 'react-icons/fa';
import { useEffect } from 'react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.warn('404 Page Not Found:', window.location.pathname);
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A2E4A] p-4">
      <div className="text-center max-w-lg">
        {/* Large 404 Number */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[150px] font-bold text-[#0A2E4A] dark:text-[#1A3D5A] leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#2D9B6E]/10 dark:bg-[#2D9B6E]/5 flex items-center justify-center">
              <div className="text-6xl md:text-7xl">🔍</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#0A2E4A] dark:text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] text-base md:text-lg mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ROUTES.HOME}>
            <Button
              size="lg"
              className="bg-[#2D9B6E] hover:bg-[#1F7A52] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/30 transition-all duration-300"
            >
              <FaHome className="mr-2" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="border-[#0A2E4A] dark:border-white text-[#0A2E4A] dark:text-white hover:bg-[#0A2E4A] dark:hover:bg-white hover:text-white dark:hover:text-[#0A2E4A] transition-all duration-300"
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] mb-3">
            Need help? Try these links:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to={ROUTES.HOME}
              className="text-sm text-[#2D9B6E] hover:underline font-medium"
            >
              Home
            </Link>
            <span className="text-[#94A3B8] dark:text-[#64748B]">•</span>
            <Link
              to={ROUTES.ABOUT}
              className="text-sm text-[#2D9B6E] hover:underline font-medium"
            >
              About
            </Link>
            <span className="text-[#94A3B8] dark:text-[#64748B]">•</span>
            <Link
              to={ROUTES.CONTACT}
              className="text-sm text-[#2D9B6E] hover:underline font-medium"
            >
              Contact
            </Link>
            <span className="text-[#94A3B8] dark:text-[#64748B]">•</span>
            <Link
              to={ROUTES.HELP}
              className="text-sm text-[#2D9B6E] hover:underline font-medium"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};