import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  User,
  Calendar,
  Activity
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';

interface VideoGenerationTask {
  id: number;
  execute_id: string;
  workflow_id: string;
  token: string;
  notification_email: string;
  title?: string; // 视频任务标题
  coze_workflow_id: number;
  user_id: number;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  result_data?: any;
  error_message?: string;
  debug_url?: string; // Coze工作流调试URL
  created_at: string;
  updated_at: string;
}



const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '刚刚';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}小时前`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}天前`;
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'timeout':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running':
      return <Clock className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'failed':
      return <XCircle className="w-4 h-4" />;
    case 'timeout':
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

interface TaskDetailModalProps {
  task: VideoGenerationTask | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose }) => {
  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="视频生成任务详情">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务ID</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{task.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务标题</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{task.title || '未设置标题'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">执行ID</label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{task.execute_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工作流ID</label>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">{task.workflow_id}</p>
          </div>
          {task.debug_url && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">调试URL</label>
              <a href={task.debug_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{task.debug_url}</a>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
            <Badge className={getStatusColor(task.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(task.status)}
                {task.status}
              </div>
            </Badge>
          </div>
        </div>

        {/* 联系信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知邮箱</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{task.notification_email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户ID</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{task.user_id}</p>
          </div>
        </div>

        {/* 时间信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">创建时间</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(task.created_at).toLocaleString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">更新时间</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(task.updated_at).toLocaleString()}</p>
          </div>
        </div>

        {/* 结果数据 */}
        {task.result_data && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">结果数据</label>
            <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-xs overflow-auto max-h-40 text-gray-900 dark:text-gray-100">
              {JSON.stringify(task.result_data, null, 2)}
            </pre>
          </div>
        )}

        {/* 错误信息 */}
        {task.error_message && (
          <div>
            <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">错误信息</label>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-300">{task.error_message}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const AdminVideoTasksPage: React.FC = () => {
  const {} = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();
  
  const [tasks, setTasks] = useState<VideoGenerationTask[]>([]);
  const [loading, setLoading] = useState(true);
  // 监控服务现在是自动运行的，不需要状态管理
  const [selectedTask, setSelectedTask] = useState<VideoGenerationTask | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // 检查权限
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">访问被拒绝</h3>
          <p className="text-gray-600">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        pageSize,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await adminApi.getVideoGenerationTasks(params);
      setTasks(response.items || []);
      setTotalPages(Math.ceil((response.pagination?.total || 0) / pageSize));
    } catch (error) {
      console.error('加载视频生成任务失败:', error);
      showError('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 监控服务现在是自动运行的，不需要加载状态

  // 监控服务现在是自动启动的，不需要手动控制

  // 查看任务详情
  const viewTaskDetail = (task: VideoGenerationTask) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // 刷新任务列表
  const refreshTasks = () => {
    loadTasks();
  };

  useEffect(() => {
    loadTasks();
  }, [currentPage, statusFilter]);

  // 自动刷新任务列表（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <Button onClick={refreshTasks} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 监控服务状态 */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">监控服务状态</span>
            </div>
            <Badge className="bg-green-100 text-green-800">
              自动运行中
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>系统自动启动</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          监控服务已设置为自动启动，每10秒检查运行中的任务状态并发送邮件通知
        </p>
      </Card>

      {/* 筛选器 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">状态筛选:</span>
          <div className="flex gap-2">
            {[
              { value: 'all', label: '全部' },
              { value: 'running', label: '运行中' },
              { value: 'completed', label: '已完成' },
              { value: 'failed', label: '失败' },
              { value: 'timeout', label: '超时' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 任务列表 */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">任务列表</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">暂无任务数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{task.title || `任务 #${task.id}`}</span>
                        <Badge className={getStatusColor(task.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            {task.status}
                          </div>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          用户ID: {task.user_id}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {task.notification_email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(task.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          执行ID: {task.execute_id.slice(0, 8)}...
                        </div>
                      </div>
                      
                      {task.error_message && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                          错误: {task.error_message}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => viewTaskDetail(task)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        详情
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  上一页
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 任务详情模态框 */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
      />
    </div>
  );
};