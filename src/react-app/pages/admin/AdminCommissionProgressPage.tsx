import React, { useState, useEffect } from 'react';

import { usePermission } from '../../hooks/usePermission';
import { useAlert } from '../../contexts/AlertContext';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../utils/format';
import {
  Search,
  Eye,


  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter
} from 'lucide-react';

// 佣金记录接口
interface CommissionRecord {
  id: number;
  user_id: number;
  username: string;
  email: string;
  admin_id: number;
  admin_username: string;
  total_rmb_amount: number;
  days: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  daily_records?: CommissionDailyRecord[];
}

// 每日佣金记录接口
interface CommissionDailyRecord {
  id: number;
  commission_record_id: number;
  day_number: number;
  rmb_amount: number;
  reason: string;
  scheduled_date: string;
  actual_date?: string;
  transaction_id?: number;
  status: 'pending' | 'completed' | 'failed';
}

// 佣金记录详情模态框属性
interface CommissionDetailModalProps {
  record: CommissionRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

// 状态配置
const statusConfig = {
  pending: {
    label: '待开始',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: <Clock className="w-4 h-4" />
  },
  in_progress: {
    label: '发放中',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: <BarChart3 className="w-4 h-4" />
  },
  completed: {
    label: '已完成',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: <CheckCircle className="w-4 h-4" />
  },
  cancelled: {
    label: '已取消',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: <XCircle className="w-4 h-4" />
  }
};

const dailyStatusConfig = {
  pending: {
    label: '待发放',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  },
  completed: {
    label: '已发放',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  failed: {
    label: '发放失败',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
};

// 佣金记录详情模态框
const CommissionDetailModal: React.FC<CommissionDetailModalProps> = ({ record, isOpen, onClose }) => {
  if (!record) return null;

  const completedDays = record.daily_records?.filter(d => d.status === 'completed').length || 0;
  const totalDays = record.days;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="佣金发放详情" size="lg">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">基本信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">用户:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{record.username}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">邮箱:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{record.email}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">总金额:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">¥{record.total_rmb_amount}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">发放天数:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{record.days}天</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDate(record.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">操作管理员:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{record.admin_username}</span>
            </div>
          </div>
        </div>

        {/* 进度信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">发放进度</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">已完成天数</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{completedDays}/{totalDays}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-600 dark:text-gray-400">{progressPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 每日发放记录 */}
        {record.daily_records && record.daily_records.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">每日发放记录</h4>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      天数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      计划日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      实际日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {record.daily_records.map((daily) => (
                    <tr key={daily.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        第{daily.day_number}天
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ¥{daily.rmb_amount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(daily.scheduled_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {daily.actual_date ? formatDate(daily.actual_date) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={dailyStatusConfig[daily.status].color}>
                          {dailyStatusConfig[daily.status].label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// 主组件
const AdminCommissionProgressPage: React.FC = () => {

  const { hasPermission } = usePermission();
  const { showAlert } = useAlert();

  // 状态管理
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 检查权限
  if (!hasPermission('admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  // 获取佣金记录列表
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/admin/commission/records?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取佣金记录失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setRecords(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(data.message || '获取佣金记录失败');
      }
    } catch (error) {
      console.error('Failed to fetch commission records:', error);
      showAlert('获取佣金记录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchRecords();
  }, [currentPage, searchTerm, statusFilter]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

  // 查看详情
  const handleViewDetail = (record: CommissionRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">佣金发放进度</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            查看和管理所有佣金发放记录的进度状态
          </p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="pending">待开始</option>
              <option value="in_progress">发放中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
        </form>
      </Card>

      {/* 佣金记录列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  佣金信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  发放进度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <BarChart3 className="mx-auto h-12 w-12 mb-4" />
                      <p>暂无佣金发放记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const completedDays = record.daily_records?.filter(d => d.status === 'completed').length || 0;
                  const progressPercentage = record.days > 0 ? (completedDays / record.days) * 100 : 0;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {record.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {record.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium">¥{record.total_rmb_amount}</div>
                          <div className="text-gray-500 dark:text-gray-400">{record.days}天发放</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{completedDays}/{record.days}</span>
                            <span className="text-gray-600 dark:text-gray-400">{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusConfig[record.status].color}>
                          {statusConfig[record.status].icon}
                          <span className="ml-1">{statusConfig[record.status].label}</span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  );
                })
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
                  显示第 <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> 到{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, records.length)}</span> 条记录
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="rounded-l-md"
                  >
                    上一页
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="rounded-r-md"
                  >
                    下一页
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 佣金记录详情模态框 */}
      <CommissionDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

export default AdminCommissionProgressPage;