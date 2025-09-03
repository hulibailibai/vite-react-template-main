// 导航工具函数
import { User } from '../types';

/**
 * 根据用户角色获取登录后的跳转路径
 * @param user 用户信息
 * @returns 跳转路径
 */
export const getRedirectPathByRole = (user: User): string => {
  switch (user.role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'creator':
      return '/creator';
    case 'advertiser':
      return '/advertiser';
    case 'user':
    default:
      return '/';
  }
};

/**
 * 执行基于用户角色的页面跳转
 * @param user 用户信息
 */
export const redirectByRole = (user: User): void => {
  const redirectPath = getRedirectPathByRole(user);
  window.location.href = redirectPath;
};