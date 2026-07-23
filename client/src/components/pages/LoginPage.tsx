import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { LoginForm } from '../auth/LoginForm';
import { ROUTES } from '../../constants/routes';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A2E4A] p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#2D9B6E]/20">
              E
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Welcome Back</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-2">Sign in to your ESCV account</p>
        </div>
        
        <LoginForm />
      </Card>
    </div>
  );
};