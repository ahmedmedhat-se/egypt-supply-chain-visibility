import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner, FaLock } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { getErrorReason } from '../../api/client';
import { cn } from '../../lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  className?: string;
  onSuccess?: () => void;
}

export const LoginForm = ({ className, onSuccess }: LoginFormProps) => {
  const { login, loginLoading, loginError } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const isInactiveAccount = getErrorReason(loginError) === 'ACCOUNT_INACTIVE';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('remembered_email') || '',
      rememberMe: !!localStorage.getItem('remembered_email'),
    },
  });

  const rememberMe = getValues('rememberMe');
  const email = getValues('email');

  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('remembered_email', email);
    } else if (!rememberMe) {
      localStorage.removeItem('remembered_email');
    }
  }, [rememberMe, email]);

  const onSubmit = (data: LoginFormData) => {
    login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-5', className)}>
      {/* Inactive Account Card */}
      {isInactiveAccount && (
        <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <FaLock className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                Account Deactivated
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400/90 mt-1 leading-relaxed">
                Your account has been deactivated. To regain access, please contact your
                organization administrator or platform support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Email Address
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn(
          'relative rounded-xl transition-all duration-200',
          isFocused.email ? 'ring-2 ring-[#2D9B6E] ring-offset-2 dark:ring-offset-[#0A2E4A]' : '',
          errors.email ? 'ring-2 ring-[#DC2626] ring-offset-2 dark:ring-offset-[#0A2E4A]' : ''
        )}>
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200',
              errors.email 
                ? 'border-[#DC2626] dark:border-[#DC2626]' 
                : 'border-[#D1D9E6] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]'
            )}
            {...register('email')}
            onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
            onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Password
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn(
          'relative rounded-xl transition-all duration-200',
          isFocused.password ? 'ring-2 ring-[#2D9B6E] ring-offset-2 dark:ring-offset-[#0A2E4A]' : '',
          errors.password ? 'ring-2 ring-[#DC2626] ring-offset-2 dark:ring-offset-[#0A2E4A]' : ''
        )}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200 pr-12',
              errors.password 
                ? 'border-[#DC2626] dark:border-[#DC2626]' 
                : 'border-[#D1D9E6] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]'
            )}
            {...register('password')}
            onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
            onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me & Forgot password */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] cursor-pointer hover:text-[#0A2E4A] dark:hover:text-[#E2E8F0] transition-colors group">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="w-4 h-4 rounded border-[#D1D9E6] dark:border-[#1A3D5A] text-[#2D9B6E] focus:ring-[#2D9B6E] focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0A2E4A] transition-all cursor-pointer"
          />
          <span className="group-hover:text-[#0A2E4A] dark:group-hover:text-[#E2E8F0] transition-colors">
            Remember me
          </span>
        </label>
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="text-sm font-medium text-[#2D9B6E] hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-colors hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={loginLoading}
        className="bg-[#2D9B6E] hover:bg-[#1F7A52] dark:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/10 hover:shadow-xl hover:shadow-[#2D9B6E]/30 dark:hover:shadow-[#2D9B6E]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loginLoading ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin w-4 h-4" />
            <span>Signing in...</span>
          </div>
        ) : (
          <span>Sign In</span>
        )}
      </Button>

      {/* Sign up link */}
      <p className="text-center text-sm text-[#94A3B8] dark:text-[#64748B]">
        Don't have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="text-[#2D9B6E] font-semibold hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-colors hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
};
