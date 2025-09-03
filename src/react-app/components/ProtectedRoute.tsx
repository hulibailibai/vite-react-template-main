import React, { useEffect, useState } from 'react';
import { useAuth, usePermission } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'creator' | 'advertiser';
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole } = usePermission();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout | null = null;

    const checkPermissions = async () => {
      console.log('🔍 ProtectedRoute: 开始权限检查', {
        isLoading,
        isAuthenticated,
        requiredRole,
        user: user ? { username: user.username, role: user.role } : null,
        timestamp: new Date().toISOString()
      });

      // 清除之前的重定向定时器
      if (redirectTimer) {
        console.log('🔄 ProtectedRoute: 清除之前的重定向定时器');
        clearTimeout(redirectTimer);
        redirectTimer = null;
      }

      // 等待认证状态完全加载
      if (isLoading) {
        console.log('⏳ ProtectedRoute: 认证状态加载中，等待...');
        return;
      }

      // 只有在需要特定角色时才检查认证状态
      if (!requiredRole) {
        console.log('✅ ProtectedRoute: 无需特定角色，允许访问');
        setIsChecking(false);
        return;
      }

      // 如果需要特定角色但用户未认证，重定向到登录页
      if (requiredRole && !isAuthenticated) {
        console.log('❌ ProtectedRoute: 需要认证但用户未登录，3秒后重定向到登录页');
        redirectTimer = setTimeout(() => {
          console.log('🚀 ProtectedRoute: 执行重定向 - 用户未认证');
          window.location.href = '/login';
        }, 3000);
        return;
      }

      // 如果需要特定角色但用户没有权限，重定向到指定页面
      if (requiredRole && isAuthenticated) {
        let hasPermission = false;
        
        // 特殊处理admin权限：super_admin和admin都可以访问
        if (requiredRole === 'admin') {
          hasPermission = hasRole(['admin', 'super_admin']);
        } else {
          hasPermission = hasRole(requiredRole);
        }
        
        if (!hasPermission) {
          console.log(`❌ ProtectedRoute: 用户没有${requiredRole}权限，3秒后重定向`, { 
            user: user?.username, 
            userRole: user?.role, 
            requiredRole: requiredRole,
            fallbackPath
          });
          redirectTimer = setTimeout(() => {
            console.log('🚀 ProtectedRoute: 执行重定向 - 权限不足');
            window.location.href = fallbackPath === '/login' ? '/' : fallbackPath;
          }, 3000);
          return;
        }
      }

      console.log('✅ ProtectedRoute: 权限验证通过，允许访问');
      setIsChecking(false);
    };

    checkPermissions();

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (redirectTimer) {
        console.log('🧹 ProtectedRoute: 组件卸载，清除重定向定时器');
        clearTimeout(redirectTimer);
      }
    };
  }, [isAuthenticated, isLoading, user, requiredRole, hasRole, fallbackPath]);

  // 显示加载状态
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    );
  }

  // 如果需要特定角色但用户未认证或没有权限，显示加载状态（等待重定向）
  if (requiredRole && isAuthenticated) {
    let hasPermission = false;
    
    // 特殊处理admin权限：super_admin和admin都可以访问
    if (requiredRole === 'admin') {
      hasPermission = hasRole(['admin', 'super_admin']);
    } else {
      hasPermission = hasRole(requiredRole);
    }
    
    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在验证权限...</p>
          </div>
        </div>
      );
    }
  }
  
  // 如果需要特定角色但用户未认证，显示加载状态（等待重定向）
  if (requiredRole && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在验证权限...</p>
        </div>
      </div>
    );
  }

  // 如果不需要特定角色，直接渲染子组件
  if (!requiredRole) {
    return <>{children}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;