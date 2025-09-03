import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Save,
  Send,
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';


// 任务表单数据接口
interface TaskFormData {
  title: string;
  description: string;
  reward: number; // 前端使用reward，后端会映射到reward_amount
  deadline?: string; // 前端使用deadline，后端会映射到end_date
  submission_types: string[]; // 提交类型数组
  category?: string;
}

export const AdminTaskCreatePage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError, showSuccess, showConfirm } = useAlert();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    reward: 0,
    deadline: '',
    submission_types: ['ai_app', 'workflow'], // 默认选择两种类型
    category: ''
  });
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

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

  // 加载编辑数据
  useEffect(() => {
    if (isEditing && editId) {
      loadTaskData(editId);
    }
  }, [isEditing, editId]);

  const loadTaskData = async (taskId: string) => {
    console.log('[DEBUG] loadTaskData called with taskId:', taskId);
    try {
      setLoading(true);
      
      // 实现API调用
      const token = localStorage.getItem('auth_token');
      console.log('[DEBUG] loadTaskData - Token from localStorage:', token ? `存在 (长度: ${token.length})` : '不存在');
      
      if (!token) {
        console.error('[DEBUG] loadTaskData - No token found in localStorage');
        console.log('[DEBUG] loadTaskData - localStorage keys:', Object.keys(localStorage));
        showError('未找到认证信息，请重新登录');
        return;
      }

      console.log('[DEBUG] loadTaskData - Making GET request to:', `/api/admin/tasks/${taskId}`);
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('[DEBUG] loadTaskData - GET response status:', response.status);
      console.log('[DEBUG] loadTaskData - GET response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] loadTaskData - GET request failed with error data:', errorData);
        throw new Error(errorData.message || '加载任务数据失败');
      }
      
      const result = await response.json();
      console.log('[DEBUG] loadTaskData - GET request successful, result:', result);
      const task = result.data;
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        reward: task.reward_amount || 0, // 后端返回reward_amount，前端使用reward
        deadline: task.end_date || '', // 后端返回end_date，前端使用deadline
        submission_types: task.submission_types ? JSON.parse(task.submission_types) : ['ai_app', 'workflow'], // 解析JSON或使用默认值
        category: task.category || ''
      });
    } catch (error) {
      console.error('Failed to load task data:', error);
      
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('认证') || errorMessage.includes('登录')) {
          showError('登录状态已过期，请重新登录');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (errorMessage.includes('权限')) {
          showError('没有查看权限，请联系管理员');
        } else if (errorMessage.includes('找不到') || errorMessage.includes('不存在')) {
          showError('任务不存在或已被删除');
          navigate('/admin/tasks');
        } else {
          showError(errorMessage || '加载任务数据失败，请重试');
        }
      } else {
        showError('加载任务数据失败，请检查网络连接后重试');
      }
    } finally {
      setLoading(false);
    }
  };

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

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    } else if (formData.title.length > 100) {
      newErrors.title = '任务标题不能超过100个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入任务描述';
    } else if (formData.description.length > 1000) {
      newErrors.description = '任务描述不能超过1000个字符';
    }

    if (formData.reward <= 0) {
      (newErrors as any).reward = '奖励金额必须大于0';
    } else if (formData.reward > 10000) {
      (newErrors as any).reward = '奖励金额不能超过10000元';
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = '截止时间必须晚于当前时间';
      }
    }



    if (!formData.submission_types || formData.submission_types.length === 0) {
      (newErrors as any).submission_types = '请至少选择一种提交类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (action: 'draft' | 'publish') => {
    console.log('[DEBUG] handleSubmit called with action:', action);
    console.log('[DEBUG] Current user:', user);
    console.log('[DEBUG] Is authenticated:', isAuthenticated);
    console.log('[DEBUG] Is admin:', isAdminUser);
    
    if (!validateForm()) {
      console.log('[DEBUG] Form validation failed');
      showError('请检查表单中的错误信息');
      return;
    }

    const actionText = action === 'draft' ? '保存草稿' : '发布任务';
    const confirmed = await showConfirm(
      `确认${actionText}？`,
      action === 'publish' ? '发布后用户即可看到并参与此任务' : '任务将保存为草稿状态'
    );
    
    if (!confirmed) {
      console.log('[DEBUG] User cancelled the action');
      return;
    }

    try {
      setLoading(true);
      
      const taskData = {
        ...formData,
        submission_types: JSON.stringify(formData.submission_types), // 序列化为JSON字符串
        status: action === 'draft' ? 'draft' : 'active' // 数据库中使用'active'而不是'published'
      };
      
      console.log('[DEBUG] Task data to be sent:', taskData);
      
      // 实现API调用
      const token = localStorage.getItem('auth_token');
      console.log('[DEBUG] Token from localStorage:', token ? `存在 (长度: ${token.length})` : '不存在');
      
      if (!token) {
        console.error('[DEBUG] No token found in localStorage');
        console.log('[DEBUG] localStorage keys:', Object.keys(localStorage));
        showError('未找到认证信息，请重新登录');
        return;
      }

      if (isEditing) {
        console.log('[DEBUG] Making PUT request to update task:', editId);
        const response = await fetch(`/api/admin/tasks/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });
        
        console.log('[DEBUG] PUT response status:', response.status);
        console.log('[DEBUG] PUT response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[DEBUG] PUT request failed with error data:', errorData);
          throw new Error(errorData.message || '更新任务失败');
        }
        
        const responseData = await response.json();
        console.log('[DEBUG] PUT request successful, response data:', responseData);
      } else {
        console.log('[DEBUG] Making POST request to create task');
        const response = await fetch('/api/admin/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(taskData)
        });
        
        console.log('[DEBUG] POST response status:', response.status);
        console.log('[DEBUG] POST response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[DEBUG] POST request failed with error data:', errorData);
          throw new Error(errorData.message || '创建任务失败');
        }
        
        const responseData = await response.json();
        console.log('[DEBUG] POST request successful, response data:', responseData);
      }
      
      showSuccess(`任务${isEditing ? '更新' : '创建'}成功`);
      navigate('/admin/tasks');
    } catch (error) {
      console.error('[DEBUG] Failed to save task, error details:', error);
      console.log('[DEBUG] Error type:', typeof error);
      console.log('[DEBUG] Error constructor:', error?.constructor?.name);
      
      // 处理不同类型的错误
      if (error instanceof Error) {
        const errorMessage = error.message;
        console.log('[DEBUG] Error message:', errorMessage);
        console.log('[DEBUG] Error stack:', error.stack);
        
        // 根据错误信息提供更具体的提示
        if (errorMessage.includes('标题') || errorMessage.includes('title')) {
          console.log('[DEBUG] Title error detected');
          setErrors(prev => ({ ...prev, title: errorMessage }));
          showError('任务标题有误，请检查后重试');
        } else if (errorMessage.includes('描述') || errorMessage.includes('description')) {
          console.log('[DEBUG] Description error detected');
          setErrors(prev => ({ ...prev, description: errorMessage }));
          showError('任务描述有误，请检查后重试');
        } else if (errorMessage.includes('奖励') || errorMessage.includes('reward')) {
          console.log('[DEBUG] Reward error detected');
           setErrors(prev => ({ ...prev, reward: errorMessage as any }));
           showError('奖励金额设置有误，请检查后重试');
        } else if (errorMessage.includes('截止时间') || errorMessage.includes('deadline')) {
          console.log('[DEBUG] Deadline error detected');
          setErrors(prev => ({ ...prev, deadline: errorMessage }));
          showError('截止时间设置有误，请检查后重试');
        } else if (errorMessage.includes('认证') || errorMessage.includes('登录')) {
          console.log('[DEBUG] Authentication error detected');
          showError('登录状态已过期，请重新登录');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (errorMessage.includes('权限')) {
          console.log('[DEBUG] Permission error detected');
          showError('没有操作权限，请联系管理员');
        } else {
          console.log('[DEBUG] Generic error, showing original message');
          showError(errorMessage || `${actionText}失败，请重试`);
        }
      } else {
        console.log('[DEBUG] Non-Error type exception');
        showError(`${actionText}失败，请检查网络连接后重试`);
      }
    } finally {
      console.log('[DEBUG] Setting loading to false');
      setLoading(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof TaskFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };



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
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回任务列表
          </Button>

        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="warning" className="px-3 py-1">
            {isEditing ? '编辑模式' : '创建模式'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主要表单 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              基本信息
            </h2>
            
            <div className="space-y-6">
              {/* 任务标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任务标题 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="请输入任务标题"
                  className={`${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 字符
                </p>
              </div>

              {/* 任务描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任务描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请详细描述任务内容、目标和要求"
                  rows={4}
                  maxLength={1000}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/1000 字符
                </p>
              </div>

              {/* 奖励和截止时间 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    奖励金额 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.reward}
                      onChange={(e) => handleInputChange('reward', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      max="10000"
                      step="0.01"
                      className={`pl-10 ${errors.reward ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.reward && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.reward}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    截止时间
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className={`pl-10 ${errors.deadline ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {errors.deadline && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.deadline}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 操作面板 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              操作
            </h3>
            <div className="space-y-3">
              <Button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                variant="outline"
                className="w-full justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? '保存中...' : '保存草稿'}
              </Button>
              <Button
                onClick={() => handleSubmit('publish')}
                disabled={loading}
                className="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? '发布中...' : (isEditing ? '更新并发布' : '立即发布')}
              </Button>
            </div>
          </Card>

          {/* 预览信息 */}
          <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              预览
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">任务标题</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {formData.title || '未设置'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">奖励金额</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  ¥{formData.reward || 0}
                </div>
              </div>
              {formData.deadline && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">截止时间</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(formData.deadline).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}

            </div>
          </Card>

          {/* 帮助信息 */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              创建提示
            </h3>
            <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>任务标题要简洁明了，能够准确概括任务内容</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>任务描述要详细说明任务目标、背景和预期成果</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>奖励金额要合理，与任务难度和工作量匹配</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>参与要求要明确，避免产生歧义</div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>提交格式要具体，便于用户理解和执行</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};