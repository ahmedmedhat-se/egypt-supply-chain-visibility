import { Link } from 'react-router-dom';
import { LoginForm } from '../auth/LoginForm';
import { ROUTES } from '../../constants/routes';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-black p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] shadow-xl dark:shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#2D9B6E]/20 hover:shadow-[#2D9B6E]/40 transition-all duration-300 hover:scale-105">
              E
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Welcome Back</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-2">Sign in to your ESCV account</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};