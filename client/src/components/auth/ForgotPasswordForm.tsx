import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { Button } from '../ui/Button';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword({ email: data.email });
    setIsSubmitted(true);
  };

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
          <Button variant="outline" className="border-[#2D9B6E] text-[#2D9B6E] hover:bg-[#2D9B6E] hover:text-white dark:border-[#2D9B6E] dark:text-[#2D9B6E] dark:hover:bg-[#2D9B6E] dark:hover:text-white transition-all duration-200">
            Back to Sign In
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-5', className)}>
      <div className="text-center mb-2">
        <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Email Address
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn(
          'relative rounded-xl transition-all duration-200',
          isFocused ? 'ring-2 ring-[#2D9B6E] ring-offset-2 dark:ring-offset-[#0A2E4A]' : '',
          errors.email ? 'ring-2 ring-[#DC2626] ring-offset-2 dark:ring-offset-[#0A2E4A]' : ''
        )}>
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
            disabled={forgotPasswordLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200',
              errors.email 
                ? 'border-[#DC2626] dark:border-[#DC2626]' 
                : 'border-[#D1D9E6] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('email')}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={forgotPasswordLoading}
        className="bg-[#2D9B6E] hover:bg-[#1F7A52] dark:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/10 hover:shadow-xl hover:shadow-[#2D9B6E]/30 dark:hover:shadow-[#2D9B6E]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {forgotPasswordLoading ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin w-4 h-4" />
            <span>Sending...</span>
          </div>
        ) : (
          <span>Send Reset Link</span>
        )}
      </Button>

      <p className="text-center text-sm text-[#94A3B8] dark:text-[#64748B]">
        Remember your password?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="text-[#2D9B6E] font-semibold hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
};