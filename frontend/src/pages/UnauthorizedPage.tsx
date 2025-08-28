// UnauthorizedPage.tsx - 未授权访问页面
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1); // 返回上一页
  };

  const handleGoHome = () => {
    navigate('/'); // 返回首页
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardBody className="p-8 text-center">
          {/* 权限图标 */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <span className="i-carbon-locked text-4xl text-red-600"></span>
            </div>
          </div>

          {/* 标题和说明 */}
          <h1 className="text-2xl font-bold text-gray-800 mb-4">访问被拒绝</h1>
          <p className="text-gray-600 mb-6">
            抱歉，您没有权限访问此页面。
            {user && (
              <span className="block mt-2 text-sm">
                当前用户：{user.name} ({user.role})
              </span>
            )}
          </p>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <Button
              onClick={handleGoHome}
              variant="primary"
              className="w-full"
            >
              <span className="i-carbon-home mr-2"></span>
              返回首页
            </Button>
            
            <Button
              onClick={handleGoBack}
              variant="secondary"
              className="w-full"
            >
              <span className="i-carbon-arrow-left mr-2"></span>
              返回上一页
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              <span className="i-carbon-logout mr-2"></span>
              切换账号
            </Button>
          </div>

          {/* 联系管理员提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-blue-700">
            <div className="font-medium mb-1">需要访问权限？</div>
            <div>请联系系统管理员申请相应权限</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default UnauthorizedPage;