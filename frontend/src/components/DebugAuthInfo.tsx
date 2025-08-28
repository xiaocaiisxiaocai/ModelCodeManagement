// DebugAuthInfo.tsx - 调试认证信息组件
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DebugAuthInfoProps {
  visible?: boolean;
}

export const DebugAuthInfo: React.FC<DebugAuthInfoProps> = ({ visible = true }) => {
  const { user, isAuthenticated, isLoading, permissions } = useAuth();

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-[9999] text-xs">
      <h3 className="font-bold text-sm mb-2">🔍 调试信息</h3>
      <div className="space-y-1">
        <div>
          <strong>认证状态:</strong> {isAuthenticated ? '✅ 已认证' : '❌ 未认证'}
        </div>
        <div>
          <strong>加载状态:</strong> {isLoading ? '⏳ 加载中' : '✅ 完成'}
        </div>
        <div>
          <strong>用户信息:</strong> {user ? `${user.name} (${user.role})` : '无'}
        </div>
        <div>
          <strong>权限列表:</strong>
          {permissions.length > 0 ? (
            <ul className="mt-1">
              {permissions.map((perm, index) => (
                <li key={index} className="text-xs text-gray-600">• {perm}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500"> 无权限</span>
          )}
        </div>
        <div className="mt-2 pt-2 border-t">
          <strong>localStorage:</strong>
          <div className="text-xs text-gray-600 mt-1">
            accessToken: {localStorage.getItem('accessToken') ? '✅' : '❌'}
            <br />
            user: {localStorage.getItem('user') ? '✅' : '❌'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugAuthInfo;