// useServiceResponseEnhanced.ts - 增强版服务响应钩子
import { useState, useCallback } from 'react';
import { useToastContext } from '../contexts/ToastContext';
import type { DataResponse } from '../mock/interfaces';

interface UseServiceResponseEnhancedOptions {
  successMessage?: string | ((data: any) => string);
  errorMessage?: string | ((error: string) => string);
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseServiceResponseEnhancedReturn {
  loading: boolean;
  error: string | null;
  retryCount: number;
  handleResponse: <T>(
    serviceCall: () => Promise<DataResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void,
    options?: UseServiceResponseEnhancedOptions
  ) => Promise<DataResponse<T>>;
  retry: () => void;
  clearError: () => void;
  showSuccess: (message: string, description?: string) => void;
  showError: (message: string, description?: string) => void;
  showWarning: (message: string, description?: string) => void;
  showInfo: (message: string, description?: string) => void;
}

export const useServiceResponseEnhanced = (
  defaultOptions: UseServiceResponseEnhancedOptions = {}
): UseServiceResponseEnhancedReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastServiceCall, setLastServiceCall] = useState<(() => Promise<any>) | null>(null);
  
  const toast = useToastContext();

  const {
    successMessage: defaultSuccessMessage,
    errorMessage: defaultErrorMessage,
    showSuccessToast = true,
    showErrorToast = true,
    retryOnError = false,
    maxRetries = 3,
    retryDelay = 1000
  } = defaultOptions;

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, description);
  }, [toast]);

  const showError = useCallback((message: string, description?: string) => {
    toast.error(message, description, {
      actions: retryOnError && lastServiceCall ? [
        {
          label: '重试',
          onClick: () => retry(),
          variant: 'primary'
        }
      ] : undefined
    });
  }, [toast, retryOnError, lastServiceCall]);

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, description);
  }, [toast]);

  const showInfo = useCallback((message: string, description?: string) => {
    toast.info(message, description);
  }, [toast]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeWithRetry = async <T>(
    serviceCall: () => Promise<DataResponse<T>>,
    options: UseServiceResponseEnhancedOptions,
    attempt = 1
  ): Promise<DataResponse<T>> => {
    try {
      const response = await serviceCall();
      
      if (response.success) {
        setRetryCount(0);
        return response;
      } else {
        // 服务返回失败，检查是否需要重试
        if (options.retryOnError && attempt < (options.maxRetries || maxRetries)) {
          await sleep((options.retryDelay || retryDelay) * attempt);
          setRetryCount(attempt);
          return executeWithRetry(serviceCall, options, attempt + 1);
        }
        
        throw new Error(response.error || '操作失败');
      }
    } catch (error) {
      // 网络错误或其他异常，检查是否需要重试
      if (options.retryOnError && attempt < (options.maxRetries || maxRetries)) {
        await sleep((options.retryDelay || retryDelay) * attempt);
        setRetryCount(attempt);
        return executeWithRetry(serviceCall, options, attempt + 1);
      }
      
      throw error;
    }
  };

  const handleResponse = useCallback(async <T>(
    serviceCall: () => Promise<DataResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void,
    options: UseServiceResponseEnhancedOptions = {}
  ): Promise<DataResponse<T>> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    setLoading(true);
    setError(null);
    setLastServiceCall(() => serviceCall);

    try {
      const response = await executeWithRetry(serviceCall, mergedOptions);
      
      if (response.success && response.data !== undefined) {
        // 成功处理
        if (onSuccess) {
          onSuccess(response.data);
        }
        
        // 显示成功消息
        if (mergedOptions.showSuccessToast !== false) {
          const successMsg = typeof mergedOptions.successMessage === 'function'
            ? mergedOptions.successMessage(response.data)
            : mergedOptions.successMessage || defaultSuccessMessage || response.message || '操作成功';
          
          if (successMsg) {
            showSuccess(successMsg);
          }
        }
        
        return response;
      } else {
        throw new Error(response.error || '操作失败');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      
      // 错误处理回调
      if (onError) {
        onError(errorMessage);
      }
      
      // 显示错误消息
      if (mergedOptions.showErrorToast !== false) {
        const errorMsg = typeof mergedOptions.errorMessage === 'function'
          ? mergedOptions.errorMessage(errorMessage)
          : mergedOptions.errorMessage || defaultErrorMessage || errorMessage;
        
        if (errorMsg) {
          showError(errorMsg, retryCount > 0 ? `重试次数: ${retryCount}/${mergedOptions.maxRetries || maxRetries}` : undefined);
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [defaultOptions, defaultSuccessMessage, defaultErrorMessage, showSuccess, showError, retryCount, maxRetries]);

  const retry = useCallback(async () => {
    if (lastServiceCall) {
      await handleResponse(lastServiceCall);
    }
  }, [lastServiceCall, handleResponse]);

  return {
    loading,
    error,
    retryCount,
    handleResponse,
    retry,
    clearError,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useServiceResponseEnhanced;