// ToastContext.tsx - Toast上下文提供者
import React, { createContext, useContext } from 'react';
import { ToastContainer, useToast, type ToastMessage } from '../components/ui/Toast';

interface ToastContextType {
  messages: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  success: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  error: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  warning: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  info: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer
        messages={toast.messages}
        onClose={toast.removeToast}
        position={position}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;