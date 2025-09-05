import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  size = 'md',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
      default:
        return 'px-3 py-2 text-sm';
    }
  };
  
  const baseInputClasses = `w-full border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${getSizeClasses()}`;
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500';
  const iconClasses = icon ? (size === 'sm' ? 'pl-8' : size === 'lg' ? 'pl-12' : 'pl-10') : '';
  
  const inputClasses = `${baseInputClasses} ${errorClasses} ${iconClasses} ${className}`.trim();
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};