// authService.ts - 身份认证服务
import { httpClient } from './httpClient';

// 简化的认证相关接口
interface DataResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginRequest {
  employeeId: string;
  password: string;
}

interface LoginResponse {
  AccessToken?: string;
  accessToken?: string;
  RefreshToken?: string;
  refreshToken?: string;
  User?: any;
  user?: any;
}

interface UserInfo {
  id: string;
  employeeId: string;
  userName: string;
  email?: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 身份认证服务 - 连接后端JWT API
 */
export class AuthService {
  private baseURL = '/auth'; // 后端认证API基础路径（相对于api/v1）
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // 从localStorage恢复token
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    // 🔧 关键修复：页面刷新后恢复HTTP客户端的认证头
    if (this.accessToken) {
      httpClient.setAuthToken(this.accessToken);
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<DataResponse<LoginResponse>> {
    try {
      const response = await this.makeRequest<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data) {
        // 保存token到内存和localStorage（兼容大小写字段名）
        this.accessToken = response.data.AccessToken || response.data.accessToken;
        this.refreshToken = response.data.RefreshToken || response.data.refreshToken;
        
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.User || response.data.user));
        
        // 设置HTTP客户端的认证头
        httpClient.setAuthToken(this.accessToken);
        
        return {
          success: true,
          data: response.data,
          message: '登录成功'
        };
      }

      return {
        success: false,
        error: response.error || '登录失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `登录请求失败: ${error}`
      };
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<DataResponse<boolean>> {
    try {
      if (this.refreshToken && this.accessToken) {
        // 调用后端logout API使token失效
        await this.makeRequest('/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
    } finally {
      // 无论后端调用是否成功，都清理本地数据
      this.clearTokens();
      
      // 清理HTTP客户端的认证头
      httpClient.clearAuthToken();
      
      return {
        success: true,
        data: true,
        message: '登出成功'
      };
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<DataResponse<string>> {
    if (!this.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available'
      };
    }

    try {
      const response = await this.makeRequest<{ accessToken: string; expiresIn: number }>('/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success && response.data) {
        this.accessToken = response.data.accessToken;
        localStorage.setItem('accessToken', this.accessToken);
        
        // 更新HTTP客户端的认证头
        httpClient.setAuthToken(this.accessToken);
        
        return {
          success: true,
          data: this.accessToken,
          message: 'Token刷新成功'
        };
      }

      // 刷新失败，清理token
      this.clearTokens();
      return {
        success: false,
        error: response.error || 'Token刷新失败'
      };
    } catch (error) {
      this.clearTokens();
      return {
        success: false,
        error: `Token刷新请求失败: ${error}`
      };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<DataResponse<boolean>> {
    try {
      const response = await this.makeAuthenticatedRequest<boolean>('/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `修改密码失败: ${error}`
      };
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<DataResponse<UserInfo>> {
    try {
      const response = await this.makeAuthenticatedRequest<UserInfo>('/me');
      return response;
    } catch (error) {
      return {
        success: false,
        error: `获取用户信息失败: ${error}`
      };
    }
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * 获取当前访问令牌
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * 清理所有token
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * 发送带认证头的请求
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<DataResponse<T>> {
    if (!this.accessToken) {
      return {
        success: false,
        error: 'No access token available'
      };
    }

    const response = await this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // 如果token过期，尝试刷新
    if (!response.success && response.error?.includes('401')) {
      const refreshResult = await this.refreshAccessToken();
      if (refreshResult.success) {
        // 重试原请求
        return this.makeRequest<T>(endpoint, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    }

    return response;
  }

  /**
   * 发送HTTP请求的基础方法
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<DataResponse<T>> {
    try {
      // 使用httpClient而不是直接fetch，确保正确的baseURL
      const response = await httpClient.post(endpoint, options.body ? JSON.parse(options.body as string) : undefined);

      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message
        };
      } else {
        return {
          success: false,
          error: response.error || '请求失败'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `网络请求失败: ${error}`
      };
    }
  }
}

// 导出单例实例
export const authService = new AuthService();
export default authService;