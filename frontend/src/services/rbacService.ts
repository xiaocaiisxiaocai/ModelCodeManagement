// rbacService.ts - RBAC (Role-Based Access Control) 服务
import type { User, UserRole, DataResponse } from '../mock/interfaces';
import { mockData } from '../mock/mockData';
import { httpClient } from './httpClient';

// 角色接口定义
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 权限接口定义
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

// 用户创建表单
export interface CreateUserRequest {
  employeeId: string;
  name: string;
  role: UserRole;
  department?: string;
  email?: string;
  password: string;
}

// 用户更新表单
export interface UpdateUserRequest {
  name: string;
  role: UserRole;
  department?: string;
  email?: string;
}

// 角色创建/更新表单
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

// 密码重置请求
export interface ResetPasswordRequest {
  userId: string;
  newPassword?: string; // 如果不提供，则生成默认密码
}

// 部门接口定义
export interface Department {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  createdAt: string;
  updatedAt?: string;
  userCount: number;
  children?: Department[];
}

// 部门创建请求
export interface CreateDepartmentRequest {
  name: string;
  parentId?: string;
}

// 部门更新请求
export interface UpdateDepartmentRequest {
  name: string;
  parentId?: string;
}

// 权限创建请求
export interface CreatePermissionRequest {
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

// 权限更新请求
export interface UpdatePermissionRequest {
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

/**
 * RBAC管理服务
 */
export class RBACService {
  private baseURL = '/api/v1';
  private useMockData = true; // 开发环境下使用mock数据

