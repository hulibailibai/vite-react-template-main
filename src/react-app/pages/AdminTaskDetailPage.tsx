import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  User,
  MessageSquare,

} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';


// 任务详情接口定义
interface TaskDetail {
  id: number;
  title: string;
  description: string;
  reward_amount: number;
  current_participants: number;
  submission_format: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  end_date: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  creator_name: string;
  category?: string;
}

// 任务提交接口定义
interface TaskSubmission {
  id: number;
  user_id: number;
  username: string;
  user_avatar?: string;
  content: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_comment?: string;
}

export const AdminTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError, showSuccess, showConfirm } = useAlert();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => isAdmin(), [user, isAuthenticated]);

  // 权限验证
  useEffect(() => {
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

  // 加载任务详情
  const loadTaskDetail = async () => {
    if (!taskId) {
      showError('任务ID无效');
      navigate('/admin/tasks');
      return;
    }

    try {
      setLoading(true);
      
      // 使用真实API调用
      const response = await adminApi.getTaskDetail(parseInt(taskId));
      
      // 将数据库字段映射到前端接口
      const mappedTask: TaskDetail = {
        id: response.id,
        title: response.title,
        description: response.description,
        reward_amount: response.reward_amount,
        // max_participants字段已删除
        current_participants: response.current_submissions || 0,
        // requirements字段已移除
        submission_format: response.submission_format || '文字描述',
        status: response.status,
        // deadline字段已删除，直接使用end_date
        end_date: response.end_date,
        created_at: response.created_at,
        updated_at: response.updated_at,
        created_by: response.created_by,
        creator_name: response.creator_name || 'admin'
      };
      
      setTask(mappedTask);
    } catch (error) {
      console.error('Failed to load task detail:', error);
      showError('加载任务详情失败，请重试');
      navigate('/admin/tasks');
    } finally {
      setLoading(false);
    }
  };

  // 加载任务提交
  const loadTaskSubmissions = async () => {
    if (!taskId) return;

    try {
      setSubmissionsLoading(true);
      
      // 使用真实API调用
      const response = await adminApi.getTaskSubmissions({ task_id: parseInt(taskId) });
      
      // 将数据库字段映射到前端接口
      const mappedSubmissions: TaskSubmission[] = response.items.map((submission: any) => ({
        id: submission.id,
        user_id: submission.user_id,
        username: submission.username || `用户${submission.user_id}`,
        user_avatar: submission.user_avatar,
        content: submission.content,
        attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
        status: submission.status,
        submitted_at: submission.submitted_at,
        reviewed_at: submission.reviewed_at,
        reviewer_comment: submission.reviewer_comment
      }));
      
      setSubmissions(mappedSubmissions);
    } catch (error) {
      console.error('Failed to load task submissions:', error);
      showError('加载任务提交失败，请重试');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    loadTaskDetail();
  }, [taskId]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadTaskSubmissions();
    }
  }, [activeTab, taskId]);

  // 获取状态颜色和图标
  const getStatusInfo = (status: TaskDetail['status']) => {
    switch (status) {
      case 'draft':
        return { color: 'gray', icon: <FileText className="w-4 h-4" />, text: '草稿' };
      case 'active':
        return { color: 'blue', icon: <CheckCircle className="w-4 h-4" />, text: '进行中' };
      case 'completed':
        return { color: 'green', icon: <CheckCircle className="w-4 h-4" />, text: '已完成' };
      case 'cancelled':
        return { color: 'red', icon: <XCircle className="w-4 h-4" />, text: '已取消' };
      default:
        return { color: 'gray', icon: <AlertCircle className="w-4 h-4" />, text: '未知' };
    }
  };

  // 获取提交状态图标
  const getSubmissionStatusIcon = (status: TaskSubmission['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // 删除任务
  const handleDeleteTask = async () => {
    if (!task) return;

    const confirmed = await showConfirm(
      '确认删除任务？',
      '删除后任务及所有相关提交将无法恢复，请谨慎操作。'
    );
    
    if (!confirmed) return;

    try {
      // 调用API删除任务
      await adminApi.deleteTask(task.id);
      
      showSuccess('任务删除成功');
      navigate('/admin/tasks');
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      
      // 处理不同类型的错误
      let errorMessage = '删除任务失败，请重试';
      
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

  // 更新任务状态
  const handleUpdateTaskStatus = async (newStatus: TaskDetail['status']) => {
    if (!task) return;

    try {
      // TODO: 调用API更新任务状态
      // await adminApi.updateTaskStatus(task.id, newStatus);
      
      setTask({ ...task, status: newStatus });
      showSuccess('任务状态更新成功');
    } catch (error) {
      console.error('Failed to update task status:', error);
      showError('更新任务状态失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载任务详情中...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">任务不存在</h3>
          <p className="text-gray-600 mb-4">请检查任务ID是否正确</p>
          <Button onClick={() => navigate('/admin/tasks')}>返回任务列表</Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(task.status);

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tasks')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              任务详情
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              任务ID: {task.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/tasks/${task.id}/edit`)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4 mr-2" />
            编辑任务
          </Button>
          <Button
            variant="danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除任务
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            任务详情
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={clsx(
              'py-2 px-1 border-b-2 font-medium text-sm',
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            提交记录 ({task.current_participants})
          </button>
        </nav>
      </div>

      {/* 任务详情标签页 */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {task.title}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {statusInfo.icon}
                      <Badge variant={statusInfo.color as any}>
                        {statusInfo.text}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      创建时间: {task.created_at}
                    </div>
                  </div>
                </div>
                {task.status === 'active' && (
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateTaskStatus('completed')}
                    >
                      标记完成
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateTaskStatus('cancelled')}
                    >
                      取消任务
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    任务描述
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                </div>
                

                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    提交格式
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white">
                      {task.submission_format}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 侧边栏信息 */}
          <div className="space-y-6">
            {/* 任务统计 */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                任务统计
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">奖励金额</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ¥{task.reward_amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">参与人数</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.current_participants}人参与
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">截止时间</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.end_date}
                  </span>
                </div>
              </div>
            </Card>

            {/* 创建信息 */}
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                创建信息
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">创建者</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.creator_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">创建时间</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.created_at}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">最后更新</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {task.updated_at}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 提交记录标签页 */}
      {activeTab === 'submissions' && (
        <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl overflow-hidden">
          {submissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无提交</h3>
              <p className="text-gray-600 dark:text-gray-400">还没有用户提交此任务</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      提交用户
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      提交内容
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      提交时间
                    </th>
                    <th className="px-8 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {submission.user_avatar ? (
                            <img src={submission.user_avatar} alt={submission.username} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {submission.username}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {submission.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 dark:text-white truncate">
                            {submission.content.substring(0, 100)}...
                          </div>
                          {submission.attachments && submission.attachments.length > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {submission.attachments.length} 个附件
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getSubmissionStatusIcon(submission.status)}
                          <Badge 
                            variant={submission.status === 'approved' ? 'success' : submission.status === 'rejected' ? 'error' : 'warning'}
                          >
                            {submission.status === 'pending' ? '待审核' : 
                             submission.status === 'approved' ? '已通过' : '已拒绝'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {submission.submitted_at}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/task-submissions?task_id=${task.id}&submission_id=${submission.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* 删除确认模态框 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="确认删除任务"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gray-900 dark:text-white">
                您确定要删除任务 <strong>"{task.title}"</strong> 吗？
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                删除后任务及所有相关提交将无法恢复，请谨慎操作。
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setIsDeleteModalOpen(false);
                handleDeleteTask();
              }}
            >
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};