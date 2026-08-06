import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaEye, FaEyeSlash, FaSpinner, FaCheck, FaExclamationCircle } from 'react-icons/fa';
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
  organizationEmail: z.string()
    .min(1, 'Organization email is required')
    .email('Please enter a valid organization email')
    .max(255, 'Organization email is too long'),
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
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      organizationName: '',
      organizationEmail: '',
      organizationType: 'shipper',
      phone: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: 'password' });

  /**
   * Handles form submission by calling the registerUser function from useAuth hook
   */
  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      organizationName: data.organizationName,
      organizationEmail: data.organizationEmail,
      organizationType: data.organizationType,
      phone: data.phone,
      acceptTerms: data.acceptTerms,
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
    trigger(field as keyof RegisterFormData);
  };

  /**
   * Determines the visual state of a field based on focus, touch, errors, and value
   * Returns: 'default' | 'focused' | 'error' | 'success'
   */
  const getFieldState = (field: string) => {
    const hasError = errors[field as keyof RegisterFormData];
    const isTouched = touchedFields[field];
    const isFocused = focusedFields[field];
    const fieldValue = getValues(field as keyof RegisterFormData);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
            First Name
            <span className="text-[#DC2626] text-base">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ahmed"
              autoComplete="given-name"
              autoFocus
              disabled={registerLoading}
              className={cn(getFieldStyles('firstName'), 'pr-10')}
              {...register('firstName')}
              onFocus={() => handleFocus('firstName')}
              onBlur={() => handleBlur('firstName')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderFieldIcon('firstName')}
            </div>
          </div>
          {errors.firstName && touchedFields.firstName && (
            <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs">⚠</span>
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
            Last Name
            <span className="text-[#DC2626] text-base">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Medhat"
              autoComplete="family-name"
              disabled={registerLoading}
              className={cn(getFieldStyles('lastName'), 'pr-10')}
              {...register('lastName')}
              onFocus={() => handleFocus('lastName')}
              onBlur={() => handleBlur('lastName')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderFieldIcon('lastName')}
            </div>
          </div>
          {errors.lastName && touchedFields.lastName && (
            <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
              <span className="text-xs">⚠</span>
              {errors.lastName.message}
            </p>
          )}
        </div>
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
            disabled={registerLoading}
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
          Organization Name
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Your company name"
            autoComplete="organization"
            disabled={registerLoading}
            className={cn(getFieldStyles('organizationName'), 'pr-10')}
            {...register('organizationName')}
            onFocus={() => handleFocus('organizationName')}
            onBlur={() => handleBlur('organizationName')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderFieldIcon('organizationName')}
          </div>
        </div>
        {errors.organizationName && touchedFields.organizationName && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.organizationName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Organization Email
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="contact@company.com"
            autoComplete="email"
            disabled={registerLoading}
            className={cn(getFieldStyles('organizationEmail'), 'pr-10')}
            {...register('organizationEmail')}
            onFocus={() => handleFocus('organizationEmail')}
            onBlur={() => handleBlur('organizationEmail')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderFieldIcon('organizationEmail')}
          </div>
        </div>
        {errors.organizationEmail && touchedFields.organizationEmail && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.organizationEmail.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Organization Type
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <select
            disabled={registerLoading}
            className={cn(
              getFieldStyles('organizationType'),
              'appearance-none cursor-pointer pr-12'
            )}
            {...register('organizationType')}
            onFocus={() => handleFocus('organizationType')}
            onBlur={() => handleBlur('organizationType')}
          >
            <option value="shipper">Shipper</option>
            <option value="carrier">Carrier</option>
            <option value="regulator">Regulator</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
            {renderFieldIcon('organizationType')}
            <svg className="w-4 h-4 text-[#94A3B8] dark:text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {errors.organizationType && touchedFields.organizationType && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.organizationType.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Phone Number
          <span className="text-xs font-normal text-[#94A3B8] dark:text-[#64748B]">(Optional)</span>
        </label>
        <div className="relative">
          <input
            type="tel"
            placeholder="+20 123 456 7890"
            autoComplete="tel"
            disabled={registerLoading}
            className={cn(getFieldStyles('phone'), 'pr-10')}
            {...register('phone')}
            onFocus={() => handleFocus('phone')}
            onBlur={() => handleBlur('phone')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderFieldIcon('phone')}
          </div>
        </div>
        {errors.phone && touchedFields.phone && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.phone.message}
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
            autoComplete="new-password"
            disabled={registerLoading}
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
        {password && (
          <div className="animate-in fade-in duration-300">
            <PasswordStrengthIndicator password={password} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
          Confirm Password
          <span className="text-[#DC2626] text-base">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={registerLoading}
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
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A2A3A] dark:hover:text-[#E2E8F0] transition-all duration-200 hover:bg-[#F1F5F9] dark:hover:bg-[#1A3D5A]"
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

      <div className="pt-2">
        <label className="flex items-start gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] cursor-pointer group">
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              {...register('acceptTerms')}
              disabled={registerLoading}
              className="peer w-4 h-4 rounded-md border-2 border-[#D1D9E6] dark:border-[#1A3D5A] text-[#2D9B6E] focus:ring-2 focus:ring-[#2D9B6E] focus:ring-offset-2 dark:focus:ring-offset-[#0A2E4A] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <FaCheck className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </div>
          <span className="group-hover:text-[#1A2A3A] dark:group-hover:text-[#E2E8F0] transition-colors duration-200 leading-relaxed">
            I agree to the{' '}
            <Link to={ROUTES.TERMS} className="text-[#2D9B6E] hover:underline font-semibold hover:text-[#1F7A52] transition-colors">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to={ROUTES.PRIVACY} className="text-[#2D9B6E] hover:underline font-semibold hover:text-[#1F7A52] transition-colors">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-[#DC2626] flex items-center gap-1.5 mt-2 font-medium animate-in slide-in-from-top-1 duration-200">
            <span className="text-xs">⚠</span>
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={registerLoading || !isDirty}
        className="w-full relative overflow-hidden group bg-gradient-to-r from-[#2D9B6E] to-[#1F7A52] hover:from-[#1F7A52] hover:to-[#166B44] text-white font-semibold py-4 rounded-xl shadow-lg shadow-[#2D9B6E]/30 dark:shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/40 dark:hover:shadow-[#2D9B6E]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-[#2D9B6E]/30"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {registerLoading ? (
            <>
              <FaSpinner className="animate-spin w-5 h-5" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
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
        Already have an account?{' '}
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