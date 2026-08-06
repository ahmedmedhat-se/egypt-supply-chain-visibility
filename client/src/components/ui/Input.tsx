import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    required, 
    success, 
    helperText,
    leftIcon,
    rightIcon,
    id, 
    disabled,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const getFieldState = () => {
      if (error) return 'error';
      if (success) return 'success';
      if (isFocused) return 'focused';
      return 'default';
    };

    const getInputStyles = () => {
      const state = getFieldState();
      const baseStyles = 'w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ease-in-out bg-white dark:bg-[#111111] text-[#1A2A3A] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] dark:placeholder:text-[#64748B] focus:outline-none';

      const stateStyles = {
        default: 'border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#94A3B8] dark:hover:border-[#64748B]',
        focused: 'border-[#2D9B6E] shadow-[0_0_0_4px_rgba(45,155,110,0.15)] dark:shadow-[0_0_0_4px_rgba(45,155,110,0.25)]',
        error: 'border-[#DC2626] shadow-[0_0_0_4px_rgba(220,38,38,0.15)] dark:shadow-[0_0_0_4px_rgba(220,38,38,0.25)] bg-[#FEF2F2] dark:bg-[#2A0F0F]',
        success: 'border-[#2D9B6E] bg-[#F0FDF4] dark:bg-[#0F2A1F]',
      };

      return cn(
        baseStyles,
        stateStyles[state],
        (leftIcon || rightIcon) && 'px-10',
        disabled && 'opacity-50 cursor-not-allowed hover:border-[#E2E8F0] dark:hover:border-[#2A2A2A]'
      );
    };

    const renderIcon = () => {
      const state = getFieldState();
      if (state === 'error') {
        return <FaExclamationCircle className="w-4 h-4 text-[#DC2626]" />;
      }
      if (state === 'success') {
        return <FaCheck className="w-4 h-4 text-[#2D9B6E]" />;
      }
      return null;
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-semibold text-[#1A2A3A] dark:text-[#E2E8F0] transition-colors duration-200"
          >
            {label}
            {required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-[#64748B]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(getInputStyles(), className)}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {(rightIcon || renderIcon()) && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {renderIcon()}
              {rightIcon && (
                <span className="text-[#94A3B8] dark:text-[#64748B]">
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="flex items-start gap-1.5 mt-1">
            {error ? (
              <>
                <span className="text-[#DC2626] text-xs mt-0.5">⚠</span>
                <p className="text-sm text-[#DC2626] font-medium animate-in slide-in-from-top-1 duration-200">
                  {error}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#94A3B8] dark:text-[#64748B]">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';