import React from 'react';

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

// 统一的按钮样式配置
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200',
  success: 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200',
  warning: 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200',
  danger: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200',
  info: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200',
  outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300'
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  
  const finalClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim();
  
  return (
    <button
      className={finalClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="i-carbon-loading animate-spin mr-2"></span>
      )}
      {!loading && icon && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
};