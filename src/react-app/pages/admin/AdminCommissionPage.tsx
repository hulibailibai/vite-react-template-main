import React, { useState, useEffect } from 'react';
import { Search, Users, Briefcase, DollarSign, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { adminApi } from '../../services/api';

// 佣金用户数据接口
interface CommissionUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  earnings_status: string;
  workflow_count: number;
  // ai_app_count removed as ai_apps table no longer exists
  total_earnings: number;
  created_at: string;
  workflows?: WorkflowItem[];
  // ai_apps removed as ai_apps table no longer exists
}

// 工作流项目接口
interface WorkflowItem {
  id: number;
  title: string;
  description: string;
  cover_image_url?: string;
  price: number;
  download_count: number;
  rating: number;
  created_at: string;
}

// AI应用项目接口已移除，因为ai_apps表不再存在
// interface AIAppItem removed

// 统计数据接口
interface CommissionStats {
  total_users: number;
  total_creators: number;
  total_workflows: number;
  // total_ai_apps removed as ai_apps table no longer exists
  total_commission_issued: number;
  pending_commission: number;
}

// 创作者详情模态框组件
interface CreatorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CommissionUser | null;
}

// 佣金发放模态框组件
interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CommissionUser | null;
  onSuccess: () => void;
}

// 创作者详情模态框组件
const CreatorDetailModal: React.FC<CreatorDetailModalProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  const handleViewItem = (type: 'workflow' | 'ai-app', id: number) => {
    const baseUrl = window.location.origin;
    const url = type === 'workflow' 
      ? `${baseUrl}/coze-workflows/${id}`
      : `${baseUrl}/ai-apps/${id}`;
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`创作者详情 - ${user.username}`} size="xl">
      <div className="space-y-6">
        {/* 创作者基本信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">基本信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div><span className="font-medium">用户名:</span> {user.username}</div>
            <div><span className="font-medium">邮箱:</span> {user.email}</div>
            <div><span className="font-medium">工作流数量:</span> {user.workflow_count}</div>
            {/* AI应用数量显示已移除，因为ai_apps表不再存在 */}
            <div><span className="font-medium">当前收益:</span> ¥{user.total_earnings.toFixed(2)}</div>
            <div><span className="font-medium">注册时间:</span> {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* 工作流列表 */}
        {user.workflows && user.workflows.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">工作流作品</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.workflows.map((workflow) => (
                <div key={workflow.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {workflow.cover_image_url && (
                      <img 
                        src={workflow.cover_image_url} 
                        alt={workflow.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 dark:text-white truncate">{workflow.title}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{workflow.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>评分: {workflow.rating}/5</span>
                          <span>下载: {workflow.download_count}</span>
                          <span>¥{workflow.price}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewItem('workflow', workflow.id)}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>查看</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI应用列表已移除，因为ai_apps表不再存在 */}

        {/* 如果没有作品 */}
        {(!user.workflows || user.workflows.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            该创作者暂无发布的作品
          </div>
        )}
      </div>
    </Modal>
  );
};

const CommissionModal: React.FC<CommissionModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
  const [whCoins, setWhCoins] = useState('');
  const [days, setDays] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !whCoins || !days) return;

    const totalCoins = parseFloat(whCoins);
    const totalDays = parseInt(days);
    
    if (totalCoins <= 0 || totalDays <= 0) {
      setError('人民币金额和天数必须大于0');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await adminApi.issueCommissionByDays({
        user_id: user.id,
        total_wh_coins: totalCoins,
        days: totalDays
      });

      if (response.success) {
        onSuccess();
        onClose();
        setWhCoins('');
        setDays('');
      } else {
        setError(response.message || '发放失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '发放失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setWhCoins('');
    setDays(''); 
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="发放佣金">
      <form onSubmit={handleSubmit} className="space-y-4">
        {user && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">创作者信息</h4>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><span className="font-medium">用户名:</span> {user.username}</p>
              <p><span className="font-medium">邮箱:</span> {user.email}</p>
              <p><span className="font-medium">工作流数量:</span> {user.workflow_count}</p>
              {/* AI应用数量已移除，因为ai_apps表不再存在 */}
              <p><span className="font-medium">当前收益:</span> ${user.total_earnings.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div>
          
          <Input
            type="number"
            step="0.01"
            min="0"
            value={whCoins}
            onChange={(e) => setWhCoins(e.target.value)}
            placeholder="请输入要发放的人民币总金额"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            系统将在指定天数内随机发放这些金额
          </p>
        </div>

        <div>
          
          <Input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="请输入发放天数（1-365天）"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            系统将在这些天数内每天随机发放
          </p>
        </div>

        {whCoins && days && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">发放预览:</span> 将在 {days} 天内发放总计 {whCoins} 元
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !whCoins || !days}
          >
            {isLoading ? '发放中...' : '确认发放'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// 主页面组件
const AdminCommissionPage: React.FC = () => {
  const [users, setUsers] = useState<CommissionUser[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('creator'); // 默认只显示创作者
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<CommissionUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await adminApi.getCommissionStats();
      setStats(response);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取用户数据
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getCommissionUsers({
        page: currentPage,
        pageSize: 20,
        search: searchTerm || undefined,
        role: selectedRole || undefined
      });
      setUsers(response.items);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('获取用户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // 打开佣金发放模态框
  const handleIssueCommission = (user: CommissionUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // 打开创作者详情模态框
  const handleViewCreatorDetail = async (user: CommissionUser) => {
    try {
      // 获取创作者的详细信息，包括作品列表
      const detailResponse = await adminApi.getCreatorDetail(user.id);
      console.log('Creator detail response:', detailResponse);
      
      const userWithDetails = {
        ...user,
        workflows: detailResponse.workflows || []
        // ai_apps removed as ai_apps table no longer exists
      };
      
      console.log('User with details:', userWithDetails);
      setSelectedUser(userWithDetails);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('获取创作者详情失败:', error);
      // 如果获取详情失败，显示基本信息但设置空的作品数组
      const userWithEmptyArrays = {
        ...user,
        workflows: [],
        ai_apps: []
      };
      setSelectedUser(userWithEmptyArrays);
      setIsDetailModalOpen(true);
    }
  };

  // 佣金发放成功后刷新数据
  const handleCommissionSuccess = () => {
    fetchUsers();
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总用户数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_users}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">创作者数量</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_creators}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">工作流总数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_workflows}</p>
              </div>
            </div>
          </Card>

          {/* AI应用总数统计卡片已移除，因为ai_apps表不再存在 */}
        </div>
      )}

      {/* 搜索和筛选 */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">所有角色</option>
              <option value="user">普通用户</option>
              <option value="creator">创作者</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <Button type="submit" className="sm:w-auto">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
        </form>
      </Card>

      {/* 用户列表 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  角色/状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  作品数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  当前收益
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          user.role === 'creator' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 text-gray-400 mr-1" />
                        <span>{user.workflow_count}</span>
                      </div>
                      {/* AI应用数量显示已移除，因为ai_apps表不再存在 */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${user.total_earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCreatorDetail(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleIssueCommission(user)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          发放佣金
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                上一页
              </Button>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                下一页
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  第 <span className="font-medium">{currentPage}</span> 页，共{' '}
                  <span className="font-medium">{totalPages}</span> 页
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="rounded-r-none"
                  >
                    上一页
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="rounded-l-none"
                  >
                    下一页
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 佣金发放模态框 */}
      <CommissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSuccess={handleCommissionSuccess}
      />

      {/* 创作者详情模态框 */}
      <CreatorDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default AdminCommissionPage;