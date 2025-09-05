// client.ts - 统一HTTP客户端

// 简化的API响应接口
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 统一HTTP客户端类
 * 提供所有API请求的统一入口，处理认证、错误和响应格式
 */
export class ApiClient {
  private baseURL = 'http://localhost:5250/api/v1';
  private defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  /**
   * GET请求
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        ...options,
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log('🔍 [ApiClient.post] 开始POST请求');
      console.log('🔍 [ApiClient.post] 完整URL:', url);
      console.log('🔍 [ApiClient.post] 请求数据:', data);
      console.log('🔍 [ApiClient.post] 请求选项:', options);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });
      
      console.log('🔍 [ApiClient.post] 响应状态:', response.status, response.statusText);
      console.log('🔍 [ApiClient.post] 响应头:', Object.fromEntries(response.headers.entries()));
      
      const result = await this.handleResponse<T>(response);
      console.log('🔍 [ApiClient.post] 处理后的响应:', result);
      
      return result;
    } catch (error) {
      console.error('💥 [ApiClient.post] POST请求异常:', error);
      return this.handleError(error);
    }
  }

  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeaders(),
          ...options?.headers,
        },
        ...options,
      });
      
      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * 获取认证头部
   */
  private getAuthHeaders(): HeadersInit {
    const token = this.getStoredToken();
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    console.log('🔍 [ApiClient.getAuthHeaders] 获取到的token:', token ? `${token.substring(0, 20)}...` : 'null');
    console.log('🔍 [ApiClient.getAuthHeaders] 返回的认证头:', headers);
    return headers;
  }

  /**
   * 从存储中获取访问令牌
   */
  private getStoredToken(): string | null {
    try {
      // 统一从localStorage获取accessToken
      const token = localStorage.getItem('accessToken');
      console.log('🔍 [ApiClient.getStoredToken] 从localStorage获取token:', token ? `${token.substring(0, 20)}...` : 'null');
      return token;
    } catch (error) {
      console.warn('❌ [ApiClient.getStoredToken] 获取token失败:', error);
      return null;
    }
  }

  /**
   * 统一响应处理
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      console.log('🔍 [ApiClient.handleResponse] 开始处理响应');
      console.log('🔍 [ApiClient.handleResponse] 响应状态:', response.status, response.statusText);
      
      // 检查HTTP状态码
      if (!response.ok) {
        console.log('🔍 [ApiClient.handleResponse] 响应状态码错误，调用handleHttpError');
        return await this.handleHttpError(response);
      }

      // 解析JSON响应
      const contentType = response.headers.get('content-type');
      console.log('🔍 [ApiClient.handleResponse] 响应Content-Type:', contentType);
      
      if (!contentType?.includes('application/json')) {
        // 对于非JSON响应（如文件下载），返回成功状态
        console.log('🔍 [ApiClient.handleResponse] 非JSON响应，返回成功状态');
        return {
          success: true,
          message: '请求成功'
        };
      }

      const jsonData = await response.json();
      console.log('🔍 [ApiClient.handleResponse] 原始JSON数据:', jsonData);
      
      // 处理后端可能的不一致响应格式
      const normalizedResponse = this.normalizeApiResponse<T>(jsonData);
      console.log('🔍 [ApiClient.handleResponse] 标准化后的响应:', normalizedResponse);
      
      return normalizedResponse;
      
    } catch (error) {
      console.error('❌ [ApiClient.handleResponse] Response parsing error:', error);
      return {
        success: false,
        error: `响应解析失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 标准化API响应格式
   * 处理后端可能返回的各种数据结构
   */
  private normalizeApiResponse<T>(rawResponse: any): ApiResponse<T> {
    // 如果已经是标准格式，直接返回
    if (typeof rawResponse === 'object' && 
        rawResponse !== null && 
        'success' in rawResponse) {
      return rawResponse as ApiResponse<T>;
    }

    // 处理直接返回数据的情况
    if (Array.isArray(rawResponse)) {
      return {
        success: true,
        data: rawResponse as T,
        message: '请求成功'
      };
    }

    // 处理包装数据的情况 { Data: [...], Message: "..." }
    if (rawResponse && typeof rawResponse === 'object') {
      const success = rawResponse.Success !== undefined ? rawResponse.Success : 
                     rawResponse.success !== undefined ? rawResponse.success : true;
      const data = rawResponse.Data || rawResponse.data || rawResponse;
      const message = rawResponse.Message || rawResponse.message || '请求成功';
      
      return {
        success: success,
        data: data as T,
        message
      };
    }

    // 兜底情况
    return {
      success: true,
      data: rawResponse as T,
      message: '请求成功'
    };
  }

