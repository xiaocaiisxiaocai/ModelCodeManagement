import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  clickable = false,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const hoverClasses = hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';
  
  const finalClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`.trim();
  
  return (
    <div className={finalClasses} onClick={onClick}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}>
    {children}
  </div>
);