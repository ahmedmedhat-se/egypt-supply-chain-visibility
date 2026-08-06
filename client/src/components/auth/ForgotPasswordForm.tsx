import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaSpinner, FaCheckCircle, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  className?: string;
}

export const ForgotPasswordForm = ({ className }: ForgotPasswordFormProps) => {
  const { forgotPassword, forgotPasswordLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isTouched, setIsTouched] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  /**
   * Handles form submission by calling the forgotPassword function from useAuth hook
   */
  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword({ email: data.email });
    setIsSubmitted(true);
  };

  /**
   * Sets focus state when field receives focus
   */
  const handleFocus = () => {
    setIsFocused(true);
  };

  /**
   * Handles blur events: removes focus state, marks field as touched, triggers validation
   */
  const handleBlur = () => {
    setIsFocused(false);
    setIsTouched(true);
    trigger('email');
  };

  /**
   * Determines the visual state of the field based on focus, touch, errors, and value
   * Returns: 'default' | 'focused' | 'error' | 'success'
   */
  const getFieldState = () => {
    const hasError = errors.email;
    const fieldValue = getValues('email');
    const hasValue = fieldValue !== undefined && fieldValue !== '';

    if (hasError && isTouched) return 'error';
    if (isFocused) return 'focused';
    if (isTouched && !hasError && hasValue) return 'success';
    return 'default';
  };

  /**
   * Generates dynamic Tailwind CSS classes for the field based on its current state
   */
  const getFieldStyles = () => {
    const state = getFieldState();
    const baseStyles = 'w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-[#0F2A44] text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:outline-none transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';

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
  const renderFieldIcon = () => {
    const state = getFieldState();
    if (state === 'error' && isTouched) {
      return <FaExclamationCircle className="w-4 h-4 text-[#DC2626]" />;
    }
    if (state === 'success' && isTouched) {
      return <FaCheck className="w-4 h-4 text-[#2D9B6E]" />;
    }
    return null;
  };

  const isDirty = isTouched;

  if (isSubmitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center mx-auto mb-4 animate-in fade-in zoom-in duration-300">
          <FaCheckCircle className="w-8 h-8 text-[#2D9B6E]" />
        </div>
        <h3 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">Check Your Email</h3>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm mb-6 max-w-sm mx-auto">
          We've sent a password reset link to your email address. Please check your inbox.
        </p>
        <Link to={ROUTES.LOGIN}>
          <button className="px-6 py-3 border-2 border-[#2D9B6E] text-[#2D9B6E] hover:bg-[#2D9B6E] hover:text-white dark:border-[#2D9B6E] dark:text-[#2D9B6E] dark:hover:bg-[#2D9B6E] dark:hover:text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#2D9B6E]/20">
            Back to Sign In
          </button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      <div className="text-center mb-2">
        <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

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
            disabled={forgotPasswordLoading}
            className={cn(getFieldStyles(), 'pr-10')}
            {...register('email')}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderFieldIcon()}
          </div>
        </div>
        {errors.email && isTouched && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={forgotPasswordLoading || !isDirty}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 dark:shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/40 dark:hover:shadow-[#2D9B6E]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-[#2D9B6E]/30"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {forgotPasswordLoading ? (
            <>
              <FaSpinner className="animate-spin w-5 h-5" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
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
        Remember your password?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-[#2D9B6E] font-semibold hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-all duration-200 hover:underline hover:underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};