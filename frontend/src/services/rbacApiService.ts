// rbacApiService.ts - 真实后端API的RBAC服务
import { apiService } from './apiService';
import type { UserDto, RoleDto, PermissionDto, OrganizationDto, PagedResult } from './apiService';
import type { DataResponse } from '../types/api';

// 兼容现有接口的类型定义
export interface User {
  id: string; // 🔧 修复：改为字符串以兼容现有代码
  employeeId: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string; // 🔧 修复：使用lastLogin而非lastLoginAt，保持与AuthContext一致
  organization?: string;
  phone?: string;
  position?: string;
  status?: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  userCount: number;
  permissionCount: number;
  permissions: Permission[];  // 改为Permission对象数组而非字符串数组
  isSystem?: boolean;  // 系统内置角色标志
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  type: string;
  resource?: string;
  action?: string;
  parentId?: number;
  path: string;
  level: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  parentName?: string;
  children?: Permission[];
  category: string; // 兼容现有代码，从type映射而来
}

export interface Department {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId?: number;
  level: number;
  path: string;
  sortOrder: number;
  isActive: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 表单接口
export interface CreateUserRequest {
  employeeId: string;
  userName: string;
  email?: string;
  password: string;
  organizationId?: number;
  position?: string;
  phone?: string;
  joinDate?: string;
}

export interface UpdateUserRequest {
  userName?: string;
  email?: string;
  organizationId?: number;
  position?: string;
  phone?: string;
  joinDate?: string;
  isActive?: boolean;
}

export interface CreateRoleRequest {
  code: string;
  name: string;
}

export interface UpdateRoleRequest {
  code?: string;
  name?: string;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  type: string;
  resource?: string;
  action?: string;
  parentId?: number;
}

export interface UpdatePermissionRequest {
  code: string;
  name: string;
  type: string;
  resource?: string;
  action?: string;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  type: string;
  parentId?: number;
  sortOrder?: number;
}

export interface UpdateDepartmentRequest {
  code?: string;
  name?: string;
  type?: string;
  parentId?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// DTO转换函数
function convertUserDto(dto: UserDto | any): User {
  // 🔧 修复：处理后端 PascalCase 和 camelCase 字段名
  const roleValue = dto.Role || dto.role || 'USER';
  
  return {
    id: (dto.Id || dto.id || 0).toString(),
    employeeId: dto.EmployeeId || dto.employeeId || '',
    name: dto.UserName || dto.userName || '',
    role: roleValue,
    department: dto.Department || dto.department || '',
    email: dto.Email || dto.email || '',
    isActive: dto.IsActive !== undefined ? dto.IsActive : (dto.isActive !== undefined ? dto.isActive : true),
    createdAt: dto.CreatedAt || dto.createdAt || new Date().toISOString(),
    updatedAt: dto.UpdatedAt || dto.updatedAt || '',
    lastLogin: dto.LastLoginAt || dto.lastLoginAt || '',
    organization: dto.OrganizationName || dto.organizationName || '',
    phone: dto.Phone || dto.phone || '',
    position: dto.Position || dto.position || '',
    status: dto.Status || dto.status || 'Active'
  };
}

function convertRoleDto(dto: RoleDto | any): Role {
  
  // 支持PascalCase和camelCase字段
  const converted = {
    id: dto.id || dto.Id,
    code: dto.code || dto.Code || '',
    name: dto.name || dto.Name || '',
    createdAt: dto.createdAt || dto.CreatedAt || '',
    updatedAt: dto.updatedAt || dto.UpdatedAt || '',
    createdBy: dto.createdBy || dto.CreatedBy || '',
    updatedBy: dto.updatedBy || dto.UpdatedBy || '',
    userCount: dto.userCount || dto.UserCount || 0,
    permissionCount: dto.permissionCount || dto.PermissionCount || 0,
    permissions: dto.permissions || dto.Permissions || [],
    isSystem: dto.code === 'SuperAdmin' || dto.code === 'Admin' || dto.Code === 'SuperAdmin' || dto.Code === 'Admin'
  };
  
  return converted;
}

function convertPermissionDto(dto: PermissionDto | any): Permission {
  
  // 支持PascalCase和camelCase字段
  const converted = {
    id: dto.id || dto.Id || 0,
    code: dto.code || dto.Code || '',
    name: dto.name || dto.Name || '',
    type: dto.type || dto.Type || '',
    resource: dto.resource || dto.Resource || '',
    action: dto.action || dto.Action || '',
    parentId: dto.parentId || dto.ParentId || undefined,
    path: dto.path || dto.Path || '',
    level: dto.level || dto.Level || 0,
    createdAt: dto.createdAt || dto.CreatedAt || '',
    updatedAt: dto.updatedAt || dto.UpdatedAt || '',
    createdBy: dto.createdBy || dto.CreatedBy || '',
    updatedBy: dto.updatedBy || dto.UpdatedBy || '',
    parentName: dto.parentName || dto.ParentName || '',
    children: dto.children?.map(convertPermissionDto) || dto.Children?.map(convertPermissionDto),
    category: dto.category || dto.Category || dto.type || dto.Type || '',
    description: dto.description || dto.Description || ''
  };
  
  return converted;
}

function convertOrganizationDto(dto: OrganizationDto | any): Department {
  // 🔧 修复：处理后端 PascalCase 和 camelCase 字段名
  return {
    id: dto.Id || dto.id || 0,
    code: dto.Code || dto.code || '',
    name: dto.Name || dto.name || '',
    type: dto.Type || dto.type || '',
    parentId: dto.ParentId || dto.parentId || undefined,
    level: dto.Level || dto.level || 0,
    path: dto.Path || dto.path || '',
    sortOrder: dto.SortOrder || dto.sortOrder || 0,
    isActive: dto.IsActive !== undefined ? dto.IsActive : (dto.isActive !== undefined ? dto.isActive : true),
    userCount: dto.UserCount || dto.userCount || 0,
    createdAt: dto.CreatedAt || dto.createdAt || '',
    updatedAt: dto.UpdatedAt || dto.updatedAt || ''
  };
}

/**
 * 真实后端API的RBAC服务
 */
export class RbacApiService {
  
