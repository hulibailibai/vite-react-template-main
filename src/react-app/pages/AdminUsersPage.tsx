import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Search,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  User as UserIcon,
  Crown,
  Shield,
  Eye,
  Download,
  Calendar,
  FileText,
  X
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
// import { AdminLayout } from '../components/AdminLayout'; // 移除，因为在App.tsx中已经使用了AdminLayout包装

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';


// 管理页面用户接口，包含所有必要字段
interface AdminUser {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  oauth_provider?: string;
  oauth_id?: string;
  role: 'user' | 'creator' | 'advertiser' | 'admin' | 'super_admin';
  avatar_url?: string;
  balance: number;
  total_earnings: number;
  status: 'active' | 'banned' | 'pending' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
  membership_type: 'free' | 'basic' | 'premium';
  membership_start_date?: string;
  membership_end_date?: string;
  membership_auto_renew: number;
  wh_coins: number;
  wechat_openid?: string;
  phone?: string;
  // 保留原有字段以兼容现有代码
  bio?: string;
  lastLoginAt?: string;
  totalWorkflows?: number;
  totalDownloads?: number;
  realName?: string;
}

// 用户详情模态框接口
interface UserDetailModalProps {
  user: AdminUser | null;
  currentUser: any; // 当前登录的用户
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: AdminUser) => void;
}

