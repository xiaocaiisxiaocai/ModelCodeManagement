import React from 'react';
import { Button } from './';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: {
    text: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
  return (
    <div className="text-center py-16 px-6 bg-white rounded-lg border-2 border-dashed border-gray-200">
      <div className="mx-auto w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-400 rounded-full">
        {React.isValidElement(icon) ? React.cloneElement(icon, { className: 'w-8 h-8' } as any) : icon}
      </div>
      <h3 className="mt-4 text-xl font-medium text-gray-800">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick} variant="primary" disabled={action.disabled}>
            <span className="i-carbon-add mr-1"></span>
            {action.text}
          </Button>
        </div>
      )}
    </div>
  );
};

export { EmptyState };

