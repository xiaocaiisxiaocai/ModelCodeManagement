// useServiceResponse.ts - 统一服务响应处理Hook
import { useState } from 'react';
import type { ServiceResponse } from '../types/domain';

/**
 * 统一服务响应处理Hook
 * 提供统一的加载状态、错误处理和响应处理逻辑
 */
export const useServiceResponse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * 处理服务响应
   * @param serviceCall 服务调用函数
   * @param onSuccess 成功回调
   * @param onError 错误回调
   * @returns 响应数据或null
   */
  const handleResponse = async <T,>(
    serviceCall: () => Promise<ServiceResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await serviceCall();
      
      if (response.success && response.data) {
        // 成功处理
        onSuccess?.(response.data);
        
        
        return response.data;
      } else {
        // 错误处理
        const errorMsg = response.error || '操作失败';
        setError(errorMsg);
        onError?.(errorMsg);
        
        
        return null;
      }
    } catch (err) {
      // 网络错误处理
      const errorMsg = '网络连接错误';
      setError(errorMsg);
      onError?.(errorMsg);
      
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 清除错误状态
   */
  const clearError = () => {
    setError('');
  };

  /**
   * 显示成功提示（可扩展为toast通知）
   */
  const showSuccess = (message: string) => {
    // TODO: 集成toast通知系统
    // toast.success(message);
  };

  /**
   * 显示错误提示（可扩展为toast通知）
   */
  const showError = (message: string) => {
    // TODO: 集成toast通知系统
    // toast.error(message);
  };

  return {
    loading,
    error,
    handleResponse,
    clearError,
    showSuccess,
    showError
  };
};

export default useServiceResponse;