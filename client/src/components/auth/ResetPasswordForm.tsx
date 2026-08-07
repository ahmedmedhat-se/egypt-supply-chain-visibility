import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheck,
  FaExclamationCircle,
  FaKey,
  FaCheckCircle,
} from 'react-icons/fa';
import { authApi } from '../../api/auth.api';
import { extractErrorMessage } from '../../api/client';
import { ROUTES } from '../../constants/routes';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { cn } from '../../lib/utils';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface ResetPasswordFormProps {
  token: string;
  className?: string;
}

export const ResetPasswordForm = ({ token, className }: ResetPasswordFormProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordFormData) =>
      authApi.resetPassword({ token, newPassword: data.newPassword }),
    onSuccess: () => setStatus('success'),
    onError: (error: unknown) => {
      setStatus('error');
      setErrorMessage(extractErrorMessage(error));
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = (data: ResetPasswordFormData) => {
    setStatus('submitting');
    setErrorMessage('');
    resetMutation.mutate(data);
  };

  const handleFocus = (field: string) =>
    setFocusedFields((prev) => ({ ...prev, [field]: true }));

  const handleBlur = (field: keyof ResetPasswordFormData) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    trigger(field);
  };

  const getFieldState = (field: keyof ResetPasswordFormData) => {
    const hasError = errors[field];
    const isTouched = touchedFields[field];
    const isFocused = focusedFields[field];
    const hasValue = !!getValues(field);

    if (hasError && isTouched) return 'error';
    if (isFocused) return 'focused';
    if (isTouched && !hasError && hasValue) return 'success';
    return 'default';
  };

  const getFieldStyles = (field: keyof ResetPasswordFormData) => {
    const state = getFieldState(field);
    const baseStyles =
      'w-full px-4 py-3.5 rounded-xl border-2 bg-white dark:bg-[#111111] text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:outline-none transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';

    const stateStyles = {
      default:
        'border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#94A3B8] dark:hover:border-[#64748B]',
      focused:
        'border-[#2D9B6E] shadow-[0_0_0_4px_rgba(45,155,110,0.15)] dark:shadow-[0_0_0_4px_rgba(45,155,110,0.25)]',
      error:
        'border-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.15)] dark:shadow-[0_0_0_4px_rgba(220,38,38,0.25)] bg-[#FEF2F2] dark:bg-[#2A0F0F]',
      success: 'border-[#2D9B6E] bg-[#F0FDF4] dark:bg-[#0F2A1F]',
    };

    return cn(baseStyles, stateStyles[state]);
  };

  const renderFieldIcon = (field: keyof ResetPasswordFormData) => {
    const state = getFieldState(field);
    if (state === 'error' && touchedFields[field]) {
      return <FaExclamationCircle className="w-4 h-4 text-[#DC2626]" />;
    }
    if (state === 'success' && touchedFields[field]) {
      return <FaCheck className="w-4 h-4 text-[#2D9B6E]" />;
    }
    return null;
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center mx-auto mb-4 animate-in fade-in zoom-in duration-300">
          <FaCheckCircle className="w-8 h-8 text-[#2D9B6E]" />
        </div>
        <h3 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">
          Password Reset
        </h3>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm mb-6 max-w-sm mx-auto">
          Your password has been changed successfully. For security, you've been signed
          out of every device — sign in with your new password.
        </p>
        <Link to={ROUTES.LOGIN}>
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 hover:shadow-xl hover:shadow-[#2D9B6E]/40 transition-all duration-300">
            <span>Back to Sign In</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </Link>
      </div>
    );
  }

  /* ── Error banner (invalid/expired token or failed request) ─── */
  const showErrorBanner = status === 'error' && errorMessage;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-6', className)}>
      {showErrorBanner && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800/50 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
          <FaExclamationCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300">
              We couldn't reset your password
            </p>
            <p className="text-sm text-red-600 dark:text-red-400/90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          New Password
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter a new password"
            autoComplete="new-password"
            autoFocus
            disabled={status === 'submitting'}
            className={cn(getFieldStyles('newPassword'), 'pr-12')}
            {...register('newPassword')}
            onFocus={() => handleFocus('newPassword')}
            onBlur={() => handleBlur('newPassword')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {renderFieldIcon('newPassword')}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-all duration-200 hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <PasswordStrengthIndicator password={newPassword} />
        {errors.newPassword && touchedFields.newPassword && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Confirm New Password
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            disabled={status === 'submitting'}
            className={cn(getFieldStyles('confirmPassword'), 'pr-12')}
            {...register('confirmPassword')}
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={() => handleBlur('confirmPassword')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {renderFieldIcon('confirmPassword')}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-all duration-200 hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A]"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {errors.confirmPassword && touchedFields.confirmPassword && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 dark:shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/40 dark:hover:shadow-[#2D9B6E]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-[#2D9B6E]/30"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {status === 'submitting' ? (
            <>
              <FaSpinner className="animate-spin w-5 h-5" />
              <span>Resetting...</span>
            </>
          ) : (
            <>
              <FaKey className="w-4 h-4" />
              <span>Reset Password</span>
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
