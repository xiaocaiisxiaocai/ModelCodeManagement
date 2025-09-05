// AuthContext.tsx - 认证上下文
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api/client';
import type { User } from '../types/domain';
// 简化的类型定义
interface LoginRequest {
  employeeId: string;
  password: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
import { ErrorHandler } from '../utils/errorHandler';

// JWT Token解析工具函数
const parseJWTPermissions = (token: string): string[] => {
  try {
    if (!token) return [];
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const permissions = payload.permission || [];
    
    return Array.isArray(permissions) ? permissions : [permissions];
  } catch (error) {
    ErrorHandler.handleAsyncError(error, 'AuthContext.parseJWTPermissions', { token: token ? 'exists' : 'null' });
    return [];
  }
};

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<{success: boolean, data?: any, error?: string}>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<{success: boolean, data?: boolean, error?: string}>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasMenuPermission: (menuCode: string) => boolean;
  hasRole: (role: string) => boolean;
}

type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; permissions: string[] } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // 初始化时检查token状态
  error: null,
  permissions: []
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查是否已登录
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 检查是否有访问令牌
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          // 从localStorage恢复用户状态
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                  user: userData,
                  permissions: userData.permissions || []
                }
              });
            } catch (e) {
              console.warn('解析存储的用户信息失败:', e);
              apiClient.clearAccessToken();
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          } else {
            // 没有用户信息，清理状态
            apiClient.clearAccessToken();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // 没有token，设置为未登录
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        // 清理可能的无效token
        apiClient.clearAccessToken();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const result = await apiClient.login(credentials.employeeId, credentials.password);
      
      if (result.success && result.data) {
        // 根据后端UserDto字段创建User对象
        const backendUser = result.data.User || result.data.user;
        const user: User = {
          id: backendUser.Id?.toString() || backendUser.id?.toString(),
          employeeId: backendUser.EmployeeId || backendUser.employeeId,
          userName: backendUser.UserName || backendUser.userName,
          name: backendUser.UserName || backendUser.userName, // 显示名称等于用户名
          email: backendUser.Email || backendUser.email,
          department: backendUser.Department || backendUser.department,
          position: backendUser.Position || backendUser.position,
          phone: backendUser.Phone || backendUser.phone,
          status: backendUser.Status || backendUser.status,
          isActive: backendUser.IsActive ?? backendUser.isActive ?? true,
          organizationId: backendUser.OrganizationId || backendUser.organizationId,
          role: backendUser.Role || backendUser.role,
          joinDate: backendUser.JoinDate || backendUser.joinDate,
          lastLoginAt: backendUser.LastLoginAt || backendUser.lastLoginAt,
          createdAt: backendUser.CreatedAt || backendUser.createdAt,
          updatedAt: backendUser.UpdatedAt || backendUser.updatedAt,
          // 创建前端显示辅助信息
          displayInfo: {
            fullName: backendUser.UserName || backendUser.userName,
            avatar: (backendUser.UserName || backendUser.userName)?.charAt(0).toUpperCase() || 'U',
            contactInfo: [backendUser.Email || backendUser.email, backendUser.Phone || backendUser.phone].filter(Boolean).join(' | ')
          }
        };

        // 从JWT Token中解析权限信息  
        const token = result.data.AccessToken || result.data.accessToken;
        const permissions = parseJWTPermissions(token);

        // 保存权限信息到localStorage，以便页面刷新后恢复
        const userWithPermissions = {
          ...user,
          permissions
        };
        localStorage.setItem('user', JSON.stringify(userWithPermissions));

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            permissions
          }
        });

        return { success: true, data: user };
      } else {
        const errorMessage = result.error || '登录失败';
        dispatch({
          type: 'AUTH_FAILURE',
          payload: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = `登录过程中发生错误: ${error}`;
      ErrorHandler.handleAsyncError(error, 'AuthContext.login', { employeeId: credentials.employeeId });
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      });
      return {
        success: false,
        error: errorMessage
      };
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // 清除API客户端的token
      apiClient.clearAccessToken();
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'AuthContext.logout');
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const changePassword = useCallback(async (passwordData: ChangePasswordRequest) => {
    try {
      // TODO: 实现密码修改
      const result = { success: false, error: '功能暂未实现' };
      return result;
    } catch (error) {
      return {
        success: false,
        error: `修改密码失败: ${error}`
      };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) {
      return;
    }

    try {
      // 从localStorage恢复状态
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: userData,
              permissions: userData.permissions || []
            }
          });
        } catch (e) {
          console.warn('解析用户信息失败:', e);
          apiClient.clearAccessToken();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'AuthContext.refreshUser');
      apiClient.clearAccessToken();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // 权限检查方法
  const hasPermission = useCallback((permission: string): boolean => {
    return state.permissions.includes(permission);
  }, [state.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => state.permissions.includes(permission));
  }, [state.permissions]);

  // 检查菜单权限的方法
  const hasMenuPermission = useCallback((menuCode: string): boolean => {
    return state.permissions.includes(menuCode);
  }, [state.permissions]);

  const hasRole = useCallback((role: string): boolean => {
    
    if (!state.user?.role) {
      return false;
    }
    
    // 角色名称规范化：统一转换为小写并移除下划线
    const normalizeRole = (r: string) => r.toLowerCase().replace(/_/g, '');
    const userRoleNormalized = normalizeRole(state.user.role);
    const checkRoleNormalized = normalizeRole(role);
    
    
    // 直接角色匹配
    if (userRoleNormalized === checkRoleNormalized) {
      return true;
    }
    
    // 🔧 修复：SUPER_ADMIN 自动包含 ADMIN 权限
    if (userRoleNormalized === 'superadmin' && checkRoleNormalized === 'admin') {
      return true;
    }
    
    // 🔧 修复：ADMIN 自动包含 USER 权限
    if ((userRoleNormalized === 'admin' || userRoleNormalized === 'superadmin') && checkRoleNormalized === 'user') {
      return true;
    }
    
    return false;
  }, [state.user?.role]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    changePassword,
    refreshUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasMenuPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;