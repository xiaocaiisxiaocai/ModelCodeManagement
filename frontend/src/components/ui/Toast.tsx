// Toast.tsx - Toast通知组件
import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// 单个Toast组件
const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 自动关闭
    if (message.duration !== 0) {
      const duration = message.duration || 5000;
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(message.id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-start p-4 mb-3 rounded-lg shadow-lg border transition-all duration-300 transform";
    const visibilityStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    return `${baseStyles} ${typeStyles[message.type]} ${visibilityStyles}`;
  };

  const getIcon = () => {
    const iconStyles = "text-xl mr-3 mt-0.5";
    switch (message.type) {
      case 'success':
        return <span className={`i-carbon-checkmark-filled ${iconStyles} text-green-500`}></span>;
      case 'error':
        return <span className={`i-carbon-error-filled ${iconStyles} text-red-500`}></span>;
      case 'warning':
        return <span className={`i-carbon-warning-filled ${iconStyles} text-yellow-500`}></span>;
      case 'info':
        return <span className={`i-carbon-information-filled ${iconStyles} text-blue-500`}></span>;
    }
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{message.title}</div>
        {message.message && (
          <div className="text-sm mt-1 opacity-90">{message.message}</div>
        )}
        
        {message.actions && message.actions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {message.actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button
        onClick={handleClose}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="关闭"
      >
        <span className="i-carbon-close text-lg"></span>
      </button>
    </div>
  );
};

// Toast容器组件
export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  messages, 
  onClose, 
  position = 'top-right' 
}) => {
  const getContainerStyles = () => {
    const baseStyles = "fixed z-50 max-w-sm w-full";
    
    const positionStyles = {
      'top-right': "top-4 right-4",
      'top-left': "top-4 left-4",
      'bottom-right': "bottom-4 right-4",
      'bottom-left': "bottom-4 left-4",
      'top-center': "top-4 left-1/2 transform -translate-x-1/2",
      'bottom-center': "bottom-4 left-1/2 transform -translate-x-1/2"
    };

    return `${baseStyles} ${positionStyles[position]}`;
  };

  if (messages.length === 0) return null;

  return (
    <div className={getContainerStyles()}>
      {messages.map(message => (
        <Toast
          key={message.id}
          message={message}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };
    
    setMessages(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearAll = () => {
    setMessages([]);
  };

  // 便捷方法
  const success = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'success', title, message, ...options });
  };

  const error = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'error', title, message, duration: 0, ...options }); // 错误默认不自动关闭
  };

  const warning = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'warning', title, message, ...options });
  };

  const info = (title: string, message?: string, options?: Partial<ToastMessage>) => {
    return addToast({ type: 'info', title, message, ...options });
  };

  return {
    messages,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

export default Toast;