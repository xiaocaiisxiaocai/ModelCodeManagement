// DebugAuth.tsx - 临时调试认证状态页面
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, permissions, hasRole, hasPermission } = useAuth();
  
  const testRoles = ['admin', 'superadmin', 'user', 'ADMIN', 'SUPER_ADMIN', 'USER', 'super_admin', 'SUPER_ADMIN'];
  const testPermissions = ['USER_MANAGE', 'ROLE_MANAGE', 'ORG_MANAGE'];
  
  return (
    <div className="p-6 bg-white">
      <h1 className="text-2xl font-bold mb-4">认证状态调试</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">基础状态</h2>
          <p>已认证: {isAuthenticated ? '是' : '否'}</p>
          <p>权限数量: {permissions.length}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">用户信息</h2>
          {user ? (
            <pre className="bg-gray-100 p-3 rounded text-sm">
              {JSON.stringify(user, null, 2)}
            </pre>
          ) : (
            <p>无用户信息</p>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">权限列表</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">角色检查</h2>
          {testRoles.map(role => {
            const result = hasRole(role);
            // 直接在这里调用规范化逻辑进行测试
            const normalizeRole = (r: string) => r.toLowerCase().replace(/_/g, '');
            const userRoleNorm = user?.role ? normalizeRole(user.role) : 'N/A';
            const checkRoleNorm = normalizeRole(role);
            
            return (
              <div key={role} className="flex items-start gap-2 mb-2">
                <span className="w-20 flex-shrink-0">{role}:</span>
                <div className="flex-1">
                  <span className={result ? 'text-green-600' : 'text-red-600'}>
                    {result ? '✓' : '✗'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    用户角色规范化: "{userRoleNorm}" | 检查角色规范化: "{checkRoleNorm}" | 匹配: {userRoleNorm === checkRoleNorm ? 'TRUE' : 'FALSE'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">权限检查</h2>
          {testPermissions.map(permission => (
            <div key={permission} className="flex items-center gap-2">
              <span className="w-32">{permission}:</span>
              <span className={hasPermission(permission) ? 'text-green-600' : 'text-red-600'}>
                {hasPermission(permission) ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">LocalStorage 数据</h2>
          <h3 className="text-md font-semibold mt-2">Access Token:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-20 overflow-y-auto">
            {localStorage.getItem('accessToken') || '无'}
          </pre>
          
          <h3 className="text-md font-semibold mt-2">User Data:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-20 overflow-y-auto">
            {localStorage.getItem('user') || '无'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;