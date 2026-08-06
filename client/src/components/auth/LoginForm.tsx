import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner, FaLock, FaCheck, FaExclamationCircle } from 'react-icons/fa';
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
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isInactiveAccount = getErrorReason(loginError) === 'ACCOUNT_INACTIVE';

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
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

  /**
   * Handles form submission by calling the login function from useAuth hook
   */
  const onSubmit = (data: LoginFormData) => {
    login({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });
    onSuccess?.();
  };

  /**
   * Sets focus state for a field when it receives focus
   */
  const handleFocus = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  /**
   * Handles blur events: removes focus state, marks field as touched, triggers validation
   */
  const handleBlur = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    trigger(field as keyof LoginFormData);
  };

  /**
   * Determines the visual state of a field based on focus, touch, errors, and value
   * Returns: 'default' | 'focused' | 'error' | 'success'
   */
  const getFieldState = (field: string) => {
    const hasError = errors[field as keyof LoginFormData];
    const isTouched = touchedFields[field];
    const isFocused = focusedFields[field];
    const fieldValue = getValues(field as keyof LoginFormData);
    const hasValue = fieldValue !== undefined && fieldValue !== '' && fieldValue !== false;

    if (hasError && isTouched) return 'error';
    if (isFocused) return 'focused';
    if (isTouched && !hasError && hasValue) return 'success';
    return 'default';
  };

  /**
   * Generates dynamic Tailwind CSS classes for a field based on its current state
   */
  const getFieldStyles = (field: string) => {
    const state = getFieldState(field);
    const baseStyles = 'w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-[#0F2A44] text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:outline-none transition-all duration-300 ease-in-out';

    const stateStyles = {
      default: 'border-[#E2E8F0] dark:border-[#1A3D5A] hover:border-[#94A3B8] dark:hover:border-[#64748B]',
      focused: 'border-[#2D9B6E] shadow-[0_0_0_4px_rgba(45,155,110,0.15)] dark:shadow-[0_0_0_4px_rgba(45,155,110,0.25)]',
      error: 'border-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.15)] dark:shadow-[0_0_0_4px_rgba(220,38,38,0.25)] bg-[#FEF2F2] dark:bg-[#2A0F0F]',
      success: 'border-[#2D9B6E] bg-[#F0FDF4] dark:bg-[#0F2A1F]',
    };

    return cn(baseStyles, stateStyles[state]);
  };

  /**
   * Renders validation icon (checkmark or exclamation) based on field state
   */
  const renderFieldIcon = (field: string) => {
    const state = getFieldState(field);
    if (state === 'error' && touchedFields[field]) {
      return <FaExclamationCircle className="w-4 h-4 text-[#DC2626]" />;
    }
    if (state === 'success' && touchedFields[field]) {
      return <FaCheck className="w-4 h-4 text-[#2D9B6E]" />;
    }
    return null;
  };

  const isDirty = Object.keys(touchedFields).length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {isInactiveAccount && (
        <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/50 animate-in slide-in-from-top-2 duration-300">
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

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Email Address
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            className={cn(getFieldStyles('email'), 'pr-10')}
            {...register('email')}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderFieldIcon('email')}
          </div>
        </div>
        {errors.email && touchedFields.email && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Password
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className={cn(getFieldStyles('password'), 'pr-12')}
            {...register('password')}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {renderFieldIcon('password')}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-all duration-200 hover:bg-[#F1F5F9] dark:hover:bg-[#1A3D5A]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {errors.password && touchedFields.password && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2.5 text-sm text-[#64748B] dark:text-[#94A3B8] cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="peer w-4 h-4 rounded-md border-2 border-[#D1D9E6] dark:border-[#1A3D5A] text-[#2D9B6E] focus:ring-2 focus:ring-[#2D9B6E] focus:ring-offset-2 dark:focus:ring-offset-[#0A2E4A] transition-all cursor-pointer"
            />
            <FaCheck className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </div>
          <span className="group-hover:text-[#1A2A3A] dark:group-hover:text-[#E2E8F0] transition-colors duration-200">
            Remember me
          </span>
        </label>
        <Link
          to={ROUTES.FORGOT_PASSWORD}
          className="text-sm font-semibold text-[#2D9B6E] hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-all duration-200 hover:underline hover:underline-offset-2"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loginLoading || !isDirty}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 dark:shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/40 dark:hover:shadow-[#2D9B6E]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-[#2D9B6E]/30"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loginLoading ? (
            <>
              <FaSpinner className="animate-spin w-5 h-5" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <svg 
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
      </button>

      <p className="text-center text-sm text-[#94A3B8] dark:text-[#64748B]">
        Don't have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="text-[#2D9B6E] font-semibold hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-all duration-200 hover:underline hover:underline-offset-2"
        >
          Create one
        </Link>
      </p>
    </form>
  );
};