// 角色修改模态框接口
interface RoleEditModalProps {
  user: AdminUser | null;
  currentUser: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 角色修改模态框组件
const RoleEditModal: React.FC<RoleEditModalProps> = ({ user, currentUser, isOpen, onClose, onUpdate }) => {
  const { showError } = useAlert();
  const [selectedRole, setSelectedRole] = useState<AdminUser['role']>('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || selectedRole === user.role) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      await adminApi.updateUser(user.id, { role: selectedRole });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update user role:', error);
      showError('修改用户角色失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // 根据当前用户权限确定可选角色
  const getAvailableRoles = () => {
    const roles = [
      { value: 'user', label: '普通用户' },
      { value: 'creator', label: '创作者' },
      { value: 'advertiser', label: '广告商' }
    ];

    // 超级管理员可以设置所有角色
    if (currentUser?.role === 'super_admin') {
      roles.push(
        { value: 'admin', label: '管理员' },
        { value: 'super_admin', label: '超级管理员' }
      );
    }

    return roles;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="修改用户角色">
      <div className="space-y-6">
        {/* 用户信息 */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
            <p className="text-gray-600">{user.email}</p>
            <Badge variant={user.role === 'super_admin' ? 'error' : user.role === 'admin' ? 'error' : 'default'}>
              当前角色：{user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : user.role === 'creator' ? '创作者' : user.role === 'advertiser' ? '广告商' : '普通用户'}
            </Badge>
          </div>
        </div>

        {/* 角色选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">选择新角色</label>
          <div className="space-y-2">
            {getAvailableRoles().map((role) => (
              <label key={role.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value as AdminUser['role'])}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {role.value === 'super_admin' && <Crown className="w-4 h-4 text-yellow-500" />}
                  {role.value === 'admin' && <Shield className="w-4 h-4 text-red-500" />}
                  {role.value === 'creator' && <UserIcon className="w-4 h-4 text-blue-500" />}
                  {role.value === 'advertiser' && <UserIcon className="w-4 h-4 text-green-500" />}
                  {role.value === 'user' && <UserIcon className="w-4 h-4 text-gray-500" />}
                  <span className="font-medium">{role.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 权限说明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">角色权限说明</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 普通用户：基础功能使用权限</li>
            <li>• 创作者：可以发布和管理工作流</li>
            <li>• 广告商：可以投放和管理广告</li>
            {currentUser?.role === 'super_admin' && (
              <>
                <li>• 管理员：用户管理和内容审核权限</li>
                <li>• 超级管理员：系统最高权限</li>
              </>
            )}
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || selectedRole === user.role}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '保存中...' : '确认修改'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 用户详情模态框组件
const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, currentUser, onClose, onUpdate }) => {
  const { showError } = useAlert();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditingUser({ ...user });
    }
  }, [user]);

  const handleSave = async () => {
    if (!editingUser || !user) return;

    try {
      setLoading(true);
      
      // 只发送有变更的字段
      const updateData: Partial<AdminUser> = {};
      
      // 检查每个字段是否有变更，只发送非空且有变更的字段
      if (editingUser.username !== user.username && editingUser.username?.trim()) {
        updateData.username = editingUser.username;
      }
      if (editingUser.email !== user.email && editingUser.email?.trim()) {
        updateData.email = editingUser.email;
      }
      if (editingUser.role !== user.role) {
        updateData.role = editingUser.role;
      }
      if (editingUser.phone !== user.phone && editingUser.phone?.trim()) {
        updateData.phone = editingUser.phone;
      }
      if (editingUser.avatar_url !== user.avatar_url && editingUser.avatar_url?.trim()) {
        updateData.avatar_url = editingUser.avatar_url;
      }
      if (editingUser.balance !== user.balance) {
        updateData.balance = editingUser.balance;
      }
      if (editingUser.total_earnings !== user.total_earnings) {
        updateData.total_earnings = editingUser.total_earnings;
      }
      if (editingUser.wh_coins !== user.wh_coins) {
        console.log('WH币发生变更:', { original: user.wh_coins, new: editingUser.wh_coins, type: typeof editingUser.wh_coins });
        updateData.wh_coins = editingUser.wh_coins;
      }
      if (editingUser.membership_type !== user.membership_type) {
        updateData.membership_type = editingUser.membership_type;
      }
      if (editingUser.membership_start_date !== user.membership_start_date && editingUser.membership_start_date?.trim()) {
        updateData.membership_start_date = editingUser.membership_start_date;
      }
      if (editingUser.membership_end_date !== user.membership_end_date && editingUser.membership_end_date?.trim()) {
        updateData.membership_end_date = editingUser.membership_end_date;
      }
      if (editingUser.membership_auto_renew !== user.membership_auto_renew) {
        updateData.membership_auto_renew = editingUser.membership_auto_renew;
      }
      if (editingUser.oauth_provider !== user.oauth_provider && editingUser.oauth_provider?.trim()) {
        updateData.oauth_provider = editingUser.oauth_provider;
      }
      if (editingUser.oauth_id !== user.oauth_id && editingUser.oauth_id?.trim()) {
        updateData.oauth_id = editingUser.oauth_id;
      }
      if (editingUser.wechat_openid !== user.wechat_openid && editingUser.wechat_openid?.trim()) {
        updateData.wechat_openid = editingUser.wechat_openid;
      }
      
      // 如果没有任何字段需要更新，直接返回
      if (Object.keys(updateData).length === 0 && editingUser.status === user.status) {
        onClose();
        return;
      }
      
      let updatedUser = user;
      
      // 只有当有字段需要更新时才调用API
      if (Object.keys(updateData).length > 0) {
        console.log('发送到后端的数据:', updateData);
        updatedUser = await adminApi.updateUser(editingUser.id, updateData);
        console.log('后端返回的数据:', updatedUser);
      }
      // 如果需要更新状态，使用专门的状态更新API
      if (editingUser.status !== user?.status) {
        await adminApi.updateUserStatus(editingUser.id, editingUser.status as 'active' | 'banned' | 'pending' | 'suspended' | 'deleted');
      }
      onUpdate({ ...updatedUser, ...editingUser } as AdminUser);
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      showError('更新用户信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: AdminUser['status']) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, status });
    }
  };

  const handleRoleChange = (role: AdminUser['role']) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, role });
    }
  };

  if (!user || !editingUser) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75" 
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-900 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              用户详情
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                <p className="text-gray-300">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={user.role === 'super_admin' ? 'error' : user.role === 'admin' ? 'error' : user.role === 'creator' ? 'default' : 'default'}>
                    {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : user.role === 'creator' ? '创作者' : user.role === 'advertiser' ? '广告商' : '用户'}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'success' : user.status === 'banned' ? 'error' : 'warning'}>
                    {user.status === 'active' ? '正常' : user.status === 'banned' ? '已封禁' : '待激活'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-white">¥{user.balance || 0}</p>
                <p className="text-sm text-gray-400">账户余额</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-white">¥{user.total_earnings || 0}</p>
                <p className="text-sm text-gray-400">总收益</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-white">{user.wh_coins || 0}</p>
                <p className="text-sm text-gray-400">WH币</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <p className="text-2xl font-bold text-white">{user.totalWorkflows || 0}</p>
                <p className="text-sm text-gray-400">发布工作流</p>
              </div>
            </div>

            {/* 编辑表单 */}
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">基本信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">用户名</label>
                    <Input
                      value={editingUser.username}
                      onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">邮箱</label>
                    <Input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">手机号</label>
                    <Input
                      value={editingUser.phone || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">头像URL</label>
                    <Input
                      value={editingUser.avatar_url || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, avatar_url: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 账户信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">账户信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">角色</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => handleRoleChange(e.target.value as AdminUser['role'])}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">普通用户</option>
                      <option value="creator">创作者</option>
                      <option value="advertiser">广告商</option>
                      {/* 只有超级管理员可以任命管理员和超级管理员 */}
                      {currentUser?.role === 'super_admin' && (
                        <>
                          <option value="admin">管理员</option>
                          <option value="super_admin">超级管理员</option>
                        </>
                      )}
                      {/* 普通管理员只能看到管理员选项但不能修改 */}
                      {currentUser?.role === 'admin' && editingUser.role === 'admin' && (
                        <option value="admin">管理员</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">状态</label>
                    <select
                      value={editingUser.status}
                      onChange={(e) => handleStatusChange(e.target.value as AdminUser['status'])}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">正常</option>
                      <option value="banned">封禁</option>
                      <option value="pending">待激活</option>
                      <option value="suspended">暂停</option>
                      <option value="deleted">已删除</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 财务信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">财务信息</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">账户余额</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingUser.balance || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, balance: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">总收益</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingUser.total_earnings || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, total_earnings: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">WH币</label>
                    <Input
                      type="number"
                      value={editingUser.wh_coins || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, wh_coins: Number(e.target.value) || 0 })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 会员信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">会员信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">会员类型</label>
                    <select
                      value={editingUser.membership_type || 'free'}
                      onChange={(e) => setEditingUser({ ...editingUser, membership_type: e.target.value as 'free' | 'basic' | 'premium' })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="free">免费用户</option>
                      <option value="basic">基础会员</option>
                      <option value="premium">高级会员</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">自动续费</label>
                    <select
                      value={editingUser.membership_auto_renew || 0}
                      onChange={(e) => setEditingUser({ ...editingUser, membership_auto_renew: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>关闭</option>
                      <option value={1}>开启</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">会员开始时间</label>
                    <Input
                      type="datetime-local"
                      value={editingUser.membership_start_date ? new Date(editingUser.membership_start_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingUser({ ...editingUser, membership_start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">会员结束时间</label>
                    <Input
                      type="datetime-local"
                      value={editingUser.membership_end_date ? new Date(editingUser.membership_end_date).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setEditingUser({ ...editingUser, membership_end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* OAuth信息 */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white border-b border-gray-700 pb-2">第三方登录信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">OAuth提供商</label>
                    <Input
                      value={editingUser.oauth_provider || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, oauth_provider: e.target.value })}
                      placeholder="如：google, github, wechat"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">OAuth ID</label>
                    <Input
                      value={editingUser.oauth_id || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, oauth_id: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">微信OpenID</label>
                  <Input
                    value={editingUser.wechat_openid || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, wechat_openid: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
              <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                取消
              </Button>
              <Button onClick={handleSave} loading={loading}>
                保存更改
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 管理员用户管理页面
export const AdminUsersPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError, showSuccess, showConfirm } = useAlert();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);

  // 分页大小常量
  const pageSize = 10;

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => isAdmin(), [user, isAuthenticated]);

  // 权限验证
  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) return;
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    if (!isAdminUser) {
      window.location.href = '/';
      return;
    }
  }, [isAuthenticated, isLoading, isAdminUser]);

  // 如果正在加载认证状态或用户未认证或不是管理员，显示加载状态
  if (isLoading || !isAuthenticated || !isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">验证权限中...</p>
        </div>
      </div>
    );
  }

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await adminApi.getAllUsers(params);
      // 将API返回的User类型转换为AdminUser类型
      const adminUsers: AdminUser[] = response.items.map(user => ({
        ...user,
        status: user.status || 'active', // 使用API返回的实际状态
        lastLoginAt: user.updated_at, // 使用 updated_at 作为最后登录时间
        totalWorkflows: 0,
        totalDownloads: 0,
        phone: undefined,
        realName: undefined
      }));
      setUsers(adminUsers);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      showError('加载用户列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearchTerm, roleFilter, statusFilter]);

  // 当搜索条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  // 显示的用户列表（服务端已过滤）
  const displayUsers = users;



  // 获取状态图标
  const getStatusIcon = (status: AdminUser['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'banned':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'suspended':
        return <Ban className="w-4 h-4 text-orange-500" />;
      case 'deleted':
        return <Trash2 className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // 处理用户操作
  const handleUserAction = async (userId: number, action: string) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      const username = targetUser?.username || '用户';
      
      switch (action) {
        case 'view':
          const user = users.find(u => u.id === userId);
          if (user) {
            setSelectedUser(user);
            setIsDetailModalOpen(true);
          }
          break;
        case 'editRole':
          // 修改角色
          const userToEdit = users.find(u => u.id === userId);
          if (userToEdit) {
            setSelectedUser(userToEdit);
            setIsRoleEditModalOpen(true);
          }
          break;
        case 'ban':
          // 封禁用户
          await adminApi.updateUserStatus(userId, 'banned');
          await loadUsers(); // 重新加载用户列表
          showSuccess(`用户 "${username}" 已成功封禁`);
          break;
        case 'unban':
          // 解封用户
          await adminApi.updateUserStatus(userId, 'active');
          await loadUsers(); // 重新加载用户列表
          showSuccess(`用户 "${username}" 已成功解封`);
          break;
        case 'delete':
          // 删除用户
          const confirmed = await showConfirm(`确定要删除用户 "${username}" 吗？此操作将清除该用户的所有数据且不可恢复。`);
          if (confirmed) {
            await adminApi.deleteUser(userId);
            await loadUsers(); // 重新加载用户列表
            showSuccess(`用户 "${username}" 已成功删除`);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to perform user action:', error);
      showError('操作失败，请重试');
    }
  };

  // 更新用户信息
  const handleUpdateUser = async () => {
    // 重新加载用户列表以获取最新数据
    await loadUsers();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 搜索和过滤 */}
      <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <Input
                placeholder="搜索用户名、邮箱或姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
            >
              <option value="all">所有角色</option>
              <option value="user">普通用户</option>
              <option value="creator">创作者</option>
              <option value="advertiser">广告商</option>
              <option value="admin">管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="active">正常</option>
              <option value="banned">已封禁</option>
              <option value="pending">待激活</option>
              <option value="suspended">暂停</option>
              <option value="deleted">已删除</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 用户列表 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  统计
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {displayUsers.map((listUser) => (
                  <tr key={listUser.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                          {listUser.avatar_url ? (
                            <img src={listUser.avatar_url} alt={listUser.username} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600" />
                          ) : (
                            <UserIcon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{listUser.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{listUser.email}</div>
                          {listUser.realName && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{listUser.realName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {listUser.role === 'super_admin' && <Crown className="w-5 h-5 text-yellow-500" />}
                        {listUser.role === 'admin' && <Shield className="w-5 h-5 text-blue-500" />}
                        <Badge 
                          variant={listUser.role === 'super_admin' ? 'error' : listUser.role === 'admin' ? 'error' : listUser.role === 'creator' ? 'default' : 'default'}
                          className={clsx('px-3 py-1 rounded-full text-xs font-medium', {
                            'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 dark:from-yellow-900/30 dark:to-yellow-800/30 dark:text-yellow-300': listUser.role === 'super_admin',
                            'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/30 dark:to-blue-800/30 dark:text-blue-300': listUser.role === 'admin',
                            'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 dark:from-purple-900/30 dark:to-purple-800/30 dark:text-purple-300': listUser.role === 'creator',
                            'bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/30 dark:to-green-800/30 dark:text-green-300': listUser.role === 'advertiser',
                            'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300': listUser.role === 'user',
                          })}
                        >
                          {listUser.role === 'super_admin' ? '超级管理员' : 
                           listUser.role === 'admin' ? '管理员' : 
                           listUser.role === 'creator' ? '创作者' : 
                           listUser.role === 'advertiser' ? '广告商' : '用户'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(listUser.status)}
                        <span className={clsx('text-sm', {
                          'text-green-600': listUser.status === 'active',
                          'text-red-600': listUser.status === 'banned',
                          'text-yellow-600': listUser.status === 'pending',
                          'text-orange-600': listUser.status === 'suspended',
                          'text-gray-600': listUser.status === 'deleted',
                        })}>
                          {listUser.status === 'active' ? '正常' : 
                           listUser.status === 'banned' ? '已封禁' : 
                           listUser.status === 'pending' ? '待激活' :
                           listUser.status === 'suspended' ? '暂停' :
                           listUser.status === 'deleted' ? '已删除' : '未知'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="font-medium">{listUser.totalWorkflows || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="font-medium">{listUser.totalDownloads || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {listUser.created_at}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {listUser.lastLoginAt || '从未登录'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* 查看详情按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(listUser.id, 'view')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                        
                        {/* 封禁/解封按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(listUser.id, listUser.status === 'banned' ? 'unban' : 'ban')}
                          disabled={user?.role !== 'super_admin' && (listUser.role === 'admin' || listUser.role === 'super_admin')}
                          className={clsx(
                            listUser.status === 'banned' ? 'text-green-600 hover:text-green-800' : 'text-yellow-600 hover:text-yellow-800',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                        >
                          {listUser.status === 'banned' ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              解封
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 mr-1" />
                              封禁
                            </>
                          )}
                        </Button>
                        
                        {/* 删除用户按钮 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUserAction(listUser.id, 'delete')}
                          disabled={user?.role !== 'super_admin' && (listUser.role === 'admin' || listUser.role === 'super_admin')}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, (currentPage - 1) * pageSize + displayUsers.length)} 条，
                共 {totalCount} 条记录
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 用户详情模态框 */}
      <UserDetailModal
        user={selectedUser}
        currentUser={user}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUser(null);
        }}
        onUpdate={handleUpdateUser}
      />

      {/* 角色修改模态框 */}
      <RoleEditModal
        user={selectedUser}
        currentUser={user}
        isOpen={isRoleEditModalOpen}
        onClose={() => {
          setIsRoleEditModalOpen(false);
          setSelectedUser(null);
        }}
        onUpdate={loadUsers}
      />
    </>
  );
};