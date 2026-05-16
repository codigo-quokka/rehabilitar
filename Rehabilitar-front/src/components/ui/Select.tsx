import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-base font-medium text-dark dark:text-gray-100 mb-2.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-5 py-3 pr-8 rounded-xl border bg-white dark:bg-gray-800 text-dark dark:text-gray-100 text-base transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500' : ''} ${className}`}
          style={{ borderColor: '#6DD3A8', color: '#2C7E8B' }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';