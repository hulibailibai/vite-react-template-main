// 申请审核
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';
import { CreatorApplication } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/format';

// 申请审核模态框组件
interface ApplicationReviewModalProps {
  application: CreatorApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ApplicationReviewModal: React.FC<ApplicationReviewModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  useEffect(() => {
    if (application) {
      setReviewComment(application.admin_comment || '');
    }
  }, [application]);

  if (!application) return null;

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewComment.trim()) {
      showAlert('拒绝申请时必须填写审核意见', 'error');
      return;
    }

    const confirmed = await showConfirm(
      `确认${action === 'approve' ? '通过' : '拒绝'}申请`,
      `确定要${action === 'approve' ? '通过' : '拒绝'}用户 "${application.user?.username || application.username || '未知用户'}" 的创作者申请吗？`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.reviewCreatorApplication(application.id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_comment: reviewComment.trim() || undefined
      });
      showAlert(`申请${action === 'approve' ? '通过' : '拒绝'}成功`, 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('审核申请失败:', error);
      showAlert('审核申请失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待审核</Badge>;
      case 'approved':
        return <Badge variant="success">已通过</Badge>;
      case 'rejected':
        return <Badge variant="danger">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创作者申请审核" size="lg">
      <div className="space-y-6">
        {/* 申请状态 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            申请状态
          </h3>
          {getStatusBadge(application.status)}
        </div>

        {/* 申请人信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">申请人信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {application.user?.username || application.username || '未知用户'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {application.user?.email || application.email || '未知邮箱'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                国家/地区
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {application.country || '未填写'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                申请时间
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDate(application.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* 申请详情 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">申请详情</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                工作经验
              </label>
              <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                {application.experience || '未填写'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                申请理由
              </label>
              <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                {application.reason || '未填写'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                技能描述
              </label>
              <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                {application.skills || '未填写'}
              </div>
            </div>
            
            {application.linkedin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LinkedIn 链接
                </label>
                <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm">
                  <a 
                    href={application.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {application.linkedin}
                  </a>
                </div>
              </div>
            )}
            
            {application.portfolio && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  作品集链接
                </label>
                <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm">
                  <a 
                    href={application.portfolio} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {application.portfolio}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 审核历史 */}
        {application.status !== 'pending' && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">审核历史</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">审核时间:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {application.reviewed_at ? formatDate(application.reviewed_at) : '未知'}
                </span>
              </div>
              {application.admin_comment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    审核意见
                  </label>
                  <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                    {application.admin_comment}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 审核操作 */}
        {application.status === 'pending' && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">审核操作</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  审核意见
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="请填写审核意见（拒绝时必填）"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            关闭
          </Button>
          
          {application.status === 'pending' && (
            <>
              <Button
                variant="danger"
                onClick={() => handleReview('reject')}
                disabled={loading}
              >
                拒绝申请
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReview('approve')}
                disabled={loading}
              >
                通过申请
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

// 管理员创作者申请审核页面
export const AdminCreatorApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();

  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // 分页大小常量
  const pageSize = 10;

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => isAdmin(), [user, isAuthenticated]);

  // 权限验证
  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!isAdminUser) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, isLoading, isAdminUser, navigate]);

  // 加载申请列表
  const loadApplications = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await adminApi.getCreatorApplications(params);
      setApplications(response.items);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load applications:', error);
      showError('加载申请列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和依赖更新时重新加载
  useEffect(() => {
    if (isAuthenticated && isAdminUser) {
      loadApplications();
    }
  }, [currentPage, statusFilter, isAuthenticated, isAdminUser]);

  // 处理查看详情
  const handleViewDetail = (application: CreatorApplication) => {
    setSelectedApplication(application);
    setIsReviewModalOpen(true);
  };

  // 处理模态框关闭
  const handleModalClose = () => {
    setIsReviewModalOpen(false);
    setSelectedApplication(null);
  };

  // 处理数据更新
  const handleDataUpdate = () => {
    loadApplications();
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待审核</Badge>;
      case 'approved':
        return <Badge variant="success">已通过</Badge>;
      case 'rejected':
        return <Badge variant="danger">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">申请审核</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              审核创作者申请，管理平台创作者准入
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">待审核申请</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {applications.filter(app => app.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">总</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">总申请数</p>
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
                <p className="text-sm font-medium text-green-800 dark:text-green-200">已通过</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {applications.filter(app => app.status === 'approved').length}
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
                <p className="text-sm font-medium text-red-800 dark:text-red-200">已拒绝</p>
                <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选和操作 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 状态筛选 */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              状态筛选:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          {/* 刷新按钮 */}
          <Button
            onClick={loadApplications}
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新数据'}
          </Button>
        </div>
      </div>

      {/* 申请列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  申请人
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  国家/地区
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  申请时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  审核时间
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
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    暂无申请数据
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {(application.user?.avatar_url || application.avatar_url) ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={application.user?.avatar_url || application.avatar_url}
                              alt={application.user?.username || application.username}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {(application.user?.username || application.username)?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {application.user?.username || application.username || '未知用户'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {application.user?.email || application.email || '未知邮箱'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {application.country || '未填写'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(application.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {application.reviewed_at ? formatDate(application.reviewed_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(application)}
                      >
                        {application.status === 'pending' ? '审核' : '查看详情'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && applications.length > 0 && (
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
                  显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
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

      {/* 申请审核模态框 */}
      <ApplicationReviewModal
        application={selectedApplication}
        isOpen={isReviewModalOpen}
        onClose={handleModalClose}
        onUpdate={handleDataUpdate}
      />
    </div>
  );
};