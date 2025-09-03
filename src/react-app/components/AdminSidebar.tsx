import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useSidebar } from './AdminLayout';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/api';
import { Button } from './ui/Button';
import {
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  Activity,
  Shield,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  Bell,
  Database,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Crown,
  Gift,
  CheckSquare,
  ListTodo,
  Clock,
  Server
} from 'lucide-react';

// 侧边栏导航链接接口
interface AdminSidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  children?: AdminSidebarLink[];
}

// 管理后台侧边栏组件接口
interface AdminSidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// 管理后台侧边栏组件
export const AdminSidebar: React.FC<AdminSidebarProps> = ({ className, isCollapsed = false, onToggleCollapse }) => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { user } = useAuth();
  const currentPath = window.location.pathname;
  
  // 子菜单展开状态管理
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  
  // 统计数据状态
  const [stats, setStats] = useState({
    pendingWorkflows: 0,
    totalWorkflows: 0,
    totalUsers: 0,
    pendingCreatorApplications: 0,
    pendingAiApps: 0
  });
  
  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await adminApi.getDashboardStats();
        setStats({
          pendingWorkflows: dashboardStats.pendingWorkflows || 0,
          totalWorkflows: dashboardStats.totalWorkflows || 0,
          totalUsers: dashboardStats.totalUsers || 0,
          pendingCreatorApplications: dashboardStats.pendingCreatorApplications || 0,
          pendingAiApps: dashboardStats.pendingAIApps || 0
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  // 切换子菜单展开状态
  const toggleSubmenu = (menuKey: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey);
    } else {
      newExpanded.add(menuKey);
    }
    setExpandedMenus(newExpanded);
  };

  // 管理后台侧边栏导航链接
  const sidebarLinks: AdminSidebarLink[] = [
    {
      label: '仪表盘',
      href: '/admin',
      icon: <Home className="w-5 h-5" />,
      active: currentPath === '/admin'
    },
    {
      label: '用户管理',
      href: '#',
      icon: <Users className="w-5 h-5" />,
      active: false,
      badge: stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : undefined,
      children: [
        {
          label: '用户列表',
          href: '/admin/users',
          icon: <Users className="w-4 h-4" />,
          active: currentPath === '/admin/users'
        },
        {
          label: '会员管理',
          href: '/admin/users/members',
          icon: <Crown className="w-4 h-4" />,
          active: currentPath === '/admin/users/members',
          badge: '89'
        },
        {
          label: '用户权限',
          href: '/admin/users/permissions',
          icon: <Shield className="w-4 h-4" />,
          active: currentPath === '/admin/users/permissions'
        },
        {
          label: '封禁管理',
          href: '/admin/users/banned',
          icon: <AlertTriangle className="w-4 h-4" />,
          active: currentPath === '/admin/users/banned',
          badge: '3'
        }
      ]
    },
    {
      label: '扣子工作流管理',
      href: '#',
      icon: <FileText className="w-5 h-5" />,
      active: false,
      badge: stats.totalWorkflows > 0 ? stats.totalWorkflows.toLocaleString() : undefined,
      children: [
        {
          label: '扣子工作流列表',
          href: '/admin/coze-workflows',
          icon: <FileText className="w-4 h-4" />,
          active: currentPath === '/admin/coze-workflows'
        },
        {
          label: '待审核',
          href: '/admin/coze-workflows/pending',
          icon: <AlertTriangle className="w-4 h-4" />,
          active: currentPath === '/admin/coze-workflows/pending',
          badge: stats.pendingWorkflows > 0 ? stats.pendingWorkflows.toString() : undefined
        },
        {
          label: '已发布',
          href: '/admin/coze-workflows/published',
          icon: <FileText className="w-4 h-4" />,
          active: currentPath === '/admin/coze-workflows/published'
        },
        {
          label: '已下架',
          href: '/admin/coze-workflows/archived',
          icon: <FileText className="w-4 h-4" />,
          active: currentPath === '/admin/coze-workflows/archived'
        }
      ]
    },
    {
      label: '创作者管理',
      href: '#',
      icon: <Crown className="w-5 h-5" />,
      active: false,
      badge: undefined, // 暂时移除，等待创作者总数统计
      children: [
        {
          label: '创作者列表',
          href: '/admin/creators',
          icon: <Users className="w-4 h-4" />,
          active: currentPath === '/admin/creators'
        },
        {
          label: '申请审核',
          href: '/admin/creators/applications',
          icon: <AlertTriangle className="w-4 h-4" />,
          active: currentPath === '/admin/creators/applications',
          badge: stats.pendingCreatorApplications > 0 ? stats.pendingCreatorApplications.toString() : undefined
        },
        {
          label: '收益管理',
          href: '/admin/creators/earnings',
          icon: <DollarSign className="w-4 h-4" />,
          active: currentPath === '/admin/creators/earnings'
        },
        {
          label: '等级管理',
          href: '/admin/creators/levels',
          icon: <Crown className="w-4 h-4" />,
          active: currentPath === '/admin/creators/levels'
        }
      ]
    },
    {
      label: '任务发放',
      href: '#',
      icon: <ListTodo className="w-5 h-5" />,
      active: false,
      badge: undefined, // 可以后续添加待审核任务数量统计
      children: [
        {
          label: '任务列表',
          href: '/admin/tasks',
          icon: <ListTodo className="w-4 h-4" />,
          active: currentPath === '/admin/tasks'
        },
        {
          label: '创建任务',
          href: '/admin/tasks/create',
          icon: <CheckSquare className="w-4 h-4" />,
          active: currentPath === '/admin/tasks/create'
        },
        {
          label: '待审核提交',
          href: '/admin/tasks/submissions',
          icon: <Clock className="w-4 h-4" />,
          active: currentPath === '/admin/tasks/submissions',
          badge: undefined // 可以后续添加待审核提交数量
        },
        {
          label: '已完成任务',
          href: '/admin/tasks/completed',
          icon: <CheckSquare className="w-4 h-4" />,
          active: currentPath === '/admin/tasks/completed'
        },
        {
          label: '视频生成任务',
          href: '/admin/video-tasks',
          icon: <Activity className="w-4 h-4" />,
          active: currentPath === '/admin/video-tasks'
        }
      ]
    },
    {
      label: '佣金管理',
      href: '#',
      icon: <Gift className="w-5 h-5" />,
      active: false,
      children: [
        {
          label: '智能佣金管理',
          href: '/admin/commission',
          icon: <Activity className="w-4 h-4" />,
          active: currentPath === '/admin/commission'
        },
        {
          label: '初始佣金管理',
          href: '/admin/commission/initial',
          icon: <Gift className="w-4 h-4" />,
          active: currentPath === '/admin/commission/initial'
        },
        {
          label: '发放进度',
          href: '/admin/commission/progress',
          icon: <BarChart3 className="w-4 h-4" />,
          active: currentPath === '/admin/commission/progress'
        },
        {
          label: '金额修改',
          href: '/admin/commission/edit',
          icon: <DollarSign className="w-4 h-4" />,
          active: currentPath === '/admin/commission/edit'
        }
      ]
    },
    {
      label: '财务管理',
      href: '#',
      icon: <DollarSign className="w-5 h-5" />,
      active: false,
      children: [
        {
          label: '财务概览',
          href: '/admin/finance',
          icon: <DollarSign className="w-4 h-4" />,
          active: currentPath === '/admin/finance'
        },
        {
          label: '订单管理',
          href: '/admin/orders',
          icon: <ShoppingCart className="w-4 h-4" />,
          active: currentPath === '/admin/orders'
        },
        {
          label: '收入统计',
          href: '/admin/finance/revenue',
          icon: <BarChart3 className="w-4 h-4" />,
          active: currentPath === '/admin/finance/revenue'
        },
        {
          label: '提现管理',
          href: '/admin/finance/withdrawals',
          icon: <DollarSign className="w-4 h-4" />,
          active: currentPath === '/admin/finance/withdrawals',
          badge: '3'
        }
      ]
    },
    {
      label: '数据统计',
      href: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      active: currentPath === '/admin/analytics'
    },
    {
      label: '消息管理',
      href: '/admin/messages',
      icon: <MessageSquare className="w-5 h-5" />,
      active: currentPath === '/admin/messages',
      badge: '5'
    },
    {
      label: '系统监控',
      href: '/admin/monitor',
      icon: <Activity className="w-5 h-5" />,
      active: currentPath === '/admin/monitor'
    },
    {
      label: '服务器管理',
      href: '#',
      icon: <Server className="w-5 h-5" />,
      active: false,
      children: [
        {
          label: '共享服务器',
          href: '/admin/servers/shared',
          icon: <Server className="w-4 h-4" />,
          active: currentPath === '/admin/servers/shared'
        }
      ]
    },
    {
      label: '数据库管理',
      href: '/admin/database',
      icon: <Database className="w-5 h-5" />,
      active: currentPath === '/admin/database'
    },
    {
      label: '系统设置',
      href: '#',
      icon: <Settings className="w-5 h-5" />,
      active: false,
      children: [
        {
          label: '系统概览',
          href: '/admin/settings',
          icon: <Settings className="w-4 h-4" />,
          active: currentPath === '/admin/settings'
        },
        {
          label: '基本设置',
          href: '/admin/settings/general',
          icon: <Settings className="w-4 h-4" />,
          active: currentPath === '/admin/settings/general'
        },
        {
          label: '权限管理',
          href: '/admin/settings/permissions',
          icon: <Shield className="w-4 h-4" />,
          active: currentPath === '/admin/settings/permissions'
        },
        {
          label: '通知设置',
          href: '/admin/settings/notifications',
          icon: <Bell className="w-4 h-4" />,
          active: currentPath === '/admin/settings/notifications'
        }
      ]
    }
  ];

  // 初始化时展开活跃的菜单
     React.useEffect(() => {
       const initialExpanded = new Set<string>();
       sidebarLinks.forEach(link => {
         if (link.children && link.children.some(child => child.active)) {
           initialExpanded.add(link.href === '#' ? link.label : link.href);
         }
       });
       setExpandedMenus(initialExpanded);
     }, [currentPath]);

  // 渲染导航链接
  const renderNavLink = (link: AdminSidebarLink, level: number = 0, collapsed: boolean = false) => {
    const hasChildren = link.children && link.children.length > 0;
    const isActive = link.active; // 只有当前菜单项本身被选中时才显示选中状态
    const isExpanded = expandedMenus.has(link.href === '#' ? link.label : link.href);
    const showChildren = hasChildren && isExpanded;

    const handleClick = (e: React.MouseEvent) => {
       if (hasChildren && link.href === '#') {
         // 如果是有子菜单的主菜单项且href为'#'，阻止默认导航并切换子菜单
         e.preventDefault();
         toggleSubmenu(link.label); // 使用label作为唯一标识符
       }
       // 如果是子菜单项或有实际href的主菜单项，正常导航
     };

    const handleArrowClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSubmenu(link.href === '#' ? link.label : link.href);
    };

    return (
      <div key={link.href}>
        <a
          href={link.href}
          onClick={handleClick}
          className={clsx(
            'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative',
            level === 0 ? 'mb-1' : 'mb-0.5 ml-4',
            collapsed && level === 0 ? 'justify-center' : '',
            isActive
              ? 'text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
          title={collapsed ? link.label : undefined}
        >
          <div className={clsx(
            'flex items-center',
            collapsed && level === 0 ? 'justify-center' : 'space-x-3'
          )}>
            <div className={clsx(
              'flex-shrink-0 transition-colors duration-200',
              isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400'
            )}>
              {link.icon}
            </div>
            {(!collapsed || level > 0) && <span>{link.label}</span>}
          </div>
          <div className="flex items-center space-x-2">
            {link.badge && (!collapsed || level > 0) && (
              <span className={clsx(
                'px-2 py-0.5 text-xs font-medium rounded-full transition-colors duration-200',
                isActive
                  ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-red-100 dark:group-hover:bg-red-800 group-hover:text-red-800 dark:group-hover:text-red-200'
              )}>
                {link.badge}
              </span>
            )}
            {(!collapsed || level > 0) && hasChildren && level === 0 && (
              <button
                onClick={handleArrowClick}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </a>
        
        {/* 子菜单 */}
        {showChildren && link.children && !collapsed && (
          <div className="mt-1 space-y-0.5">
            {link.children.map(child => renderNavLink(child, level + 1, collapsed))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className={clsx(
        'fixed top-0 left-0 bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700 h-screen transition-all duration-300 z-30',
        isCollapsed ? 'w-16' : 'w-64',
        'hidden lg:block',
        className
      )}>
        <div className="h-full flex flex-col">
          {/* Logo区域 */}
          <div className={clsx(
            'border-b border-gray-200 dark:border-gray-700 transition-all duration-300',
            isCollapsed ? 'p-4' : 'p-6'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* 用户头像或Logo */}
                {user && !isCollapsed ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                )}
                {!isCollapsed && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {user ? user.username : '管理后台'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user ? (user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '用户') : '系统管理'}
                    </p>
                  </div>
                )}
              </div>
              {/* 切换按钮 */}
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {sidebarLinks.map(link => renderNavLink(link, 0, isCollapsed))}
            </div>
          </nav>

          {/* 底部用户信息 */}
          {!isCollapsed && user && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '用户'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 移动端侧边栏 - 只在移动端且侧边栏打开时显示 */}
      {isSidebarOpen && (
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out',
          'lg:hidden',
          'translate-x-0',
          className
        )}>
        <div className="h-full flex flex-col">
          {/* Logo区域 */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  管理后台
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  系统管理
                </p>
              </div>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {sidebarLinks.map(link => (
                <div key={link.href} onClick={closeSidebar}>
                  {renderNavLink(link, 0, false)}
                </div>
              ))}
            </div>
          </nav>

          {/* 底部用户信息 */}
          {user && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.username} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '用户'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </aside>
      )}
    </>
  );
};

export default AdminSidebar;