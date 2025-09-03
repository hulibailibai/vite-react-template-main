// 收益管理
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';
import { User, WithdrawalRequest } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatDate, formatCurrency } from '../utils/format';

// 收益详情模态框组件
interface EarningsDetailModalProps {
  creator: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const EarningsDetailModal: React.FC<EarningsDetailModalProps> = ({
  creator,
  isOpen,
  onClose
}) => {
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();

  useEffect(() => {
    if (creator && isOpen) {
      loadEarningsHistory();
    }
  }, [creator, isOpen]);

  const loadEarningsHistory = async () => {
    if (!creator) return;
    
    try {
      setLoading(true);
      // TODO: 实现获取创作者收益历史的API
      const response = await adminApi.getCreatorEarningsHistory(creator.id);
      setEarningsHistory(response.items || []);
    } catch (error) {
      console.error('Failed to load earnings history:', error);
      showError('加载收益历史失败');
      // 模拟数据
      setEarningsHistory([
        {
          id: 1,
          type: 'workflow_download',
          amount: 50.00,
          workflow_title: '数据分析工作流',
          created_at: new Date().toISOString(),
          description: '工作流下载收益'
        },
        {
          id: 2,
          type: 'ai_app_usage',
          amount: 25.00,
          ai_app_title: 'AI助手应用',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          description: 'AI应用使用收益'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!creator) return null;



  const getEarningsTypeBadge = (type: string) => {
    switch (type) {
      case 'workflow_download':
        return <Badge variant="primary">工作流</Badge>;
      case 'ai_app_usage':
        return <Badge variant="success">AI应用</Badge>;
      case 'subscription':
        return <Badge variant="warning">订阅</Badge>;
      case 'bonus':
        return <Badge variant="info">奖励</Badge>;
      default:
        return <Badge variant="secondary">其他</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${creator.username} - 收益详情`} size="lg">
      <div className="space-y-6">
        {/* 收益概览 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">收益概览</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                总收益
              </label>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(creator.total_earnings || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                当前余额
              </label>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(creator.balance || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* 收益历史 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">收益历史</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
            </div>
          ) : earningsHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无收益记录
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {earningsHistory.map((earning) => (
                <div key={earning.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getEarningsTypeBadge(earning.type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {earning.workflow_title || earning.ai_app_title || earning.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(earning.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +{formatCurrency(earning.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 提现审核模态框组件
interface WithdrawalReviewModalProps {
  withdrawal: WithdrawalRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const WithdrawalReviewModal: React.FC<WithdrawalReviewModalProps> = ({
  withdrawal,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (withdrawal) {
      setReviewComment(withdrawal.admin_comment || '');
    }
  }, [withdrawal]);

  if (!withdrawal) return null;

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewComment.trim()) {
      showAlert('拒绝提现时必须填写审核意见', 'error');
      return;
    }

    const confirmed = await showConfirm(
      `确认${action === 'approve' ? '通过' : '拒绝'}提现`,
      `确定要${action === 'approve' ? '通过' : '拒绝'}用户 "${withdrawal.user?.username}" 的提现申请吗？\n提现金额: ${formatCurrency(withdrawal.amount)}`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.reviewWithdrawalRequest(withdrawal.id, {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_comment: reviewComment.trim() || undefined
      });
      showAlert(`提现申请${action === 'approve' ? '通过' : '拒绝'}成功`, 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('审核提现申请失败:', error);
      showAlert('审核提现申请失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待审核</Badge>;
      case 'processing':
        return <Badge variant="info">处理中</Badge>;
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
      case 'failed':
        return <Badge variant="danger">失败</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">已取消</Badge>;
      // 兼容旧的状态值
      case 'approved':
        return <Badge variant="success">已通过</Badge>;
      case 'rejected':
        return <Badge variant="danger">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="提现申请审核" size="md">
      <div className="space-y-6">
        {/* 申请状态 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            申请状态
          </h3>
          {getStatusBadge(withdrawal.status)}
        </div>

        {/* 申请信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">申请信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                申请人
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {withdrawal.user?.username || '未知用户'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                提现金额
              </label>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(withdrawal.amount)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                申请时间
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatDate(withdrawal.created_at)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                提现方式
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {withdrawal.payment_method || '未知'}
              </p>
            </div>
          </div>
          
          {withdrawal.payment_details && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                收款信息
              </label>
              <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                {typeof withdrawal.payment_details === 'object' 
                  ? JSON.stringify(withdrawal.payment_details, null, 2)
                  : withdrawal.payment_details}
              </div>
            </div>
          )}
        </div>

        {/* 审核历史 */}
        {withdrawal.status !== 'pending' && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">审核历史</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">审核时间:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {withdrawal.reviewed_at ? formatDate(withdrawal.reviewed_at) : '未知'}
                </span>
              </div>
              {withdrawal.admin_comment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    审核意见
                  </label>
                  <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm text-gray-900 dark:text-white">
                    {withdrawal.admin_comment}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 审核操作 */}
        {withdrawal.status === 'pending' && (
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
                  rows={3}
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
          
          {withdrawal.status === 'pending' && (
            <>
              <Button
                variant="danger"
                onClick={() => handleReview('reject')}
                disabled={loading}
              >
                拒绝提现
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReview('approve')}
                disabled={loading}
              >
                通过提现
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

// 管理员创作者收益管理页面
export const AdminCreatorEarningsPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();

  // 根据当前路径确定默认标签页
  const getDefaultTab = (): 'earnings' | 'withdrawals' => {
    const currentPath = window.location.pathname;
    return currentPath.includes('/finance/withdrawals') ? 'withdrawals' : 'earnings';
  };

  const [creators, setCreators] = useState<User[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earnings' | 'withdrawals'>(getDefaultTab());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCreator, setSelectedCreator] = useState<User | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<string>('all');

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

  // 加载创作者收益数据
  const loadCreators = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        role: 'creator',
        status: 'active'
      };
      
      const response = await adminApi.getAllUsers(params);
      setCreators(response.items);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load creators:', error);
      showError('加载创作者数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载提现申请数据
  const loadWithdrawalRequests = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        status: withdrawalStatusFilter !== 'all' ? withdrawalStatusFilter : undefined
      };
      
      // TODO: 实现获取提现申请的API
      const response = await adminApi.getWithdrawalRequests(params);
      setWithdrawalRequests(response.items || []);
      setTotalPages(response.pagination.totalPages || 1);
      setTotalCount(response.pagination.total || 0);
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
      showError('加载提现申请失败，请重试');
      // 模拟数据
      setWithdrawalRequests([
        {
          id: 1,
          user_id: 1,
          user: { 
            id: 1, 
            username: 'creator1', 
            email: 'creator1@example.com',
            role: 'creator',
            balance: 0,
            total_earnings: 1500.00,
            wh_coins: 100,
            membership_type: 'free',
            membership_auto_renew: 0,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          amount: 500.00,
          status: 'pending',
          payment_method: '支付宝',
          payment_details: { account: 'alipay@example.com' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_at: undefined,
          admin_comment: undefined
        }
      ]);
      setTotalPages(1);
      setTotalCount(1);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和依赖更新时重新加载
  useEffect(() => {
    if (isAuthenticated && isAdminUser) {
      if (activeTab === 'earnings') {
        loadCreators();
      } else {
        loadWithdrawalRequests();
      }
    }
  }, [currentPage, activeTab, withdrawalStatusFilter, isAuthenticated, isAdminUser]);

  // 切换标签页时重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // 处理查看收益详情
  const handleViewEarnings = (creator: User) => {
    setSelectedCreator(creator);
    setIsEarningsModalOpen(true);
  };

  // 处理查看提现详情
  const handleViewWithdrawal = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsWithdrawalModalOpen(true);
  };

  // 处理模态框关闭
  const handleEarningsModalClose = () => {
    setIsEarningsModalOpen(false);
    setSelectedCreator(null);
  };

  const handleWithdrawalModalClose = () => {
    setIsWithdrawalModalOpen(false);
    setSelectedWithdrawal(null);
  };

  // 处理数据更新
  const handleDataUpdate = () => {
    if (activeTab === 'earnings') {
      loadCreators();
    } else {
      loadWithdrawalRequests();
    }
  };

  // 获取提现状态徽章
  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">待审核</Badge>;
      case 'processing':
        return <Badge variant="info">处理中</Badge>;
      case 'completed':
        return <Badge variant="success">已完成</Badge>;
      case 'failed':
        return <Badge variant="danger">失败</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">已取消</Badge>;
      // 兼容旧的状态值
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">收益管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理创作者收益和提现申请
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">¥</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">总收益</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {formatCurrency(creators.reduce((sum, creator) => sum + (creator.total_earnings || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">待提现</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {formatCurrency(creators.reduce((sum, creator) => sum + (creator.balance || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⏳</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">待审核提现</p>
                <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  {withdrawalRequests.filter(w => w.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">活跃创作者</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {creators.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('earnings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'earnings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              创作者收益
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdrawals'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              提现申请
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'earnings' ? (
            // 创作者收益标签页
            <div className="space-y-4">
              {/* 操作栏 */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  共 {totalCount} 位创作者
                </div>
                <Button onClick={loadCreators} disabled={loading}>
                  {loading ? '加载中...' : '刷新数据'}
                </Button>
              </div>

              {/* 创作者收益列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        创作者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        总收益
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        当前余额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        作品数量
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
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(creator.total_earnings || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(creator.balance || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {/* TODO: 从API获取实际的作品数量 */}
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(creator.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEarnings(creator)}
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
            </div>
          ) : (
            // 提现申请标签页
            <div className="space-y-4">
              {/* 筛选和操作栏 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    状态筛选:
                  </label>
                  <select
                    value={withdrawalStatusFilter}
                    onChange={(e) => setWithdrawalStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">全部状态</option>
                    <option value="pending">待审核</option>
                    <option value="processing">处理中</option>
                    <option value="completed">已完成</option>
                    <option value="failed">失败</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <Button onClick={loadWithdrawalRequests} disabled={loading}>
                  {loading ? '加载中...' : '刷新数据'}
                </Button>
              </div>

              {/* 提现申请列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        申请人
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        提现金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        提现方式
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        申请时间
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
                    ) : withdrawalRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          暂无提现申请
                        </td>
                      </tr>
                    ) : (
                      withdrawalRequests.map((withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {withdrawal.user?.avatar_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={withdrawal.user.avatar_url}
                                    alt={withdrawal.user.username}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {withdrawal.user?.username?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {withdrawal.user?.username || '未知用户'}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {withdrawal.user?.email || '未知邮箱'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(withdrawal.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {withdrawal.payment_method || '未知'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getWithdrawalStatusBadge(withdrawal.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(withdrawal.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewWithdrawal(withdrawal)}
                            >
                              {withdrawal.status === 'pending' ? '审核' : '查看详情'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 分页 */}
          {!loading && (activeTab === 'earnings' ? creators.length > 0 : withdrawalRequests.length > 0) && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6">
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
      </div>

      {/* 收益详情模态框 */}
      <EarningsDetailModal
        creator={selectedCreator}
        isOpen={isEarningsModalOpen}
        onClose={handleEarningsModalClose}
      />

      {/* 提现审核模态框 */}
      <WithdrawalReviewModal
        withdrawal={selectedWithdrawal}
        isOpen={isWithdrawalModalOpen}
        onClose={handleWithdrawalModalClose}
        onUpdate={handleDataUpdate}
      />
    </div>
  );
};