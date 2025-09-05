// httpClient.ts - HTTP客户端基础服务

// 简化的响应接口
interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * HTTP客户端服务 - 统一处理API请求
 */
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = 'http://localhost:5250/api/v1') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * 设置Authorization头
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * 移除Authorization头
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * GET请求
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<DataResponse<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.makeRequest<T>(url, { method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T>(endpoint: string, data?: any): Promise<DataResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT请求
   */
  async put<T>(endpoint: string, data?: any): Promise<DataResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(endpoint: string): Promise<DataResponse<T>> {
    const url = this.buildUrl(endpoint);
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }

  /**
   * 构建完整URL
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * 执行HTTP请求
   */
  private async makeRequest<T>(url: string, options: RequestInit): Promise<DataResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
      });

      // 处理响应
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (response.ok) {
        // 🔧 修复：处理后端返回的 PascalCase 字段名
        if (typeof responseData === 'object' && responseData !== null) {
          // 检查是否为后端 ApiResponse 格式
          if (responseData.hasOwnProperty('Success') || responseData.hasOwnProperty('success')) {
            return {
              success: responseData.Success || responseData.success,
              data: responseData.Data || responseData.data,
              message: responseData.Message || responseData.message,
              error: responseData.Error || responseData.error
            };
          }
        }
        
        // 直接返回数据的情况
        return {
          success: true,
          data: responseData,
          message: 'Request successful'
        };
      } else {
        // HTTP错误状态
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        if (typeof responseData === 'object' && responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        }

        console.error('🌐 [HTTP Error]', {
          url,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          responseData
        });

        // 🔧 处理401未授权错误：自动清理过期Token并重定向到登录页
        if (response.status === 401) {
          
          // 清理localStorage中的认证信息
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // 清理httpClient的Authorization头
          this.clearAuthToken();
          
          // 重定向到登录页（避免在登录页时无限重定向）
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          
          return {
            success: false,
            error: 'Token已过期，请重新登录'
          };
        }

        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error) {
      // 网络错误或其他异常
      const errorMessage = `Network error: ${error instanceof Error ? error.message : String(error)}`;
      
      console.error('💥 [Network Error]', {
        url,
        method: options.method,
        error: errorMessage,
        originalError: error
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// 创建默认的HTTP客户端实例
export const httpClient = new HttpClient();

// 自动设置认证Token（如果存在）
const token = localStorage.getItem('accessToken');
if (token) {
  httpClient.setAuthToken(token);
} else {
}

export default httpClient;