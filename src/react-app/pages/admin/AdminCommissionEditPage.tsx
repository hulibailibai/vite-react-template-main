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
  Edit,
  Save,
  X,

  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Filter,

  Trash2
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

// 佣金编辑模态框属性
interface CommissionEditModalProps {
  record: CommissionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

// 佣金编辑模态框
const CommissionEditModal: React.FC<CommissionEditModalProps> = ({ record, isOpen, onClose, onSuccess }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [editedRecord, setEditedRecord] = useState<CommissionRecord | null>(null);
  const [editedDailyRecords, setEditedDailyRecords] = useState<CommissionDailyRecord[]>([]);

  // 初始化编辑数据
  useEffect(() => {
    if (record) {
      setEditedRecord({ ...record });
      setEditedDailyRecords(record.daily_records ? [...record.daily_records] : []);
    }
  }, [record]);

  if (!record || !editedRecord) return null;

  // 更新总金额
  const handleTotalAmountChange = (newAmount: number) => {
    setEditedRecord(prev => prev ? { ...prev, total_rmb_amount: newAmount } : null);
    
    // 重新分配每日金额
    if (editedDailyRecords.length > 0) {
      const avgAmount = newAmount / editedDailyRecords.length;
      const newDailyRecords = editedDailyRecords.map((daily) => {
        // 只修改未发放的记录
        if (daily.status === 'pending') {
          return { ...daily, rmb_amount: avgAmount };
        }
        return daily;
      });
      setEditedDailyRecords(newDailyRecords);
    }
  };

  // 更新单日金额
  const handleDailyAmountChange = (index: number, newAmount: number) => {
    const newDailyRecords = [...editedDailyRecords];
    newDailyRecords[index] = { ...newDailyRecords[index], rmb_amount: newAmount };
    setEditedDailyRecords(newDailyRecords);
    
    // 更新总金额
    const newTotal = newDailyRecords.reduce((sum, daily) => sum + daily.rmb_amount, 0);
    setEditedRecord(prev => prev ? { ...prev, total_rmb_amount: newTotal } : null);
  };

  // 删除未发放的每日记录
  const handleDeleteDailyRecord = (index: number) => {
    const daily = editedDailyRecords[index];
    if (daily.status !== 'pending') {
      showAlert('只能删除未发放的记录', 'error');
      return;
    }
    
    const newDailyRecords = editedDailyRecords.filter((_, i) => i !== index);
    setEditedDailyRecords(newDailyRecords);
    
    // 更新总金额和天数
    const newTotal = newDailyRecords.reduce((sum, daily) => sum + daily.rmb_amount, 0);
    setEditedRecord(prev => prev ? { 
      ...prev, 
      total_rmb_amount: newTotal,
      days: newDailyRecords.length 
    } : null);
  };

  // 保存修改
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/commission/records/${editedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          total_rmb_amount: editedRecord.total_rmb_amount,
          days: editedRecord.days,
          daily_records: editedDailyRecords
        })
      });
      
      if (!response.ok) {
        throw new Error('保存佣金修改失败');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '保存佣金修改失败');
      }
      
      showAlert('佣金记录修改成功', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update commission record:', error);
      showAlert('修改佣金记录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 取消佣金发放
  const handleCancel = async () => {
    if (!confirm('确定要取消这个佣金发放计划吗？已发放的部分不会被撤回。')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/commission/records/${editedRecord.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('取消佣金发放计划失败');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '取消佣金发放计划失败');
      }
      
      showAlert('佣金发放计划已取消', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to cancel commission record:', error);
      showAlert('取消佣金发放计划失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = record.status === 'pending' || record.status === 'in_progress';
  const completedCount = editedDailyRecords.filter(d => d.status === 'completed').length;
  const pendingCount = editedDailyRecords.filter(d => d.status === 'pending').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="编辑佣金发放" size="lg">
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
              <span className="text-gray-600 dark:text-gray-400">状态:</span>
              <Badge className={`ml-2 ${statusConfig[record.status].color}`}>
                {statusConfig[record.status].label}
              </Badge>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatDate(record.created_at)}</span>
            </div>
          </div>
        </div>

        {/* 总金额编辑 */}
        {canEdit && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">总金额设置</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  总金额 (¥)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedRecord.total_rmb_amount}
                  onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                  placeholder="请输入总金额"
                />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div>已发放: {completedCount} 天</div>
                <div>待发放: {pendingCount} 天</div>
              </div>
            </div>
          </div>
        )}

        {/* 每日发放记录编辑 */}
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
                    金额 (¥)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    计划日期
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  {canEdit && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {editedDailyRecords.map((daily, index) => (
                  <tr key={daily.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      第{daily.day_number}天
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {canEdit && daily.status === 'pending' ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={daily.rmb_amount}
                          onChange={(e) => handleDailyAmountChange(index, parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      ) : (
                        <span className="text-sm text-gray-900 dark:text-white">¥{daily.rmb_amount}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(daily.scheduled_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={dailyStatusConfig[daily.status].color}>
                        {dailyStatusConfig[daily.status].label}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        {daily.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDailyRecord(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between">
          <div>
            {canEdit && (
              <Button
                onClick={handleCancel}
                disabled={loading}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
              >
                <X className="h-4 w-4 mr-2" />
                取消发放计划
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              关闭
            </Button>
            {canEdit && (
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存修改
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 主组件
const AdminCommissionEditPage: React.FC = () => {

  const { hasPermission } = usePermission();
  const { showAlert } = useAlert();

  // 状态管理
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('editable');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  // 获取可编辑的佣金记录列表
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'editable' && statusFilter !== 'all' && { status: statusFilter }),
        ...(statusFilter === 'editable' && { editable_only: 'true' })
      });
      
      const response = await fetch(`/api/admin/commission/editable-records?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取可编辑佣金记录失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setRecords(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        throw new Error(data.message || '获取可编辑佣金记录失败');
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

  // 编辑佣金记录
  const handleEdit = async (record: CommissionRecord) => {
    if (record.status !== 'pending' && record.status !== 'in_progress') {
      showAlert('只能编辑待开始或发放中的佣金记录', 'error');
      return;
    }
    
    try {
      // 获取佣金记录详情，包括每日记录
      const response = await fetch(`/api/admin/commission/records/${record.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('获取佣金记录详情失败');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || '获取佣金记录详情失败');
      }
      
      const recordWithDailyRecords = data.data;
      
      setSelectedRecord(recordWithDailyRecords);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('获取佣金记录详情失败:', error);
      showAlert('获取佣金记录详情失败', 'error');
    }
  };

  // 编辑成功回调
  const handleEditSuccess = () => {
    fetchRecords();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">佣金金额修改</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            修改正在进行中的佣金发放计划和金额设置
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
              <option value="editable">可编辑记录</option>
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
                      <Edit className="mx-auto h-12 w-12 mb-4" />
                      <p>暂无可编辑的佣金记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const completedDays = record.daily_records?.filter(d => d.status === 'completed').length || 0;
                  const progressPercentage = record.days > 0 ? (completedDays / record.days) * 100 : 0;
                  const canEdit = record.status === 'pending' || record.status === 'in_progress';
                  
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
                          variant={canEdit ? "primary" : "outline"}
                          onClick={() => handleEdit(record)}
                          disabled={!canEdit}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {canEdit ? '编辑' : '查看'}
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

      {/* 佣金编辑模态框 */}
      <CommissionEditModal
        record={selectedRecord}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default AdminCommissionEditPage;