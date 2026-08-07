import { Link, useParams } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import { ResetPasswordForm } from '../auth/ResetPasswordForm';
import { ROUTES } from '../../constants/routes';

export const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-black p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] shadow-xl dark:shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#2D9B6E]/20 hover:shadow-[#2D9B6E]/40 transition-all duration-300 hover:scale-105">
              E
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
            Set a New Password
          </h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-2">
            Choose a strong password you haven't used before
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">
              Missing Reset Token
            </h3>
            <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm mb-6 max-w-sm mx-auto">
              This link doesn't include a reset token. Please use the full link from your
              email, or request a new one.
            </p>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="inline-block px-6 py-3 border-2 border-[#2D9B6E] text-[#2D9B6E] hover:bg-[#2D9B6E] hover:text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#2D9B6E]/20"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