  // ===== 用户管理 =====
  
  async getUsers(params?: {
    keyword?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<DataResponse<{ users: User[]; total: number }>> {
    try {
      const apiParams = {
        keyword: params?.keyword,
        role: params?.role,
        isActive: params?.isActive,
        pageIndex: params?.page ? params.page - 1 : 0,
        pageSize: params?.pageSize || 20
      };

      const response = await apiService.getUsers(apiParams);
      
      if (response.success && response.data) {
        // 🔧 修复：处理后端 PascalCase 字段名
        const items = response.data.Items || response.data.items;
        const totalCount = response.data.TotalCount || response.data.totalCount || 0;
        
        // 检查响应数据结构
        if (!items || !Array.isArray(items)) {
          console.error('❌ [rbacApiService] API响应数据格式错误，缺少items数组:', response.data);
          return {
            success: false,
            error: 'API响应数据格式错误'
          };
        }
        
        const users = items.map(convertUserDto);
        
        return {
          success: true,
          data: {
            users,
            total: totalCount
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取用户列表失败'
      };
    } catch (error) {
      console.error('💥 [rbacApiService] getUsers发生异常:', error);
      return {
        success: false,
        error: `获取用户列表失败: ${error}`
      };
    }
  }

  async createUser(data: CreateUserRequest): Promise<DataResponse<User>> {
    try {
      const response = await apiService.createUser(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertUserDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '创建用户失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `创建用户失败: ${error}`
      };
    }
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<DataResponse<User>> {
    try {
      const response = await apiService.updateUser(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertUserDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '更新用户失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `更新用户失败: ${error}`
      };
    }
  }

  async deleteUser(id: number): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.deleteUser(id);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `删除用户失败: ${error}`
      };
    }
  }

  async resetPassword(id: number): Promise<DataResponse<string>> {
    try {
      const response = await apiService.resetUserPassword(id, ''); // 后端会自动生成密码
      
      return {
        success: response.success,
        data: response.data as string,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `重置密码失败: ${error}`
      };
    }
  }

  // ===== 角色管理 =====
  
  async getRoles(params?: {
    keyword?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<DataResponse<{ roles: Role[]; total: number }>> {
    try {
      const apiParams = {
        keyword: params?.keyword,
        isActive: params?.isActive,
        pageIndex: params?.page ? params.page - 1 : 0,
        pageSize: params?.pageSize || 20
      };

      const response = await apiService.getRoles(apiParams);
      
      if (response.success && response.data) {
        // 🔧 修复：处理后端 PascalCase 字段名
        const items = response.data.Items || response.data.items;
        const totalCount = response.data.TotalCount || response.data.totalCount || 0;
        
        // 检查响应数据结构
        if (!items || !Array.isArray(items)) {
          console.error('❌ [rbacApiService] 角色API响应数据格式错误，缺少items数组:', response.data);
          return {
            success: false,
            error: '角色API响应数据格式错误'
          };
        }
        
        const roles = items.map(convertRoleDto);
        return {
          success: true,
          data: {
            roles,
            total: totalCount
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取角色列表失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `获取角色列表失败: ${error}`
      };
    }
  }

  async createRole(data: CreateRoleRequest): Promise<DataResponse<Role>> {
    try {
      const response = await apiService.createRole(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertRoleDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '创建角色失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `创建角色失败: ${error}`
      };
    }
  }

  async updateRole(id: number, data: UpdateRoleRequest): Promise<DataResponse<Role>> {
    try {
      const response = await apiService.updateRole(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertRoleDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '更新角色失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `更新角色失败: ${error}`
      };
    }
  }

  async deleteRole(id: number): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.deleteRole(id);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `删除角色失败: ${error}`
      };
    }
  }

  // ===== 权限管理 =====
  
  async getPermissions(params?: {
    keyword?: string;
    type?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<DataResponse<{ permissions: Permission[]; total: number }>> {
    try {
      const apiParams = {
        keyword: params?.keyword,
        type: params?.type,
        isActive: params?.isActive,
        pageIndex: params?.page ? params.page - 1 : 0,
        pageSize: params?.pageSize || 20
      };

      const response = await apiService.getPermissions(apiParams);
      
      if (response.success && response.data) {
        // 🔧 修复：处理后端 PascalCase 字段名
        const items = response.data.Items || response.data.items;
        const totalCount = response.data.TotalCount || response.data.totalCount || 0;
        
        // 检查响应数据结构
        if (!items || !Array.isArray(items)) {
          console.error('❌ [rbacApiService] 权限API响应数据格式错误，缺少items数组:', response.data);
          return {
            success: false,
            error: '权限API响应数据格式错误'
          };
        }
        
        const permissions = items.map(convertPermissionDto);
        return {
          success: true,
          data: {
            permissions,
            total: totalCount
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取权限列表失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `获取权限列表失败: ${error}`
      };
    }
  }

  async createPermission(data: CreatePermissionRequest): Promise<DataResponse<Permission>> {
    try {
      const response = await apiService.createPermission(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertPermissionDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '创建权限失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `创建权限失败: ${error}`
      };
    }
  }

  async updatePermission(id: number, data: UpdatePermissionRequest): Promise<DataResponse<Permission>> {
    try {
      const response = await apiService.updatePermission(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertPermissionDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '更新权限失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `更新权限失败: ${error}`
      };
    }
  }

  async deletePermission(id: number): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.deletePermission(id);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `删除权限失败: ${error}`
      };
    }
  }

  // ===== 部门管理 =====
  
  async getDepartments(params?: {
    keyword?: string;
    type?: string;
    parentId?: number;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<DataResponse<{ departments: Department[]; total: number }>> {
    try {
      const apiParams = {
        keyword: params?.keyword,
        type: params?.type,
        parentId: params?.parentId,
        isActive: params?.isActive,
        pageIndex: params?.page ? params.page - 1 : 0,
        pageSize: params?.pageSize || 20
      };

      const response = await apiService.getOrganizations(apiParams);
      
      if (response.success && response.data) {
        // 🔧 修复：处理后端 PascalCase 字段名
        const items = response.data.Items || response.data.items;
        const totalCount = response.data.TotalCount || response.data.totalCount || 0;
        
        // 检查响应数据结构
        if (!items || !Array.isArray(items)) {
          console.error('❌ [rbacApiService] 部门API响应数据格式错误，缺少items数组:', response.data);
          return {
            success: false,
            error: '部门API响应数据格式错误'
          };
        }
        
        const departments = items.map(convertOrganizationDto);
        
        return {
          success: true,
          data: {
            departments,
            total: totalCount
          },
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取部门列表失败'
      };
    } catch (error) {
      console.error('💥 [rbacApiService] getDepartments发生异常:', error);
      return {
        success: false,
        error: `获取部门列表失败: ${error}`
      };
    }
  }

  async getDepartmentTree(): Promise<DataResponse<Department[]>> {
    try {
      const response = await apiService.getOrganizationTree();
      
      if (response.success && response.data) {
        const departments = response.data.map(convertOrganizationDto);
        return {
          success: true,
          data: departments,
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取部门树失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `获取部门树失败: ${error}`
      };
    }
  }

  async createDepartment(data: CreateDepartmentRequest): Promise<DataResponse<Department>> {
    try {
      const response = await apiService.createOrganization(data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertOrganizationDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '创建部门失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `创建部门失败: ${error}`
      };
    }
  }

  async updateDepartment(id: number, data: UpdateDepartmentRequest): Promise<DataResponse<Department>> {
    try {
      const response = await apiService.updateOrganization(id, data);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: convertOrganizationDto(response.data),
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '更新部门失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `更新部门失败: ${error}`
      };
    }
  }

  async deleteDepartment(id: number): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.deleteOrganization(id);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `删除部门失败: ${error}`
      };
    }
  }

  // ===== 用户角色关联 =====
  
  async assignUserRoles(userId: number, roleIds: number[]): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.assignUserRoles(userId, roleIds);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `分配用户角色失败: ${error}`
      };
    }
  }

  async getUserRoles(userId: number): Promise<DataResponse<Role[]>> {
    try {
      const response = await apiService.getUserRoles(userId);
      
      if (response.success && response.data) {
        const roles = response.data.map(convertRoleDto);
        return {
          success: true,
          data: roles,
          message: response.message
        };
      }
      
      return {
        success: false,
        error: response.error || '获取用户角色失败'
      };
    } catch (error) {
      return {
        success: false,
        error: `获取用户角色失败: ${error}`
      };
    }
  }

  // ===== 角色权限关联 =====
  
  async assignRolePermissions(roleId: number, permissionIds: number[]): Promise<DataResponse<boolean>> {
    try {
      const response = await apiService.assignRolePermissions(roleId, permissionIds);
      
      return {
        success: response.success,
        data: response.success,
        message: response.message,
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: `分配角色权限失败: ${error}`
      };
    }
  }

  async getRolePermissions(roleId: number): Promise<DataResponse<Permission[]>> {
    try {
      const response = await apiService.getRolePermissions(roleId);
      
      if (response.success && response.data) {
        const permissions = response.data.map(convertPermissionDto);
        return {
          success: true,
          data: permissions,
          message: response.message
        };
      }
      
      console.error('❌ [rbacApiService] getRolePermissions API失败:', response.error);
      return {
        success: false,
        error: response.error || '获取角色权限失败'
      };
    } catch (error) {
      console.error('❌ [rbacApiService] getRolePermissions异常:', error);
      return {
        success: false,
        error: `获取角色权限失败: ${error}`
      };
    }
  }
}

// 导出单例实例
export const rbacApiService = new RbacApiService();
export default rbacApiService;

// 为了向后兼容，同时导出为rbacService
export const rbacService = rbacApiService;