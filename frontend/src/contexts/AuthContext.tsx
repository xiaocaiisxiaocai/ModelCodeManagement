// AuthContext.tsx - 认证上下文
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { User, DataResponse } from '../mock/interfaces';
import type { LoginRequest, ChangePasswordRequest } from '../services/authService';
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
  login: (credentials: LoginRequest) => Promise<DataResponse<any>>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<DataResponse<boolean>>;
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
        if (authService.isAuthenticated()) {
          // 有token，验证是否有效并获取用户信息
          const userResult = await authService.getCurrentUser();
          
          if (userResult.success && userResult.data) {
            // 🔧 修复：将后端返回的UserInfo转换为前端User格式
            const backendUser = userResult.data;
            const user: User = {
              id: backendUser.Id ? backendUser.Id.toString() : (backendUser.id ? backendUser.id.toString() : ''),
              employeeId: backendUser.EmployeeId || backendUser.employeeId || '',
              name: backendUser.UserName || backendUser.userName || '',
              role: (backendUser.Role || backendUser.role) as any,
              department: backendUser.Department || backendUser.department || '',
              password: '', // 不在前端存储密码
              email: backendUser.Email || backendUser.email || '',
              createdAt: backendUser.CreatedAt || backendUser.createdAt || new Date().toISOString(),
              lastLogin: backendUser.LastLoginAt || backendUser.lastLoginAt || new Date().toISOString()
            };
            
            // 从localStorage恢复权限信息
            const storedUser = localStorage.getItem('user');
            let permissions: string[] = [];
            
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              permissions = userData.permissions || [];
            }
            
            // 同时从当前token重新解析权限（以防token更新）
            const currentToken = localStorage.getItem('accessToken');
            if (currentToken) {
              const tokenPermissions = parseJWTPermissions(currentToken);
              
              if (tokenPermissions.length > 0) {
                permissions = tokenPermissions;
                // 更新localStorage中的权限信息
                const userWithPermissions = {
                  ...user,
                  permissions
                };
                localStorage.setItem('user', JSON.stringify(userWithPermissions));
              }
            }
            
            
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user,
                permissions
              }
            });
          } else {
            // token无效，清理状态
            console.warn('🔐 [AuthContext] Token验证失败，清理认证状态');
            await authService.logout();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          // 没有token，设置为未登录
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        // 清理可能的无效token
        await authService.logout();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.data) {
        // 兼容后端大小写字段名
        const backendUser = result.data.User || result.data.user;
        const user: User = {
          id: backendUser?.Id ? backendUser.Id.toString() : (backendUser?.id ? backendUser.id.toString() : ''),
          employeeId: backendUser?.EmployeeId || backendUser?.employeeId || '',
          name: backendUser?.UserName || backendUser?.userName || '', // 后端字段是UserName
          role: (backendUser?.Role || backendUser?.role) as any,
          department: backendUser?.Department || backendUser?.department || '',
          password: '', // 不在前端存储密码
          email: backendUser?.Email || backendUser?.email || '',
          createdAt: backendUser?.CreatedAt || backendUser?.createdAt || new Date().toISOString(),
          lastLogin: backendUser?.LastLoginAt || backendUser?.lastLoginAt || new Date().toISOString()
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

        return result;
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: result.error || '登录失败'
        });
        return result;
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
      await authService.logout();
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'AuthContext.logout');
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  const changePassword = useCallback(async (passwordData: ChangePasswordRequest) => {
    try {
      const result = await authService.changePassword(passwordData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `修改密码失败: ${error}`
      };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const userResult = await authService.getCurrentUser();
      if (userResult.success && userResult.data) {
        const storedUser = localStorage.getItem('user');
        const permissions = storedUser ? JSON.parse(storedUser).permissions || [] : [];
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: userResult.data,
            permissions
          }
        });
      }
    } catch (error) {
      ErrorHandler.handleAsyncError(error, 'AuthContext.refreshUser');
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