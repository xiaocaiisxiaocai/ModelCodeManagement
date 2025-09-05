import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from './auth/PermissionGate';

interface ModernLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children, title, subtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const toggleUserMenu = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  };

  // 统一处理菜单项点击
  const handleMenuItemClick = async (action: 'profile' | 'logout') => {
    setUserMenuOpen(false);

    if (action === 'profile') {
      navigate('/profile');
    } else if (action === 'logout') {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        // 实际应用中可能需要一个Toast提示
      }
    }
  };
  
  // 判断当前路由激活状态
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="modern-layout h-screen flex bg-gray-100 overflow-hidden">
      {/* 侧边栏 - 响应式优化，支持多种屏幕尺寸 */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 transform bg-blue-600 text-gray-100 
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-0 lg:w-48 xl:w-56
          overflow-y-auto overflow-x-hidden scrollbar-thin
        `}
      >
        <div className="p-3 border-b border-blue-700 min-w-0">
          <div className="flex items-center justify-center flex-col">
            <img src="/SAA.png" alt="SAA Logo" className="h-10 mb-2 bg-white p-1 rounded-md flex-shrink-0" />
            <div className="text-sm lg:text-lg font-bold text-white text-center leading-tight">机型编码<br/>管理系统</div>
          </div>
        </div>
        
        <nav className="mt-5 min-w-0">
          <div className="px-4 py-2 text-xs text-gray-200 uppercase tracking-wider">导航菜单</div>
          <Link
            to="/"
            className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${
              isActive('/') && !isActive('/coding') && !isActive('/data-dictionary') && !isActive('/admin') 
                ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'
            }`}
          >
            <span className="i-carbon-chart-radar text-base mr-3 flex-shrink-0"></span>
            <span className="text-sm truncate">战情中心</span>
          </Link>
          <Link
            to="/coding"
            className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${
              isActive('/coding') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'
            }`}
          >
            <span className="i-carbon-code text-base mr-3 flex-shrink-0"></span>
            <span className="text-sm truncate">编码管理</span>
          </Link>
          <Link
            to="/data-dictionary"
            className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${
              isActive('/data-dictionary') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'
            }`}
          >
            <span className="i-carbon-data-base text-base mr-3 flex-shrink-0"></span>
            <span className="text-sm truncate">数据字典</span>
          </Link>
          
          {/* 管理员菜单 - 基于RBAC权限控制 */}
          <PermissionGate permissions={['USER_MANAGE', 'ROLE_MANAGE', 'ORG_MANAGE', 'AUDIT_LOG_VIEW']} requireAny={true}>
            <div className="px-4 py-2 mt-4 text-xs text-gray-200 uppercase tracking-wider">系统管理</div>
            
            <PermissionGate permissions={['USER_MANAGE']}>
              <Link
                to="/admin/users"
                className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${
                  isActive('/admin/users') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'
                }`}
              >
                <span className="i-carbon-user-multiple text-base mr-3 flex-shrink-0"></span>
                <span className="text-sm truncate">用户管理</span>
              </Link>
            </PermissionGate>
            
            <PermissionGate permissions={['ORG_MANAGE']}>
              <Link
                to="/admin/departments"
                className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${
                  isActive('/admin/departments') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'
                }`}
              >
                <span className="i-carbon-enterprise text-base mr-3 flex-shrink-0"></span>
                <span className="text-sm truncate">组织架构</span>
              </Link>
            </PermissionGate>
            
            <PermissionGate permissions={['ROLE_MANAGE']}>
              <Link
                to="/admin/roles"
                className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${isActive('/admin/roles') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'}`}
              >
                <span className="i-carbon-user-role text-base mr-3 flex-shrink-0"></span>
                <span className="text-sm truncate">角色管理</span>
              </Link>
              <Link
                to="/admin/permissions"
                className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${isActive('/admin/permissions') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'}`}
              >
                <span className="i-carbon-security text-base mr-3 flex-shrink-0"></span>
                <span className="text-sm truncate">权限管理</span>
              </Link>
            </PermissionGate>
            
            <PermissionGate permissions={['AUDIT_LOG_VIEW']}>
              <Link
                to="/admin/audit-logs"
                className={`flex items-center py-2.5 px-4 transition-colors min-w-0 ${isActive('/admin/audit-logs') ? 'bg-blue-700 text-white' : 'hover:bg-blue-700 hover:text-white text-gray-200'}`}
              >
                <span className="i-carbon-document-audit text-base mr-3 flex-shrink-0"></span>
                <span className="text-sm truncate">审计日志</span>
              </Link>
            </PermissionGate>
          </PermissionGate>
        </nav>
      </aside>
      
      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm z-10 flex-shrink-0">
          <div className="px-3 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center lg:hidden">
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none rounded-md hover:bg-gray-100 transition-colors"
              >
                <span className="i-carbon-menu text-xl"></span>
              </button>
            </div>
            
            <div className="flex-1 mx-2 lg:mx-4">
              <div className="text-lg lg:text-xl font-bold truncate">{title}</div>
              {subtitle && <div className="text-xs lg:text-sm text-gray-500 truncate">{subtitle}</div>}
            </div>
            
            <div className="flex items-center space-x-1 lg:space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors">
                <span className="i-carbon-notification text-lg lg:text-xl"></span>
              </button>
              <div className="relative ml-3" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="p-2 text-gray-600 hover:text-gray-800 flex items-center focus:outline-none rounded-md hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <span className="i-carbon-user-avatar text-lg lg:text-xl"></span>
                  <span className="hidden lg:block ml-2 text-sm">{user?.name}</span>
                  <span className="i-carbon-chevron-down ml-1 text-sm"></span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.employeeId}</div>
                      <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                    </div>
                    <div
                      onClick={() => handleMenuItemClick('profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMenuItemClick('profile');
                        }
                      }}
                    >
                      <span className="i-carbon-user mr-2"></span>
                      <span>个人资料</span>
                    </div>
                    <div
                      onClick={() => handleMenuItemClick('logout')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleMenuItemClick('logout');
                        }
                      }}
                    >
                      <span className="i-carbon-logout mr-2"></span>
                      <span>退出登录</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 面包屑导航 */}
          <div className="px-3 lg:px-6 py-2 border-t border-gray-200 overflow-hidden">
            <div className="flex items-center text-xs lg:text-sm overflow-x-auto scrollbar-none">
              <Link to="/" className="text-blue-500 hover:text-blue-700 flex items-center whitespace-nowrap">
                <span>战情中心</span>
              </Link>
              
              {location.pathname.includes('/model-classification') && (
                <>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link to="/coding" className="text-blue-500 hover:text-blue-700 whitespace-nowrap">编码管理</Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">机型分类</span>
                </>
              )}
              
              {location.pathname.includes('/code-classification') && (
                <>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link to="/coding" className="text-blue-500 hover:text-blue-700 whitespace-nowrap">编码管理</Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link 
                    to={`/coding/model-classification/${location.pathname.split('/')[3]}`}
                    className="text-blue-500 hover:text-blue-700 whitespace-nowrap"
                  >
                    机型分类
                  </Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">代码分类</span>
                </>
              )}
              
              {/* 标准3层结构的代码使用页面 */}
              {location.pathname.includes('/code-usage') && !location.pathname.includes('/direct-code-usage') && (
                <>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link to="/coding" className="text-blue-500 hover:text-blue-700 whitespace-nowrap">编码管理</Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link 
                    to={`/coding/model-classification/${location.pathname.split('/')[3]}`}
                    className="text-blue-500 hover:text-blue-700 whitespace-nowrap"
                  >
                    机型分类
                  </Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link 
                    to={`/coding/code-classification/${location.pathname.split('/')[3]}/${location.pathname.split('/')[4]}`}
                    className="text-blue-500 hover:text-blue-700 whitespace-nowrap"
                  >
                    代码分类
                  </Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">使用清单</span>
                </>
              )}
              
              {/* 直接访问2层结构的代码使用页面 */}
              {location.pathname.includes('/direct-code-usage') && (
                <>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link to="/coding" className="text-blue-500 hover:text-blue-700 whitespace-nowrap">编码管理</Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <Link 
                    to={`/coding/model-classification/${location.pathname.split('/')[3]}`}
                    className="text-blue-500 hover:text-blue-700 whitespace-nowrap"
                  >
                    机型分类
                  </Link>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">代码使用</span>
                </>
              )}
              
              {/* 数据字典页面 */}
              {location.pathname.includes('/data-dictionary') && (
                <>
                  <span className="mx-2 text-gray-400 flex-shrink-0">›</span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">数据字典</span>
                </>
              )}
            </div>
          </div>
        </header>
        
        {/* 页面内容 */}
        <div className={`flex-1 min-h-0 overflow-hidden ${title === '战情中心' ? 'p-1' : 'p-3 lg:p-6'}`}>
          <div className="h-full overflow-auto">{children}</div>
        </div>
      </main>
      
      {/* 侧边栏遮罩层 - 仅在移动端且侧边栏打开时显示 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* 用户菜单遮罩层 - 移除，因为外部点击处理已足够 */}
      {/*
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
      */}
    </div>
  );
};

export default ModernLayout; 