//创作者列表
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';
import { User } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/format';

// 创作者接口，扩展User类型
interface Creator extends User {
  workflowCount?: number;
  totalDownloads?: number;
  averageRating?: number;
  lastActiveAt?: string;
}

// 创作者详情模态框组件
interface CreatorDetailModalProps {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({
  creator,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);

  if (!creator) return null;

  const handleStatusChange = async (newStatus: 'active' | 'banned' | 'suspended') => {
    const confirmed = await showConfirm(
      `确认${newStatus === 'active' ? '激活' : newStatus === 'banned' ? '封禁' : '暂停'}创作者`,
      `确定要${newStatus === 'active' ? '激活' : newStatus === 'banned' ? '封禁' : '暂停'}创作者 "${creator.username}" 吗？`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.updateUserStatus(creator.id, newStatus);
      showAlert('创作者状态更新成功', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('更新创作者状态失败:', error);
      showAlert('更新创作者状态失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: 'user' | 'creator') => {
    const confirmed = await showConfirm(
      `确认${newRole === 'user' ? '取消创作者权限' : '恢复创作者权限'}`,
      `确定要${newRole === 'user' ? '取消' : '恢复'}用户 "${creator.username}" 的创作者权限吗？${newRole === 'user' ? '\n注意：这将下架该用户的所有工作流。' : ''}`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.updateUser(creator.id, { role: newRole });
      showAlert(`${newRole === 'user' ? '取消' : '恢复'}创作者权限成功`, 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('更新创作者权限失败:', error);
      showAlert('更新创作者权限失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创作者详情">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{creator.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{creator.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                角色
              </label>
              <Badge variant={creator.role === 'creator' ? 'success' : 'secondary'}>
                {creator.role === 'creator' ? '创作者' : '普通用户'}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                状态
              </label>
              <Badge 
                variant={
                  creator.status === 'active' ? 'success' : 
                  creator.status === 'banned' ? 'danger' : 'warning'
                }
              >
                {creator.status === 'active' ? '正常' : 
                 creator.status === 'banned' ? '已封禁' : 
                 creator.status === 'suspended' ? '已暂停' : '未知'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">统计信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                总收益
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatCurrency(creator.total_earnings)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                账户余额
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatCurrency(creator.balance)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                工作流数量
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {creator.workflowCount || 0} 个
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                总下载量
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {creator.totalDownloads || 0} 次
              </p>
            </div>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">时间信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                注册时间
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDate(creator.created_at)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                最后更新
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDate(creator.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            关闭
          </Button>
          
          {creator.role === 'creator' && (
            <Button
              variant="outline"
              onClick={() => handleRoleChange('user')}
              disabled={loading}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              取消创作者权限
            </Button>
          )}
          
          {creator.role === 'user' && (
            <Button
              variant="outline"
              onClick={() => handleRoleChange('creator')}
              disabled={loading}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              恢复创作者权限
            </Button>
          )}

          {creator.status === 'active' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusChange('suspended')}
                disabled={loading}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                暂停账户
              </Button>
              <Button
                variant="danger"
                onClick={() => handleStatusChange('banned')}
                disabled={loading}
              >
                封禁账户
              </Button>
            </>
          )}

          {creator.status !== 'active' && (
            <Button
              variant="primary"
              onClick={() => handleStatusChange('active')}
              disabled={loading}
            >
              激活账户
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// 管理员创作者管理页面
export const AdminCreatorsPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  // 加载创作者列表
  const loadCreators = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearchTerm || undefined,
        role: 'creator', // 只获取创作者
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await adminApi.getAllUsers(params);
      
      // 转换数据格式并添加统计信息
      const creatorsData: Creator[] = response.items.map(user => ({
        ...user,
        workflowCount: 0, // TODO: 从API获取实际数据
        totalDownloads: 0, // TODO: 从API获取实际数据
        averageRating: 0, // TODO: 从API获取实际数据
        lastActiveAt: user.updated_at
      }));
      
      setCreators(creatorsData);
      // 修复：正确访问 pagination 对象中的字段
      setTotalPages(response.pagination.totalPages || 1);
      setTotalCount(response.pagination.total || 0);
    } catch (error) {
      console.error('Failed to load creators:', error);
      showError('加载创作者列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索防抖状态
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 初始加载和依赖更新时重新加载
  useEffect(() => {
    if (isAuthenticated && isAdminUser) {
      loadCreators();
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, isAuthenticated, isAdminUser]);

  // 处理查看详情
  const handleViewDetail = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsDetailModalOpen(true);
  };

  // 处理模态框关闭
  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedCreator(null);
  };

  // 处理数据更新
  const handleDataUpdate = () => {
    loadCreators();
  };

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 如果未认证或无权限，不渲染内容（会被重定向）
  if (!isAuthenticated || !isAdminUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">创作者管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理平台创作者账户和权限
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">活跃创作者</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {creators.filter(creator => creator.status === 'active').length}
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">总</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">总创作者数</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">正常状态</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {creators.filter(creator => creator.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏸</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">已暂停</p>
                <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  {creators.filter(creator => creator.status === 'suspended').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✕</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">已封禁</p>
                <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                  {creators.filter(creator => creator.status === 'banned').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              搜索创作者
            </label>
            <input
              type="text"
              placeholder="搜索用户名、邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* 状态筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              状态筛选
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">全部状态</option>
              <option value="active">正常</option>
              <option value="suspended">已暂停</option>
              <option value="banned">已封禁</option>
            </select>
          </div>

          {/* 刷新按钮 */}
          <div className="flex items-end">
            <Button
              onClick={loadCreators}
              disabled={loading}
              className="w-full"
            >
              {loading ? '加载中...' : '刷新数据'}
            </Button>
          </div>
        </div>
      </div>

      {/* 创作者列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  创作者信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  收益统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  作品统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    暂无创作者数据
                  </td>
                </tr>
              ) : (
                creators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {creator.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={creator.avatar_url}
                              alt={creator.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {creator.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {creator.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {creator.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          creator.status === 'active' ? 'success' : 
                          creator.status === 'banned' ? 'danger' : 'warning'
                        }
                      >
                        {creator.status === 'active' ? '正常' : 
                         creator.status === 'banned' ? '已封禁' : 
                         creator.status === 'suspended' ? '已暂停' : '未知'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div>总收益: {formatCurrency(creator.total_earnings)}</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          余额: {formatCurrency(creator.balance)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div>
                        <div>工作流: {creator.workflowCount || 0} 个</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          下载: {creator.totalDownloads || 0} 次
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(creator.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(creator)}
                      >
                        查看详情
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && creators.length > 0 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  显示第 <span className="font-medium">{totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> 到{' '}
                  <span className="font-medium">
                    {totalCount > 0 ? Math.min(currentPage * pageSize, totalCount) : 0}
                  </span>{' '}
                  条，共 <span className="font-medium">{totalCount}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-l-md"
                  >
                    上一页
                  </Button>
                  
                  {/* 页码按钮 */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'outline'}
                        onClick={() => setCurrentPage(pageNum)}
                        className="-ml-px"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-r-md -ml-px"
                  >
                    下一页
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创作者详情模态框 */}
      <CreatorDetailModal
        creator={selectedCreator}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        onUpdate={handleDataUpdate}
      />
    </div>
  );
};