import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaGoogle, FaLinkedin, FaSpinner } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { cn } from '../../lib/utils';

const registerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(100, 'First name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(100, 'Last name is too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long'),
  organizationName: z.string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name is too long'),
  organizationType: z.string()
    .min(1, 'Please select an organization type')
    .refine((val) => ['shipper', 'carrier', 'regulator'].includes(val), 'Invalid organization type'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(val),
      'Invalid phone number format'
    ),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  acceptTerms: z.boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  className?: string;
  onSuccess?: () => void;
}

export const RegisterForm = ({ className, onSuccess }: RegisterFormProps) => {
  const { register: registerUser, registerLoading } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organizationName: '',
      organizationType: 'shipper',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      organizationName: data.organizationName,
      organizationType: data.organizationType as 'shipper' | 'carrier' | 'regulator',
      phone: data.phone,
      acceptTerms: data.acceptTerms,
    });
    onSuccess?.();
  };

  const handleFocus = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setFocusedFields(prev => ({ ...prev, [field]: false }));
  };

  const getFieldRing = (field: string) => {
    if (errors[field as keyof RegisterFormData]) {
      return 'ring-2 ring-[#DC2626] ring-offset-2 dark:ring-offset-[#0A2E4A]';
    }
    if (focusedFields[field]) {
      return 'ring-2 ring-[#2D9B6E] ring-offset-2 dark:ring-offset-[#0A2E4A]';
    }
    return '';
  };

  const getFieldBorder = (field: string) => {
    if (errors[field as keyof RegisterFormData]) {
      return 'border-[#DC2626] dark:border-[#DC2626]';
    }
    return 'border-[#D1D9E6] dark:border-[#1A3D5A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E]';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-5', className)}>
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
            First Name
            <span className="text-[#DC2626]">*</span>
          </label>
          <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('firstName'))}>
            <input
              type="text"
              placeholder="Ahmed"
              autoComplete="given-name"
              autoFocus
              disabled={registerLoading}
              className={cn(
                'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                'focus:outline-none transition-all duration-200',
                getFieldBorder('firstName'),
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              {...register('firstName')}
              onFocus={() => handleFocus('firstName')}
              onBlur={() => handleBlur('firstName')}
            />
          </div>
          {errors.firstName && (
            <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
              <span className="text-xs">⚠</span>
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
            Last Name
            <span className="text-[#DC2626]">*</span>
          </label>
          <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('lastName'))}>
            <input
              type="text"
              placeholder="Medhat"
              autoComplete="family-name"
              disabled={registerLoading}
              className={cn(
                'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
                'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
                'focus:outline-none transition-all duration-200',
                getFieldBorder('lastName'),
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              {...register('lastName')}
              onFocus={() => handleFocus('lastName')}
              onBlur={() => handleBlur('lastName')}
            />
          </div>
          {errors.lastName && (
            <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
              <span className="text-xs">⚠</span>
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Email Address
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('email'))}>
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200',
              getFieldBorder('email'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('email')}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Organization Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Organization Name
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('organizationName'))}>
          <input
            type="text"
            placeholder="Your company name"
            autoComplete="organization"
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200',
              getFieldBorder('organizationName'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('organizationName')}
            onFocus={() => handleFocus('organizationName')}
            onBlur={() => handleBlur('organizationName')}
          />
        </div>
        {errors.organizationName && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.organizationName.message}
          </p>
        )}
      </div>

      {/* Organization Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Organization Type
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('organizationType'))}>
          <select
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A] appearance-none',
              'text-[#1A2A3A] dark:text-[#E2E8F0]',
              'focus:outline-none transition-all duration-200 cursor-pointer',
              getFieldBorder('organizationType'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('organizationType')}
            onFocus={() => handleFocus('organizationType')}
            onBlur={() => handleBlur('organizationType')}
          >
            <option value="shipper">Shipper</option>
            <option value="carrier">Carrier</option>
            <option value="regulator">Regulator</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-[#94A3B8] dark:text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.organizationType && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.organizationType.message}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0]">
          Phone Number <span className="text-[#94A3B8] dark:text-[#64748B] text-xs font-normal">(Optional)</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('phone'))}>
          <input
            type="tel"
            placeholder="+20 123 456 7890"
            autoComplete="tel"
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200',
              getFieldBorder('phone'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('phone')}
            onFocus={() => handleFocus('phone')}
            onBlur={() => handleBlur('phone')}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Password
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('password'))}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200 pr-12',
              getFieldBorder('password'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('password')}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
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
        <PasswordStrengthIndicator password={password || ''} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1">
          Confirm Password
          <span className="text-[#DC2626]">*</span>
        </label>
        <div className={cn('relative rounded-xl transition-all duration-200', getFieldRing('confirmPassword'))}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={registerLoading}
            className={cn(
              'w-full px-4 py-3.5 rounded-xl border bg-white dark:bg-[#1A3D5A]',
              'text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B]',
              'focus:outline-none transition-all duration-200 pr-12',
              getFieldBorder('confirmPassword'),
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            {...register('confirmPassword')}
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={() => handleBlur('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-1">
            <span className="text-xs">⚠</span>
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms */}
      <div className="pt-1">
        <label className="flex items-start gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] cursor-pointer hover:text-[#0A2E4A] dark:hover:text-[#E2E8F0] transition-colors group">
          <input
            type="checkbox"
            {...register('acceptTerms')}
            disabled={registerLoading}
            className="mt-0.5 w-4 h-4 rounded border-[#D1D9E6] dark:border-[#1A3D5A] text-[#2D9B6E] focus:ring-[#2D9B6E] focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[#0A2E4A] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="group-hover:text-[#0A2E4A] dark:group-hover:text-[#E2E8F0] transition-colors">
            I agree to the{' '}
            <Link to={ROUTES.TERMS} className="text-[#2D9B6E] hover:underline font-medium">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to={ROUTES.PRIVACY} className="text-[#2D9B6E] hover:underline font-medium">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-2">
            <span className="text-xs">⚠</span>
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={registerLoading}
        className="bg-[#2D9B6E] hover:bg-[#1F7A52] dark:bg-[#2D9B6E] dark:hover:bg-[#1F7A52] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#2D9B6E]/20 dark:shadow-[#2D9B6E]/10 hover:shadow-xl hover:shadow-[#2D9B6E]/30 dark:hover:shadow-[#2D9B6E]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {registerLoading ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin w-4 h-4" />
            <span>Creating account...</span>
          </div>
        ) : (
          <span>Create Account</span>
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E2E8F0] dark:border-[#1A3D5A]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-[#1A3D5A] px-4 text-xs font-medium text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={registerLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-[#D1D9E6] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#0A2E4A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <FaGoogle className="text-red-500 group-hover:scale-110 transition-transform" />
          <span>Google</span>
        </button>
        <button
          type="button"
          disabled={registerLoading}
          className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-[#D1D9E6] dark:border-[#1A3D5A] bg-white dark:bg-[#1A3D5A] text-[#1A2A3A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#0A2E4A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <FaLinkedin className="text-[#0A66C2] group-hover:scale-110 transition-transform" />
          <span>LinkedIn</span>
        </button>
      </div>

      {/* Sign in link */}
      <p className="text-center text-sm text-[#94A3B8] dark:text-[#64748B]">
        Already have an account?{' '}
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