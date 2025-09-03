import React, { useState, useEffect } from 'react';

import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  FileText,

} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';

import { useNavigate } from 'react-router-dom';

// 任务接口定义
interface AdminTask {
  id: number;
  title: string;
  description: string;
  reward: number;
  status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deadline?: string;
  max_participants?: number;
  current_participants: number;
  submission_count: number;
  approved_count: number;
  rejected_count: number;
}

// 任务详情模态框接口
interface TaskDetailModalProps {
  task: AdminTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

// 任务详情模态框组件
const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onUpdate, showError, showSuccess, showConfirm }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!task) return null;

  const handleStatusChange = async (newStatus: AdminTask['status']) => {
    const confirmed = await showConfirm(
      `确认${newStatus === 'published' ? '发布' : newStatus === 'cancelled' ? '取消' : '修改'}任务？`,
      `此操作将${newStatus === 'published' ? '发布任务，用户可以开始参与' : newStatus === 'cancelled' ? '取消任务，所有提交将被拒绝' : '修改任务状态'}`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      // TODO: 调用API更新任务状态
      // await adminApi.updateTaskStatus(task.id, newStatus);
      showSuccess('任务状态更新成功');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update task status:', error);
      showError('更新任务状态失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      '确认删除任务？',
      '此操作不可撤销，任务及所有相关提交将被永久删除'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      // TODO: 调用API删除任务
      // await adminApi.deleteTask(task.id);
      showSuccess('任务删除成功');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      showError('删除任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="任务详情">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务标题
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-semibold">{task.title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              奖励金额
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-semibold">¥{task.reward}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              当前状态
            </label>
            <Badge 
              variant={task.status === 'published' || task.status === 'active' ? 'success' : task.status === 'completed' ? 'default' : task.status === 'cancelled' ? 'error' : 'warning'}
              className="inline-flex"
            >
              {task.status === 'draft' ? '草稿' : 
               task.status === 'published' ? '已发布' : 
               task.status === 'active' ? '进行中' : 
               task.status === 'completed' ? '已完成' : '已取消'}
            </Badge>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              参与人数
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {task.current_participants}{task.max_participants ? `/${task.max_participants}` : ''}
            </p>
          </div>
        </div>

        {/* 任务描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            任务描述
          </label>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{task.description}</p>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{task.submission_count}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">总提交数</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{task.approved_count}</div>
            <div className="text-sm text-green-600 dark:text-green-400">已通过</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{task.rejected_count}</div>
            <div className="text-sm text-red-600 dark:text-red-400">已拒绝</div>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              创建时间
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{task.created_at}</p>
          </div>
          {task.deadline && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                截止时间
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{task.deadline}</p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button
            onClick={() => navigate(`/admin/tasks/${task.id}`)}
            className="flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>查看提交</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/tasks/create?edit=${task.id}`)}
            disabled={task.status === 'completed' || task.status === 'cancelled'}
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑
          </Button>

          {task.status === 'draft' && (
            <Button
              variant="primary"
              onClick={() => handleStatusChange('published')}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              发布任务
            </Button>
          )}

          {task.status === 'published' && (
            <Button
              variant="secondary"
              onClick={() => handleStatusChange('cancelled')}
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              取消任务
            </Button>
          )}

          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading || task.status === 'published'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface AdminTasksPageProps {
  defaultStatus?: string;
}

const AdminTasksPage: React.FC<AdminTasksPageProps> = ({ defaultStatus }) => {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const { isAdmin } = usePermission();
  const { showError, showSuccess, showConfirm } = useAlert();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 分页大小常量
  const pageSize = 10;

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => isAdmin(), [user, isAuthenticated]);

  // 权限验证
  useEffect(() => {
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

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // 使用真实API调用
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await adminApi.getTasks(params);
      
      // 将数据库字段映射到前端接口
      const mappedTasks: AdminTask[] = response.items.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        reward: task.reward_amount, // 数据库字段 reward_amount 映射到前端 reward
        status: task.status,
        created_at: task.created_at,
        updated_at: task.updated_at,
        deadline: task.end_date, // 数据库字段 end_date 映射到前端 deadline
        max_participants: task.max_submissions, // 数据库字段 max_submissions 映射到前端 max_participants
        current_participants: task.current_submissions || 0,
        submission_count: task.submission_count || 0,
        approved_count: task.approved_count || 0,
        rejected_count: task.rejected_count || 0
      }));
      
      setTasks(mappedTasks);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showError('加载任务列表失败，请重试');
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
    loadTasks();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  // 当搜索条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter]);

  // 获取状态图标
  const getStatusIcon = (status: AdminTask['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // 处理任务操作
  const handleTaskAction = async (taskId: number, action: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        showError('任务不存在');
        return;
      }
      
      switch (action) {
        case 'view':
          setSelectedTask(task);
          setIsDetailModalOpen(true);
          break;
        case 'edit':
          navigate(`/admin/tasks/create?edit=${taskId}`);
          break;
        case 'submissions':
          navigate(`/admin/tasks/${taskId}`);
          break;
        case 'status':
          await handleStatusChange(taskId, task);
          break;
        case 'delete':
          await handleDeleteTask(taskId, task);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Task action failed:', error);
      showError('操作失败，请重试');
    }
  };

  // 处理状态变更
  const handleStatusChange = async (taskId: number, task: AdminTask) => {
    let newStatus: string;
    let confirmMessage: string;
    
    if (task.status === 'draft') {
      newStatus = 'published';
      confirmMessage = '确定要发布这个任务吗？';
    } else if (task.status === 'published' || task.status === 'active') {
      newStatus = 'cancelled';
      confirmMessage = '确定要取消这个任务吗？';
    } else {
      showError('当前状态无法修改');
      return;
    }
    
    const confirmed = await showConfirm('确认操作', confirmMessage);
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('状态更新失败');
      }
      
      showSuccess('任务状态更新成功');
      loadTasks();
    } catch (error) {
      console.error('Status update failed:', error);
      showError('状态更新失败，请重试');
    }
  };

  // 处理删除任务
  const handleDeleteTask = async (taskId: number, task: AdminTask) => {
    const confirmed = await showConfirm(
      '确认删除', 
      `确定要删除任务"${task.title}"吗？此操作不可撤销。`
    );
    if (!confirmed) return;
    
    try {
      // 使用adminApi而不是直接fetch
      await adminApi.deleteTask(taskId);
      showSuccess('任务删除成功');
      loadTasks();
    } catch (error: any) {
      console.error('Delete failed:', error);
      
      // 处理不同类型的错误
      let errorMessage = '删除失败，请重试';
      
      if (error?.response?.data?.message) {
        // 如果后端返回了具体的错误消息
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        // 如果有错误消息
        errorMessage = error.message;
      }
      
      showError(errorMessage);
    }
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    return {
      draft: tasks.filter(task => task.status === 'draft').length,
      published: tasks.filter(task => task.status === 'published').length,
      active: tasks.filter(task => task.status === 'active').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      cancelled: tasks.filter(task => task.status === 'cancelled').length
    };
  }, [tasks]);

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {defaultStatus === 'completed' ? '已完成任务' : '任务管理'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {defaultStatus === 'completed' ? '查看已完成的任务' : '管理平台任务发放'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/tasks/create')}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="w-5 h-5" />
          <span>创建任务</span>
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">全部任务</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">草稿</p>
              <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">已发布</p>
              <p className="text-2xl font-bold text-blue-600">{stats.published}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">进行中</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">已完成</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">已取消</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="搜索任务标题或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">所有状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 任务列表 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无任务</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">还没有创建任何任务</p>
            <Button
              onClick={() => navigate('/admin/tasks/create')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建第一个任务
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    任务信息
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    奖金
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    参与情况
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    提交统计
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="max-w-xs">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {task.description}
                        </div>
                        {task.deadline && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            截止: {task.deadline}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(task.status)}
                        <Badge 
                          variant={task.status === 'published' || task.status === 'active' ? 'success' : task.status === 'completed' ? 'default' : task.status === 'cancelled' ? 'error' : 'warning'}
                        >
                          {task.status === 'draft' ? '草稿' : 
                           task.status === 'published' ? '已发布' : 
                           task.status === 'active' ? '进行中' : 
                           task.status === 'completed' ? '已完成' : '已取消'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        ¥{task.reward}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {task.current_participants}{task.max_participants ? `/${task.max_participants}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">总计: {task.submission_count}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">通过: {task.approved_count}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">拒绝: {task.rejected_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {task.created_at}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskAction(task.id, 'view')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskAction(task.id, 'edit')}
                          className="text-green-600 hover:text-green-800"
                          disabled={task.status === 'completed' || task.status === 'cancelled'}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskAction(task.id, 'status')}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          状态
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskAction(task.id, 'delete')}
                          className="text-red-600 hover:text-red-800"
                          disabled={task.status === 'published' || task.status === 'active'}
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
        )}
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            显示 {Math.min((currentPage - 1) * pageSize + 1, totalCount)} 到 {Math.min(currentPage * pageSize, totalCount)} 条，共 {totalCount} 条记录
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 任务详情模态框 */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={loadTasks}
        showError={showError}
        showSuccess={showSuccess}
        showConfirm={showConfirm}
      />
    </div>
  );
};

export default AdminTasksPage;