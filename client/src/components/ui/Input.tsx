import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#1A2A3A] mb-1.5">
            {label}
            {required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 bg-white',
            'focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] focus:border-transparent',
            'placeholder:text-[#94A3B8] text-[#1A2A3A]',
            error 
              ? 'border-[#DC2626] focus:ring-[#DC2626]' 
              : 'border-[#D1D9E6] hover:border-[#0A2E4A]',
            'disabled:bg-[#F1F4F8] disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#DC2626] flex items-center gap-1">
            <span>⚠</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';