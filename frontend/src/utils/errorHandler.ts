// errorHandler.ts - 统一错误处理工具
import type { ServiceResponse } from '../types/domain';

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  /**
   * 处理API服务响应错误
   */
  static handleServiceError<T>(response: ServiceResponse<T>, context?: string): void {
    if (!response.success && response.error) {
      console.error(`🚫 [${context || 'Service'}] API Error:`, {
        error: response.error,
        message: response.message,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 处理组件异步操作错误
   */
  static handleAsyncError(error: unknown, context: string, details?: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`💥 [${context}] Async Error:`, {
      error: errorMessage,
      details,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理表单验证错误
   */
  static handleValidationError(field: string, message: string, context?: string): void {
    console.error(`📝 [${context || 'Form'}] Validation Error:`, {
      field,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理权限相关错误
   */
  static handlePermissionError(action: string, resource?: string, userId?: string): void {
    console.error('🔒 [Permission] Access Denied:', {
      action,
      resource,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 通用错误记录方法
   */
  static logError(category: string, message: string, data?: any): void {
    console.error(`❌ [${category}]`, {
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  /**
   * 检查响应是否有错误并自动处理
   */
  static checkAndHandle<T>(response: ServiceResponse<T>, context: string): boolean {
    if (!response.success) {
      this.handleServiceError(response, context);
      return false;
    }
    return true;
  }
}

/**
 * 错误边界组件使用的错误处理
 */
export class ComponentErrorHandler {
  static handleComponentError(error: Error, errorInfo: any, componentName: string): void {
    console.error(`⚠️ [${componentName}] Component Error:`, {
      error: error.message,
      stack: error.stack,
      errorInfo,
      componentName,
      timestamp: new Date().toISOString()
    });
  }
}

export default ErrorHandler;