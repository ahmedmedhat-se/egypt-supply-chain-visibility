import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { FaChevronDown } from 'react-icons/fa';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, required, id, options, placeholder, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[#1A2A3A] mb-1.5">
            {label}
            {required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 bg-white appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-[#0A2E4A] focus:border-transparent',
              'text-[#1A2A3A]',
              error 
                ? 'border-[#DC2626] focus:ring-[#DC2626]' 
                : 'border-[#D1D9E6] hover:border-[#0A2E4A]',
              'disabled:bg-[#F1F4F8] disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>{placeholder}</option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
        </div>
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

Select.displayName = 'Select';