import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { RegisterForm } from '../auth/RegisterForm';
import { ROUTES } from '../../constants/routes';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0A2E4A] p-4">
      <Card variant="elevated" className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-block">
            <div className="w-16 h-16 rounded-2xl bg-[#2D9B6E] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-[#2D9B6E]/20">
              E
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Create Account</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-2">Join Egypt's supply chain visibility platform</p>
        </div>
        
        <RegisterForm />
      </Card>
    </div>
  );
};