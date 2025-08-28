import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, CardBody } from '../components/ui';
import { ErrorHandler } from '../utils/errorHandler';

const LoginPage: React.FC = () => {
  const [employeeId, setEmployeeId] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, login, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 登录后始终跳转到战情中心（根路径）
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // 清理错误状态
  useEffect(() => {
    clearError();
  }, [clearError]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId.trim() || !password.trim()) {
      setError('工号和密码不能为空');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const result = await login({ employeeId: employeeId.trim(), password });
      
      if (!result.success) {
        setError(result.error || '登录失败');
      }
      // 成功的情况下，useEffect会自动处理跳转
    } catch (err) {
      setError('登录过程中发生错误');
      ErrorHandler.handleAsyncError(err, 'LoginPage.handleLogin', { employeeId });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardBody className="p-8">
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <img src="/SAA.png" alt="SAA Logo" className="h-20 mx-auto mb-4 border-2 border-blue-100 rounded-md p-1" />
            <h1 className="text-2xl font-bold text-gray-800">机型编码管理系统</h1>
            <p className="text-gray-600 mt-2">请登录以继续</p>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <div className="flex items-center">
                <span className="i-carbon-warning text-lg mr-2"></span>
                {error}
              </div>
            </div>
          )}
          
          {/* 登录表单 */}
          <form onSubmit={handleSubmit}>
            <Input
              label="工号"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="请输入工号"
              icon={<span className="i-carbon-user"></span>}
            />
            
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              icon={<span className="i-carbon-password"></span>}
            />
            
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              className="w-full"
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          
          {/* 默认账号提示 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md text-center text-sm text-blue-700">
            <div className="font-medium mb-1">测试账号</div>
            <div>工号：admin | 密码：admin123</div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage; 