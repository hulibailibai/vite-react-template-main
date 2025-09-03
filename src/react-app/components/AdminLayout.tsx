import React, { useState, createContext, useContext } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Button } from './ui/Button';
import { Menu } from 'lucide-react';

// 侧边栏状态Context
interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// 使用侧边栏Context的Hook
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within AdminLayout');
  }
  return context;
};

// 管理后台布局组件接口
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// 管理后台布局组件
export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title, 
  description 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const sidebarContextValue: SidebarContextType = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* 侧边栏 - AdminSidebar组件内部已处理桌面端和移动端的显示逻辑 */}
        <AdminSidebar 
          isCollapsed={isDesktopSidebarCollapsed}
          onToggleCollapse={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
        />
        
        {/* 主内容区 */}
        <main className={`h-screen overflow-y-auto bg-white dark:bg-gray-900 transition-all duration-300 ${
          isDesktopSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>
          <div className="p-6 lg:p-8 min-h-full">
            {/* 移动端菜单按钮 */}
            <div className="lg:hidden mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
            {/* 页面标题 */}
            {(title || description) && (
              <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {description}
                  </p>
                )}
              </div>
            )}
            
            {/* 页面内容 */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>

        {/* 移动端侧边栏遮罩 */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
            onClick={closeSidebar}
          />
        )}
      </div>
    </SidebarContext.Provider>
  );
};

export default AdminLayout;