  /**
   * 处理HTTP错误状态码
   */
  private async handleHttpError(response: Response): Promise<ApiResponse<any>> {
    console.log('🔍 [ApiClient.handleHttpError] 开始处理HTTP错误');
    console.log('🔍 [ApiClient.handleHttpError] 错误状态码:', response.status, response.statusText);
    
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      console.log('🔍 [ApiClient.handleHttpError] 错误响应数据:', errorData);
      
      if (errorData.error || errorData.message) {
        errorMessage = errorData.error || errorData.message;
        console.log('🔍 [ApiClient.handleHttpError] 提取的错误信息:', errorMessage);
      }
    } catch (parseError) {
      console.log('🔍 [ApiClient.handleHttpError] JSON解析失败，使用默认错误信息:', parseError);
      // 忽略JSON解析错误，使用默认错误信息
    }

    // 处理特定状态码
    switch (response.status) {
      case 401:
        console.log('🔍 [ApiClient.handleHttpError] 处理401未授权错误');
        this.handleUnauthorized();
        errorMessage = '未授权，请重新登录';
        break;
      case 403:
        console.log('🔍 [ApiClient.handleHttpError] 处理403权限不足错误');
        errorMessage = '权限不足，无法访问该资源';
        break;
      case 404:
        console.log('🔍 [ApiClient.handleHttpError] 处理404资源不存在错误');
        errorMessage = '请求的资源不存在';
        break;
      case 500:
        console.log('🔍 [ApiClient.handleHttpError] 处理500服务器内部错误');
        errorMessage = '服务器内部错误，请稍后重试';
        break;
      default:
        console.log('🔍 [ApiClient.handleHttpError] 处理其他状态码错误');
        break;
    }

    const result = {
      success: false,
      error: errorMessage
    };
    console.log('🔍 [ApiClient.handleHttpError] 返回错误结果:', result);
    
    return result;
  }

  /**
   * 处理未授权状态（401）
   */
  private handleUnauthorized(): void {
    // 清除所有认证相关的存储数据
    this.clearAccessToken();
    
    // 触发自定义事件，通知应用处理未授权状态
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: { message: '登录已过期，请重新登录' }
    }));
  }

  /**
   * 通用错误处理
   */
  private handleError(error: unknown): ApiResponse<any> {
    console.error('❌ [ApiClient] Network error:', error);
    
    let errorMessage = '网络请求失败';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // 网络连接错误的特殊处理
    if (errorMessage.includes('fetch')) {
      errorMessage = '网络连接失败，请检查网络连接';
    }

    return {
      success: false,
      error: errorMessage
    };
  }

  /**
   * 设置基础URL（用于测试或不同环境）
   */
  setBaseURL(url: string): void {
    this.baseURL = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * 设置默认头部
   */
  setDefaultHeaders(headers: HeadersInit): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * 设置访问令牌
   */
  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  /**
   * 清除访问令牌
   */
  clearAccessToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * 登录方法
   */
  async login(employeeId: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.post('/auth/login', {
        employeeId,
        password
      });

      if (response.success && response.data) {
        // 后端返回的数据结构: response.data = LoginResponseDto
        const loginData = response.data as any;
        
        // 自动设置token
        const token = loginData.AccessToken || loginData.accessToken;
        if (token) {
          this.setAccessToken(token);
        } else {
          console.error('❌ [ApiClient] 未找到AccessToken:', loginData);
        }

        // 保存用户信息
        const user = loginData.User || loginData.user;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          console.error('❌ [ApiClient] 未找到User信息:', loginData);
        }

        // 保存refresh token
        const refreshToken = loginData.RefreshToken || loginData.refreshToken;
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        } else {
          console.warn('⚠️ [ApiClient] 未找到RefreshToken');
        }
      }

      return response;
    } catch (error) {
      console.error('❌ [ApiClient] 登录失败:', error);
      return {
        success: false,
        error: `登录失败: ${error}`
      };
    }
  }
}

// 创建默认实例
export const apiClient = new ApiClient();