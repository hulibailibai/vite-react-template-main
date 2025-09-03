import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

export const usePermission = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('usePermission must be used within an AuthProvider');
  }
  const { user } = context;
  
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // 超级管理员拥有所有权限
    if (user.role === 'super_admin') return true;
    
    // 根据用户角色和权限进行检查
    switch (permission) {
      case 'admin.dashboard':
      case 'admin.users':
      case 'admin.workflows':
      case 'admin.ai-apps':
      case 'admin.creators':
      case 'admin.creator-applications':
      case 'admin.creator-earnings':
      case 'admin.creator-levels':
        return (user.role as string) === 'super_admin';
      default:
        return false;
    }
  };
  
  const isAdmin = () => {
    return (user?.role as string) === 'super_admin';
  };
  
  const isModerator = () => {
    return user?.role === 'super_admin';
  };
  
  return {
    hasPermission,
    isAdmin,
    isModerator,
    user
  };
};