  // Mock角色数据
  private mockRoles: Role[] = [
    {
      id: 'role_1',
      name: 'superadmin',
      description: '超级管理员',
      permissions: ['*'], // 所有权限
      userCount: mockData.users.filter(u => u.role === 'superadmin').length,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'role_2', 
      name: 'admin',
      description: '管理员',
      permissions: ['user:read', 'user:update', 'product:*', 'model:*', 'code:*', 'warroom:read'],
      userCount: mockData.users.filter(u => u.role === 'admin').length,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'role_3',
      name: 'user', 
      description: '普通用户',
      permissions: ['product:read', 'model:read', 'code:read', 'code:create', 'code:update', 'warroom:read'],
      userCount: mockData.users.filter(u => u.role === 'user').length,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];

  // Mock权限数据
  private mockPermissions: Permission[] = [
    // 用户管理权限
    { id: 'user:read', name: '查看用户', description: '查看用户列表和详情', category: '用户管理', resource: 'user', action: 'read' },
    { id: 'user:create', name: '创建用户', description: '创建新用户账号', category: '用户管理', resource: 'user', action: 'create' },
    { id: 'user:update', name: '编辑用户', description: '编辑用户信息', category: '用户管理', resource: 'user', action: 'update' },
    { id: 'user:delete', name: '删除用户', description: '删除用户账号', category: '用户管理', resource: 'user', action: 'delete' },
    
    // 角色管理权限
    { id: 'role:read', name: '查看角色', description: '查看角色列表和详情', category: '角色管理', resource: 'role', action: 'read' },
    { id: 'role:create', name: '创建角色', description: '创建新角色', category: '角色管理', resource: 'role', action: 'create' },
    { id: 'role:update', name: '编辑角色', description: '编辑角色信息和权限', category: '角色管理', resource: 'role', action: 'update' },
    { id: 'role:delete', name: '删除角色', description: '删除角色', category: '角色管理', resource: 'role', action: 'delete' },
    
    // 产品管理权限
    { id: 'product:read', name: '查看产品', description: '查看产品类型列表', category: '产品管理', resource: 'product', action: 'read' },
    { id: 'product:create', name: '创建产品', description: '创建新产品类型', category: '产品管理', resource: 'product', action: 'create' },
    { id: 'product:update', name: '编辑产品', description: '编辑产品类型信息', category: '产品管理', resource: 'product', action: 'update' },
    { id: 'product:delete', name: '删除产品', description: '删除产品类型', category: '产品管理', resource: 'product', action: 'delete' },
    
    // 机型管理权限
    { id: 'model:read', name: '查看机型', description: '查看机型分类列表', category: '机型管理', resource: 'model', action: 'read' },
    { id: 'model:create', name: '创建机型', description: '创建新机型分类', category: '机型管理', resource: 'model', action: 'create' },
    { id: 'model:update', name: '编辑机型', description: '编辑机型分类信息', category: '机型管理', resource: 'model', action: 'update' },
    { id: 'model:delete', name: '删除机型', description: '删除机型分类', category: '机型管理', resource: 'model', action: 'delete' },
    
    // 代码管理权限
    { id: 'code:read', name: '查看代码', description: '查看代码分类和使用清单', category: '代码管理', resource: 'code', action: 'read' },
    { id: 'code:create', name: '创建代码', description: '创建新代码分类和使用记录', category: '代码管理', resource: 'code', action: 'create' },
    { id: 'code:update', name: '编辑代码', description: '编辑代码分类和使用记录', category: '代码管理', resource: 'code', action: 'update' },
    { id: 'code:delete', name: '删除代码', description: '删除代码分类和使用记录', category: '代码管理', resource: 'code', action: 'delete' },
    
    // 战情中心权限
    { id: 'warroom:read', name: '查看战情中心', description: '查看战情中心数据和统计', category: '数据查看', resource: 'warroom', action: 'read' },
    
    // 数据导出权限
    { id: 'data:export', name: '数据导出', description: '导出系统数据', category: '数据管理', resource: 'data', action: 'export' },
    
    // 系统配置权限
    { id: 'system:config', name: '系统配置', description: '修改系统配置参数', category: '系统管理', resource: 'system', action: 'config' }
  ];

  // Mock部门数据
  private mockDepartments: Department[] = [
    // 一级部门
    {
      id: 'dept_1',
      name: '杭州总公司',
      level: 1,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 0
    },
    {
      id: 'dept_2',
      name: '郑州分公司',
      level: 1,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 1
    },
    {
      id: 'dept_3',
      name: '深圳分公司',
      level: 1,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 2
    },

    // 郑州分公司下的二级部门
    {
      id: 'dept_4',
      name: '研发部门',
      parentId: 'dept_2',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 1
    },
    {
      id: 'dept_5',
      name: '市场部门',
      parentId: 'dept_2',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 2
    },
    {
      id: 'dept_6',
      name: '测试部门',
      parentId: 'dept_2',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 3
    },
    {
      id: 'dept_7',
      name: '财务部门',
      parentId: 'dept_2',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 4
    },
    {
      id: 'dept_8',
      name: '运维部门',
      parentId: 'dept_2',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 5
    },

    // 深圳分公司下的二级部门
    {
      id: 'dept_9',
      name: '市场部门',
      parentId: 'dept_3',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 1
    },
    {
      id: 'dept_10',
      name: '财务部门',
      parentId: 'dept_3',
      level: 2,
      createdAt: '2024-01-01T00:00:00Z',
      userCount: 2
    }
  ];

  /**
   * ======================
   * 用户管理 API
   * ======================
   */

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<DataResponse<User[]>> {
    if (this.useMockData) {
      // 返回mock数据
      await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
      return {
        success: true,
        data: mockData.users,
        message: `成功获取 ${mockData.users.length} 个用户`
      };
    }

    try {
      const response = await httpClient.get<User[]>('/v1/users');
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return {
        success: false,
        error: `获取用户列表失败: ${error}`
      };
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(userId: string): Promise<DataResponse<User>> {
    try {
      const response = await httpClient.get<User>(`/v1/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return {
        success: false,
        error: `获取用户信息失败: ${error}`
      };
    }
  }

  /**
   * 创建用户
   */
  async createUser(userData: CreateUserRequest): Promise<DataResponse<User>> {
    try {
      const response = await httpClient.post<User>('/v1/users', userData);
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      return {
        success: false,
        error: `创建用户失败: ${error}`
      };
    }
  }

  /**
   * 更新用户
   */
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<DataResponse<User>> {
    try {
      const response = await httpClient.put<User>(`/v1/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('Failed to update user:', error);
      return {
        success: false,
        error: `更新用户失败: ${error}`
      };
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(userId: string): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.delete<boolean>(`/v1/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return {
        success: false,
        error: `删除用户失败: ${error}`
      };
    }
  }

  /**
   * 重置用户密码
   */
  async resetUserPassword(userId: string, newPassword?: string): Promise<DataResponse<string>> {
    try {
      const requestData: ResetPasswordRequest = { userId };
      if (newPassword) {
        requestData.newPassword = newPassword;
      }

      const response = await httpClient.post<string>(`/v1/users/${userId}/reset-password`, requestData);
      return response;
    } catch (error) {
      console.error('Failed to reset password:', error);
      return {
        success: false,
        error: `重置密码失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 角色管理 API
   * ======================
   */

  /**
   * 获取所有角色
   */
  async getAllRoles(): Promise<DataResponse<Role[]>> {
    if (this.useMockData) {
      // 返回mock数据
      await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
      // 重新计算用户数量以确保数据一致性
      const rolesWithUpdatedCounts = this.mockRoles.map(role => ({
        ...role,
        userCount: mockData.users.filter(u => u.role === role.name).length
      }));
      return {
        success: true,
        data: rolesWithUpdatedCounts,
        message: `成功获取 ${rolesWithUpdatedCounts.length} 个角色`
      };
    }

    try {
      const response = await httpClient.get<Role[]>('/v1/roles');
      return response;
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      return {
        success: false,
        error: `获取角色列表失败: ${error}`
      };
    }
  }

  /**
   * 根据ID获取角色
   */
  async getRoleById(roleId: string): Promise<DataResponse<Role>> {
    try {
      const response = await httpClient.get<Role>(`/v1/roles/${roleId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch role:', error);
      return {
        success: false,
        error: `获取角色信息失败: ${error}`
      };
    }
  }

  /**
   * 创建角色
   */
  async createRole(roleData: CreateRoleRequest): Promise<DataResponse<Role>> {
    try {
      const response = await httpClient.post<Role>('/v1/roles', roleData);
      return response;
    } catch (error) {
      console.error('Failed to create role:', error);
      return {
        success: false,
        error: `创建角色失败: ${error}`
      };
    }
  }

  /**
   * 更新角色
   */
  async updateRole(roleId: string, roleData: CreateRoleRequest): Promise<DataResponse<Role>> {
    try {
      const response = await httpClient.put<Role>(`/v1/roles/${roleId}`, roleData);
      return response;
    } catch (error) {
      console.error('Failed to update role:', error);
      return {
        success: false,
        error: `更新角色失败: ${error}`
      };
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(roleId: string): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.delete<boolean>(`/v1/roles/${roleId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete role:', error);
      return {
        success: false,
        error: `删除角色失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 权限管理 API
   * ======================
   */

  /**
   * 获取所有权限
   */
  async getAllPermissions(): Promise<DataResponse<Permission[]>> {
    if (this.useMockData) {
      // 返回mock数据
      await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
      return {
        success: true,
        data: this.mockPermissions,
        message: `成功获取 ${this.mockPermissions.length} 个权限`
      };
    }

    try {
      const response = await httpClient.get<Permission[]>('/v1/permissions');
      return response;
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      return {
        success: false,
        error: `获取权限列表失败: ${error}`
      };
    }
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<DataResponse<string[]>> {
    try {
      const response = await httpClient.get<string[]>(`/v1/users/${userId}/permissions`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return {
        success: false,
        error: `获取用户权限失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 用户角色分配 API
   * ======================
   */

  /**
   * 为用户分配角色
   */
  async assignUserRole(userId: string, roleId: string): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.post<boolean>(`/v1/users/${userId}/roles`, { roleId });
      return response;
    } catch (error) {
      console.error('Failed to assign role:', error);
      return {
        success: false,
        error: `分配角色失败: ${error}`
      };
    }
  }

  /**
   * 移除用户角色
   */
  async removeUserRole(userId: string, roleId: string): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.delete<boolean>(`/v1/users/${userId}/roles/${roleId}`);
      return response;
    } catch (error) {
      console.error('Failed to remove role:', error);
      return {
        success: false,
        error: `移除角色失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 批量操作 API
   * ======================
   */

  /**
   * 批量删除用户
   */
  async bulkDeleteUsers(userIds: string[]): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.post<boolean>('/v1/users/bulk-delete', { userIds });
      return response;
    } catch (error) {
      console.error('Failed to bulk delete users:', error);
      return {
        success: false,
        error: `批量删除用户失败: ${error}`
      };
    }
  }

  /**
   * 批量更新用户角色
   */
  async bulkUpdateUserRoles(userIds: string[], roleId: string): Promise<DataResponse<boolean>> {
    try {
      const response = await httpClient.post<boolean>('/v1/users/bulk-update-roles', { userIds, roleId });
      return response;
    } catch (error) {
      console.error('Failed to bulk update roles:', error);
      return {
        success: false,
        error: `批量更新角色失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 工具方法
   * ======================
   */


  /**
   * 验证权限
   */
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // 超级管理员拥有所有权限
    if (userPermissions.includes('*')) {
      return true;
    }
    
    // 检查具体权限
    return userPermissions.includes(requiredPermission);
  }

  /**
   * 验证角色
   */
  hasRole(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * 获取角色对应的权限等级
   */
  getRoleLevel(role: UserRole): number {
    switch (role) {
      case 'superadmin': return 3;
      case 'admin': return 2;
      case 'user': return 1;
      default: return 0;
    }
  }

  /**
   * 检查是否可以管理目标用户
   */
  canManageUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
    return this.getRoleLevel(currentUserRole) > this.getRoleLevel(targetUserRole);
  }

  /**
   * ======================
   * 权限管理 API
   * ======================
   */

  /**
   * 创建权限
   */
  async createPermission(permissionData: CreatePermissionRequest): Promise<DataResponse<Permission>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newPermission: Permission = {
        id: `perm_${Date.now()}`,
        ...permissionData
      };
      this.mockPermissions.push(newPermission);
      return {
        success: true,
        data: newPermission,
        message: '权限创建成功'
      };
    }

    try {
      const response = await httpClient.post<Permission>('/v1/permissions', permissionData);
      return response;
    } catch (error) {
      console.error('Failed to create permission:', error);
      return {
        success: false,
        error: `创建权限失败: ${error}`
      };
    }
  }

  /**
   * 更新权限
   */
  async updatePermission(permissionId: string, permissionData: UpdatePermissionRequest): Promise<DataResponse<Permission>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = this.mockPermissions.findIndex(p => p.id === permissionId);
      if (index === -1) {
        return {
          success: false,
          error: '权限不存在'
        };
      }
      
      this.mockPermissions[index] = {
        ...this.mockPermissions[index],
        ...permissionData
      };
      
      return {
        success: true,
        data: this.mockPermissions[index],
        message: '权限更新成功'
      };
    }

    try {
      const response = await httpClient.put<Permission>(`/v1/permissions/${permissionId}`, permissionData);
      return response;
    } catch (error) {
      console.error('Failed to update permission:', error);
      return {
        success: false,
        error: `更新权限失败: ${error}`
      };
    }
  }

  /**
   * 删除权限
   */
  async deletePermission(permissionId: string): Promise<DataResponse<boolean>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = this.mockPermissions.findIndex(p => p.id === permissionId);
      if (index === -1) {
        return {
          success: false,
          error: '权限不存在'
        };
      }
      
      this.mockPermissions.splice(index, 1);
      return {
        success: true,
        data: true,
        message: '权限删除成功'
      };
    }

    try {
      const response = await httpClient.delete<boolean>(`/v1/permissions/${permissionId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete permission:', error);
      return {
        success: false,
        error: `删除权限失败: ${error}`
      };
    }
  }

  /**
   * ======================
   * 部门管理 API
   * ======================
   */

  /**
   * 获取所有部门
   */
  async getAllDepartments(): Promise<DataResponse<Department[]>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // 重新计算用户数量以确保数据一致性
      const departmentsWithUpdatedCounts = this.mockDepartments.map(dept => ({
        ...dept,
        userCount: mockData.users.filter(u => u.department === dept.name).length
      }));
      return {
        success: true,
        data: departmentsWithUpdatedCounts,
        message: `成功获取 ${departmentsWithUpdatedCounts.length} 个部门`
      };
    }

    try {
      const response = await httpClient.get<Department[]>('/v1/departments');
      return response;
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      return {
        success: false,
        error: `获取部门列表失败: ${error}`
      };
    }
  }

  /**
   * 创建部门
   */
  async createDepartment(departmentData: CreateDepartmentRequest): Promise<DataResponse<Department>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 计算层级
      let level = 1;
      if (departmentData.parentId) {
        const parentDept = this.mockDepartments.find(d => d.id === departmentData.parentId);
        level = parentDept ? parentDept.level + 1 : 1;
      }
      
      const newDepartment: Department = {
        id: `dept_${Date.now()}`,
        ...departmentData,
        level,
        isActive: true,
        userCount: 0,
        createdAt: new Date().toISOString()
      };
      this.mockDepartments.push(newDepartment);
      return {
        success: true,
        data: newDepartment,
        message: '部门创建成功'
      };
    }

    try {
      const response = await httpClient.post<Department>('/v1/departments', departmentData);
      return response;
    } catch (error) {
      console.error('Failed to create department:', error);
      return {
        success: false,
        error: `创建部门失败: ${error}`
      };
    }
  }

  /**
   * 更新部门
   */
  async updateDepartment(departmentId: string, departmentData: UpdateDepartmentRequest): Promise<DataResponse<Department>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = this.mockDepartments.findIndex(d => d.id === departmentId);
      if (index === -1) {
        return {
          success: false,
          error: '部门不存在'
        };
      }
      
      this.mockDepartments[index] = {
        ...this.mockDepartments[index],
        ...departmentData,
        level: departmentData.parentId ? 2 : 1,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: this.mockDepartments[index],
        message: '部门更新成功'
      };
    }

    try {
      const response = await httpClient.put<Department>(`/v1/departments/${departmentId}`, departmentData);
      return response;
    } catch (error) {
      console.error('Failed to update department:', error);
      return {
        success: false,
        error: `更新部门失败: ${error}`
      };
    }
  }

  /**
   * 删除部门
   */
  async deleteDepartment(departmentId: string): Promise<DataResponse<boolean>> {
    if (this.useMockData) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const index = this.mockDepartments.findIndex(d => d.id === departmentId);
      if (index === -1) {
        return {
          success: false,
          error: '部门不存在'
        };
      }
      
      // 检查部门下是否有用户
      const department = this.mockDepartments[index];
      const userCount = mockData.users.filter(u => u.department === department.name).length;
      if (userCount > 0) {
        return {
          success: false,
          error: '该部门下还有用户，请先移除所有用户后再删除'
        };
      }
      
      this.mockDepartments.splice(index, 1);
      return {
        success: true,
        data: true,
        message: '部门删除成功'
      };
    }

    try {
      const response = await httpClient.delete<boolean>(`/v1/departments/${departmentId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete department:', error);
      return {
        success: false,
        error: `删除部门失败: ${error}`
      };
    }
  }
}

// 导出单例实例
export const rbacService = new RBACService();
export default rbacService;