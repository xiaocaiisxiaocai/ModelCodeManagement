// authServiceMock.ts - 开发阶段的Mock认证服务
import type { User, DataResponse } from '../mock/interfaces';
import type { LoginRequest, LoginResponse, ChangePasswordRequest } from './authService';
import { mockData } from '../mock/mockData';

/**
 * Mock身份认证服务 - 用于开发阶段，模拟后端JWT API
 */
export class AuthServiceMock {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // 从localStorage恢复token
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * 用户登录 (Mock版本)
   */
  async login(credentials: LoginRequest): Promise<DataResponse<LoginResponse>> {
    try {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user = mockData.users.find(
        u => u.employeeId === credentials.employeeId && u.password === credentials.password
      );
      
      if (user) {
        // 生成Mock token
        const accessToken = `mock_access_token_${Date.now()}`;
        const refreshToken = `mock_refresh_token_${Date.now()}`;
        
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Mock用户权限
        const permissions = this.getUserPermissions(user.role);
        
        const userInfo = {
          employeeId: user.employeeId,
          name: user.name,
          role: user.role,
          department: user.department,
          permissions
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        const loginResponse: LoginResponse = {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: userInfo
        };

        return {
          success: true,
          data: loginResponse,
          message: '登录成功'
        };
      }
      
      return {
        success: false,
        error: '工号或密码错误'
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
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.clearTokens();
      return {
        success: true,
        data: true,
        message: '登出成功'
      };
    } catch (error) {
      this.clearTokens();
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
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 生成新的access token
      const newAccessToken = `mock_access_token_${Date.now()}`;
      this.accessToken = newAccessToken;
      localStorage.setItem('accessToken', newAccessToken);
      
      return {
        success: true,
        data: newAccessToken,
        message: 'Token刷新成功'
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
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在实际应用中，这里会调用真实的API
      // Mock版本暂时总是返回成功
      return {
        success: true,
        data: true,
        message: '密码修改成功'
      };
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
  async getCurrentUser(): Promise<DataResponse<User>> {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: 'No access token available'
        };
      }

      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userInfo = JSON.parse(storedUser);
        const user = mockData.users.find(u => u.employeeId === userInfo.employeeId);
        
        if (user) {
          return {
            success: true,
            data: user,
            message: '获取用户信息成功'
          };
        }
      }
      
      return {
        success: false,
        error: '用户不存在'
      };
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
   * 根据角色获取权限列表
   */
  private getUserPermissions(role: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'superadmin': [
        'user:read', 'user:create', 'user:update', 'user:delete',
        'role:read', 'role:create', 'role:update', 'role:delete',
        'permission:read', 'permission:create', 'permission:update', 'permission:delete',
        'product:read', 'product:create', 'product:update', 'product:delete',
        'model:read', 'model:create', 'model:update', 'model:delete',
        'code:read', 'code:create', 'code:update', 'code:delete',
        'warroom:read', 'data:export', 'system:config'
      ],
      'admin': [
        'user:read', 'user:update',
        'role:read',
        'permission:read',
        'product:read', 'product:create', 'product:update', 'product:delete',
        'model:read', 'model:create', 'model:update', 'model:delete',
        'code:read', 'code:create', 'code:update', 'code:delete',
        'warroom:read', 'data:export'
      ],
      'user': [
        'product:read',
        'model:read',
        'code:read', 'code:create', 'code:update',
        'warroom:read'
      ]
    };

    return permissionMap[role] || permissionMap['user'];
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
}

// 导出单例实例
export const authServiceMock = new AuthServiceMock();
export default authServiceMock;