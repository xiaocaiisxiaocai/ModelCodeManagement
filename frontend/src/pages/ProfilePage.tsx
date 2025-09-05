// ProfilePage.tsx - 个人资料管理页面
import React, { useState, useEffect } from 'react';
import ModernLayout from '../components/ModernLayout';
import {
  Button, Card, CardBody, Input, Select
} from '../components/ui';
import { useToastContext } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { services } from '../services';
import type { Organization, UserUpdate, ChangePasswordRequest } from '../types/domain';
import { formatOrganizationOptions } from '../utils/organizationUtils';

interface ProfileForm {
  userName: string;
  email: string;
  organizationId?: number;
  position: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser, changePassword, logout } = useAuth();
  const { addToast } = useToastContext();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // 个人信息表单
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    userName: '',
    email: '',
    organizationId: undefined,
    position: '',
    phone: ''
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // 页面状态
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    if (user) {
      setProfileForm({
        userName: user.userName || '',
        email: user.email || '',
        organizationId: user.organizationId,
        position: user.position || '',
        phone: user.phone || ''
      });
    }
    loadOrganizations();
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const response = await services.userManagement.getOrganizations();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to load organizations');
      }
      
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  // 验证个人信息表单
  const validateProfileForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!profileForm.userName.trim()) {
      errors.userName = '用户名不能为空';
    }

    if (!profileForm.email.trim()) {
      errors.email = '邮箱不能为空';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = '邮箱格式不正确';
    }

    if (profileForm.phone && !/^1[3-9]\d{9}$/.test(profileForm.phone)) {
      errors.phone = '手机号格式不正确';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 验证密码表单
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = '当前密码不能为空';
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = '新密码不能为空';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = '新密码至少需要6个字符';
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = '确认密码不能为空';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 更新个人信息
  const handleUpdateProfile = async () => {
    if (!user || !validateProfileForm()) return;

    setLoading(true);
    try {
      const response = await services.userManagement.update(user.id, {
        name: profileForm.userName,
        email: profileForm.email,
        organizationId: profileForm.organizationId?.toString(),
        position: profileForm.position,
        phoneNumber: profileForm.phone
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }
      
      // 刷新用户信息
      await refreshUser();
      
      addToast({
        type: 'success',
        title: '更新成功',
        message: '个人信息更新成功'
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      addToast({
        type: 'error',
        title: '更新失败',
        message: '个人信息更新失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!user || !validatePasswordForm()) return;

    setLoading(true);
    try {
      const response = await changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to change password');
      }
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      
      addToast({
        type: 'success',
        title: '修改成功',
        message: '密码修改成功，请重新登录'
      });
      
      // 修改密码成功后，建议用户重新登录
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error) {
      console.error('Failed to change password:', error);
      addToast({
        type: 'error',
        title: '修改失败',
        message: error instanceof Error ? error.message : '密码修改失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ModernLayout title="个人资料" subtitle="管理个人账户信息">
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-gray-500">用户信息未加载</p>
          </CardBody>
        </Card>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout title="个人资料" subtitle="管理个人账户信息和安全设置">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标签页导航 */}
        <Card>
          <CardBody className="p-0">
            <div className="flex border-b">
              <button
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <span className="i-carbon-user mr-2"></span>基本信息
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === 'password'
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('password')}
              >
                <span className="i-carbon-password mr-2"></span>修改密码
              </button>
            </div>
          </CardBody>
        </Card>

        {/* 基本信息表单 */}
        {activeTab === 'profile' && (
          <Card>
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold mb-6">基本信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="用户名 *"
                    value={profileForm.userName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, userName: e.target.value }))}
                    error={profileErrors.userName}
                    placeholder="请输入用户名"
                    size="sm"
                  />
                </div>
                
                <div>
                  <Input
                    label="邮箱地址 *"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    error={profileErrors.email}
                    placeholder="请输入邮箱地址"
                    size="sm"
                  />
                </div>
                
                <div>
                  <Select
                    label="所属部门"
                    value={profileForm.organizationId?.toString() || ''}
                    onChange={(value) => setProfileForm(prev => ({ 
                      ...prev, 
                      organizationId: value ? parseInt(value) : undefined 
                    }))}
                    options={formatOrganizationOptions(organizations, 'id')}
                    size="sm"
                  />
                </div>
                
                <div>
                  <Input
                    label="职位"
                    value={profileForm.position}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="请输入职位"
                    size="sm"
                  />
                </div>
                
                <div>
                  <Input
                    label="手机号"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    error={profileErrors.phone}
                    placeholder="请输入手机号"
                    size="sm"
                  />
                </div>
              </div>
              
              {/* 只读信息 */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">账户信息（只读）</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">员工ID</label>
                    <div className="mt-1 text-sm text-gray-900">{user.employeeId}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">当前角色</label>
                    <div className="mt-1 text-sm text-gray-900">{user.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">最后登录</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '未知'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleUpdateProfile}
                  loading={loading}
                  size="sm"
                >
                  保存更改
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 修改密码表单 */}
        {activeTab === 'password' && (
          <Card>
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold mb-6">修改密码</h2>
              
              <div className="max-w-md space-y-6">
                <Input
                  label="当前密码 *"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  error={passwordErrors.currentPassword}
                  placeholder="请输入当前密码"
                  size="sm"
                />
                
                <Input
                  label="新密码 *"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  error={passwordErrors.newPassword}
                  placeholder="请输入新密码（至少6个字符）"
                  size="sm"
                />
                
                <Input
                  label="确认新密码 *"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  error={passwordErrors.confirmPassword}
                  placeholder="请再次输入新密码"
                  size="sm"
                />
              </div>
              
              <div className="mt-8">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="i-carbon-warning text-amber-400"></span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800">
                        密码修改提醒
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>新密码至少需要6个字符</li>
                          <li>建议使用字母、数字和特殊字符的组合</li>
                          <li>修改密码后需要重新登录</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="warning"
                    onClick={handleChangePassword}
                    loading={loading}
                    size="sm"
                  >
                    修改密码
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
};

export default ProfilePage;