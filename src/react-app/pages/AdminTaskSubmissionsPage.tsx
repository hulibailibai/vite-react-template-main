import React, { useState, useEffect } from 'react';

import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Play,
  FileText,
  Download,
  MessageSquare,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import api, { adminApi } from '../services/api';


// 审核步骤定义
interface ReviewStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  rejectionReason?: string;
}

// 任务提交接口定义
interface TaskSubmission {
  id: number;
  task_id: number;
  task_title: string;
  user_id: number;
  username: string;
  user_avatar?: string;
  content: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
  reviewer_comment?: string;
  reward_amount: number;
  review_steps?: ReviewStep[];
  // 新增字段
  title?: string;
  description?: string;
  category?: string;
  category_id?: number;
  category_name?: string;
  tags?: string[];
  cover_image?: string;
  preview_video?: string;
  workflow_file?: string;
  coze_api_code?: string;
  // 用户指定的新字段
  preview_video_url?: string;
  preview_images?: string[];
  workflow_file_url?: string;
  workflow_file_name?: string;
  workflow_file_size?: number;
  coze_api?: string;
  submission_type?: 'workflow_submission' | 'task_submission';
  workflow_id?: number; // 关联的工作流ID
  // 价格相关字段
  price?: number; // 运行价格
  download_price?: number; // 下载价格
  is_run_member_free?: boolean; // 运行会员免费
  is_download_member_free?: boolean; // 下载会员免费
  is_member_free?: boolean; // 后端返回的运行会员免费字段
}

// 格式化时间函数
const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    // 如果是今天
    if (diffInMinutes < 1440 && date.toDateString() === now.toDateString()) {
      if (diffInMinutes < 1) return '刚刚';
      if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}小时前`;
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 其他情况显示完整日期时间
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

// 提交详情模态框接口
interface SubmissionDetailModalProps {
  submission: TaskSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 分步骤审核模态框接口
interface StepReviewModalProps {
  submission: TaskSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 拒绝理由选择模态框接口
interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasons: string[]) => void;
  stepId: string;
  stepName: string;
}

// 提交详情模态框组件
const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ submission, isOpen, onClose, onUpdate }) => {
  const { showError, showSuccess, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [_reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (submission) {
      setReviewComment(submission.reviewer_comment || '');
      setReviewAction(null);
    }
  }, [submission]);

  if (!submission) return null;

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewComment.trim()) {
      showError('拒绝提交时必须填写审核意见');
      return;
    }

    const confirmed = await showConfirm(
      `确认${action === 'approve' ? '通过' : '拒绝'}此提交？`,
      action === 'approve' 
        ? `通过后将向用户发放 ¥${submission.reward_amount} 奖励` 
        : '拒绝后用户将收到审核意见通知'
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      // TODO: 调用API审核提交
      // await adminApi.reviewSubmission(submission.id, {
      //   status: action === 'approve' ? 'approved' : 'rejected',
      //   comment: reviewComment
      // });
      
      showSuccess(`提交${action === 'approve' ? '通过' : '拒绝'}成功`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to review submission:', error);
      showError('审核失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="提交详情" size="lg">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务标题
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-semibold">{submission.task_title}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提交用户
            </label>
            <div className="flex items-center space-x-2">
              {submission.user_avatar ? (
                <img src={submission.user_avatar} alt={submission.username} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-sm text-gray-900 dark:text-white font-semibold">{submission.username}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提交时间
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{formatDateTime(submission.created_at)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              奖励金额
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-semibold">¥{submission.reward_amount}</p>
          </div>
        </div>

        {/* 当前状态 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            当前状态
          </label>
          <Badge 
            variant={submission.status === 'approved' ? 'success' : submission.status === 'rejected' ? 'error' : 'warning'}
            className="inline-flex"
          >
            {submission.status === 'pending' ? '待审核' : 
             submission.status === 'approved' ? '已通过' : '已拒绝'}
          </Badge>
        </div>

        {/* 提交内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            提交内容
          </label>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{submission.content}</p>
          </div>
        </div>

        {/* 附件 */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              附件
            </label>
            <div className="space-y-2">
              {submission.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white flex-1">{attachment}</span>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 审核意见 */}
        {submission.status === 'pending' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              审核意见
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请填写审核意见（拒绝时必填）"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>
        ) : (
          submission.reviewer_comment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                审核意见
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{submission.reviewer_comment}</p>
              </div>
              {submission.reviewed_at && (
                <p className="text-xs text-gray-500 mt-2">审核时间: {formatDateTime(submission.reviewed_at)}</p>
              )}
            </div>
          )
        )}

        {/* 操作按钮 */}
        {submission.status === 'pending' && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="danger"
              onClick={() => handleReview('reject')}
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              拒绝
            </Button>
            <Button
              variant="primary"
              onClick={() => handleReview('approve')}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              通过
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

// 拒绝理由选择模态框组件
const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stepId,
  stepName
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const getRejectionOptions = (stepId: string): string[] => {
    switch (stepId) {
      case 'basic_info_check':
        return [
          '标题不符合规范或过于简单',
          '分类选择错误或不准确',
          '描述内容不完整或不清晰',
          '封面图片不符合要求或质量过低',
          '预览视频缺失或质量不佳',
          '内容涉及违规或敏感信息'
        ];
      case 'workflow_file_check':
        return [
          '工作流文件缺失或无法下载',
          '文件格式不正确或损坏',
          '工作流配置不完整',
          '文件包含恶意代码或病毒',
          '工作流逻辑错误或无法运行',
          '文件大小超出限制'
        ];
      case 'coze_api_test':
        return [
          'API接口调用失败',
          'API密钥无效或过期',
          '代码存在语法错误',
          '接口返回数据格式错误',
          '功能测试未通过',
          'API调用频率超出限制'
        ];
      case 'final_approval':
        return [
          '整体质量不达标',
          '用户信誉度不足',
          '违反平台规则',
          '存在版权问题',
          '功能重复或价值不高',
          '其他综合因素'
        ];
      default:
        return ['审核未通过'];
    }
  };

  const handleConfirm = () => {
    if (selectedReasons.length === 0) {
      return;
    }
    onConfirm(selectedReasons);
    setSelectedReasons([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedReasons([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`拒绝理由 - ${stepName}`} size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          请选择拒绝此步骤的理由（可多选）：
        </p>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {getRejectionOptions(stepId).map((reason, index) => (
            <label key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedReasons(prev => [...prev, reason]);
                  } else {
                    setSelectedReasons(prev => prev.filter(r => r !== reason));
                  }
                }}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-900 dark:text-white flex-1">{reason}</span>
            </label>
          ))}
        </div>

        {selectedReasons.length > 0 && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">已选择的拒绝理由：</p>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {selectedReasons.map((reason, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm}
            disabled={selectedReasons.length === 0}
          >
            确认拒绝
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 分步骤审核模态框组件
const StepReviewModal: React.FC<StepReviewModalProps> = ({ submission, isOpen, onClose, onUpdate }) => {
  const { showError, showSuccess, showConfirm } = useAlert();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [reviewSteps, setReviewSteps] = useState<ReviewStep[]>([]);
  const [adminServerUrl, setAdminServerUrl] = useState<string>('');
  const [apiParameters, setApiParameters] = useState<{[key: string]: string}>({});
  const [testInputs, setTestInputs] = useState<{[key: string]: string}>({});
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState<string>('');

  // 获取管理员测试服务器URL
  const fetchAdminServerUrl = async () => {
    try {
      const response = await adminApi.getServers({
        search: '管理员测试服务器'
      });
      const adminServer = response.items.find((server: any) => 
        server.description === '管理员测试服务器'
      );
      if (adminServer) {
        setAdminServerUrl(adminServer.url);
      }
    } catch (error) {
      console.error('获取管理员测试服务器URL失败:', error);
    }
  };

  // 解析API参数
  const parseApiParameters = (cozeApiCode: string) => {
    try {
      // 查找parameters对象
      const parametersMatch = cozeApiCode.match(/parameters\s*:\s*\{([^}]+)\}/);
      if (parametersMatch) {
        const parametersStr = parametersMatch[1];
        const params: {[key: string]: string} = {};
        
        // 提取参数键值对，排除api_token
        const paramMatches = parametersStr.match(/(\w+)\s*:\s*([^,}]+)/g);
        if (paramMatches) {
          paramMatches.forEach(match => {
            const [key, value] = match.split(':').map(s => s.trim());
            if (key !== 'api_token') {
              params[key] = value.replace(/["']/g, ''); // 移除引号
            }
          });
        }
        
        setApiParameters(params);
        
        // 初始化测试输入
        const initialInputs: {[key: string]: string} = {};
        Object.keys(params).forEach(key => {
          initialInputs[key] = params[key] || '';
        });
        setTestInputs(initialInputs);
      }
    } catch (error) {
      console.error('解析API参数失败:', error);
    }
  };

  // 初始化审核步骤
  useEffect(() => {
    if (submission && isOpen) {
      const defaultSteps: ReviewStep[] = [
        {
          id: 'basic_info_check',
          name: '基础信息审核',
          description: '审核提交的标题、分类、描述、封面和预览视频是否符合要求',
          status: 'pending'
        },
        {
          id: 'workflow_file_check',
          name: '工作流文件审核',
          description: '下载并检查工作流文件是否完整、格式正确，功能是否正常',
          status: 'pending'
        },
        {
          id: 'coze_api_test',
          name: 'Coze API测试',
          description: '测试coze_api代码是否能正常运行，接口调用是否成功',
          status: 'pending'
        },
        {
          id: 'final_approval',
          name: '最终审核通过',
          description: '综合评估通过，设置coze工作流为在线状态并发放奖励',
          status: 'pending'
        }
      ];
      
      setReviewSteps(submission.review_steps || defaultSteps);
      setCurrentStepIndex(0);
      
      // 获取管理员服务器URL
      fetchAdminServerUrl();
      
      // 解析API参数
      if (submission.coze_api) {
        parseApiParameters(submission.coze_api);
      }
      
      // 设置默认邮箱为当前用户邮箱
      if (user?.email) {
        setNotificationEmail(user.email);
      }
    }
  }, [submission, isOpen, user]);

  if (!submission) return null;

  const currentStep = reviewSteps[currentStepIndex];
  const isLastStep = currentStepIndex === reviewSteps.length - 1;

  // 如果当前步骤不存在，返回null
  if (!currentStep) return null;

  // 处理步骤审核
  const handleStepReview = async (action: 'approve' | 'reject', rejectionReasons?: string[]) => {
    const confirmed = await showConfirm(
      `确认${action === 'approve' ? '通过' : '拒绝'}此步骤？`,
      action === 'approve' 
        ? `通过"${currentStep?.name || '当前'}"审核步骤` 
        : `拒绝"${currentStep?.name || '当前'}"审核步骤，理由：${rejectionReasons?.join('；') || ''}`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      
      // 更新当前步骤状态
      const updatedSteps = [...reviewSteps];
      updatedSteps[currentStepIndex] = {
        ...currentStep,
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? rejectionReasons?.join('；') : undefined
      };
      
      setReviewSteps(updatedSteps);
      
      if (action === 'reject') {
        // 如果拒绝，直接结束审核流程
        // TODO: 调用API更新提交状态为拒绝
        // await adminApi.reviewSubmission(submission.id, {
        //   status: 'rejected',
        //   comment: `在"${currentStep?.name || '当前'}"步骤被拒绝：${rejectionReasons?.join('；') || ''}`,
        //   review_steps: updatedSteps
        // });
        
        showSuccess(`提交已在"${currentStep?.name || '当前'}"步骤被拒绝`);
        onUpdate();
        onClose();
      } else if (isLastStep) {
        // 如果是最后一步且通过，完成整个审核并设置工作流为在线状态
        try {
          // 调用API更新任务和领取状态，并更新coze工作流状态、用户余额和交易记录
          const result = await adminApi.approveSubmissionWithRewards({
            submission_id: submission.id,
            workflow_id: submission.workflow_id || submission.id, // 使用workflow_id或submission.id作为fallback
            user_id: submission.user_id,
            reward_amount: submission.reward_amount || 0,
            comment: '所有审核步骤均已通过，coze工作流已设置为在线状态，任务佣金已发放'
          });
          
          if (result.success) {
            showSuccess(`提交审核完成，已通过所有步骤！coze工作流已设置为在线状态，用户已获得 ${submission.reward_amount || 0} 佣金奖励，当前余额：${result.new_balance}`);
          } else {
            showError(`审核处理失败：${result.message}`);
            return;
          }
        } catch (error) {
          console.error('Failed to approve submission with rewards:', error);
          showError('审核通过处理失败，请重试');
          return;
        }
        
        onUpdate();
        onClose();
      } else {
        // 进入下一步
        setCurrentStepIndex(prev => prev + 1);
        showSuccess(`"${currentStep?.name || '当前'}"步骤审核通过，进入下一步`);
      }
    } catch (error) {
      console.error('Failed to review step:', error);
      showError('审核失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回上一步
  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // 处理拒绝理由确认
  const handleRejectionConfirm = (reasons: string[]) => {
    handleStepReview('reject', reasons);
  };

  // 处理拒绝按钮点击
  const handleRejectClick = () => {
    setShowRejectionModal(true);
  };

  // 处理试运行测试
  const handleTestRun = async () => {
    if (!submission?.coze_api || !adminServerUrl) {
      showError('缺少必要的API代码或服务器URL');
      return;
    }

    try {
      setTestLoading(true);
      setTestResult('');

      // 从API代码中提取Authorization token
      const authMatch = submission.coze_api.match(/Authorization:\s*Bearer\s+([^\s\\]+)/);
      if (!authMatch) {
        throw new Error('无法从API代码中提取Authorization token');
      }
      const authToken = authMatch[1];

      // 替换API代码中的ai757为管理员服务器URL
      let modifiedApiCode = submission.coze_api.replace(/ai757/g, adminServerUrl);

      // 构建请求参数
      const requestParams: {[key: string]: any} = {
        api_token: adminServerUrl
      };

      // 添加用户输入的参数
      Object.keys(testInputs).forEach(key => {
        if (testInputs[key].trim()) {
          requestParams[key] = testInputs[key].trim();
        }
      });

      // 解析API代码中的工作流ID和其他配置
      let workflowId = '';
      
      // 尝试从URL中提取工作流ID（支持workflow和workflows两种格式）
      const workflowUrlMatch = modifiedApiCode.match(/\/v1\/(workflow|workflows)\/(\w+)\/run/);
      if (workflowUrlMatch) {
        workflowId = workflowUrlMatch[2];
      } else {
        // 尝试从JSON数据中提取workflow_id
        const workflowIdJsonMatch = modifiedApiCode.match(/workflow_id\s*:\s*(\d+)/);
        if (workflowIdJsonMatch) {
          workflowId = workflowIdJsonMatch[1];
        } else {
          throw new Error('无法从API代码中提取工作流ID，请检查API代码格式是否正确');
        }
      }
      
      if (!workflowId) {
        throw new Error('工作流ID为空，请检查API代码');
      }

      // 发送测试请求
      const response = await fetch(`https://api.coze.cn/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          parameters: requestParams,
          is_async: true
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult(`测试成功！\n\n响应数据：\n${JSON.stringify(result, null, 2)}`);
        
        // 测试成功后，创建视频生成任务
        if (result.execute_id && workflowId) {
          try {
            await adminApi.createVideoGenerationTask({
              execute_id: result.execute_id,
              workflow_id: workflowId,
              token: authToken,
              notification_email: notificationEmail,
              title: submission.title || submission.task_title || '视频生成任务', // 添加标题字段
              coze_workflow_id: submission.id, // 使用coze_workflows表中的id
              user_id: submission.user_id,
              debug_url: result.debug_url // 添加debug_url字段
            });
            
            showSuccess('视频生成任务已创建，系统将自动监控任务进度');
          } catch (taskError) {
            console.error('创建视频生成任务失败:', taskError);
            showError('视频生成任务创建失败，但API测试成功');
          }
        }
      } else {
        setTestResult(`测试失败！\n\n错误信息：\n${JSON.stringify(result, null, 2)}`);
      }
    } catch (error: any) {
      console.error('API测试失败:', error);
      setTestResult(`测试失败！\n\n错误信息：\n${error.message || '未知错误'}`);
    } finally {
      setTestLoading(false);
    }
  };

  // 更新测试输入
  const updateTestInput = (key: string, value: string) => {
    setTestInputs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分步骤审核" size="xl">
      <div className="space-y-6">
        {/* 提交基本信息 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">任务：</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-1">{submission.task_title}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">用户：</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-1">{submission.username}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">奖励：</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-1">¥{submission.reward_amount}</span>
            </div>
          </div>
        </div>

        {/* 审核步骤进度 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">审核进度</h3>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {reviewSteps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-2 flex-shrink-0">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  index === currentStepIndex 
                    ? 'bg-blue-600 text-white' 
                    : step.status === 'approved' 
                    ? 'bg-green-500 text-white' 
                    : step.status === 'rejected' 
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.status === 'approved' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step.status === 'rejected' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  index === currentStepIndex 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : step.status === 'approved' 
                    ? 'text-green-600 dark:text-green-400' 
                    : step.status === 'rejected' 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.name}
                </span>
                {index < reviewSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 当前步骤详情 */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{currentStep?.name || '审核步骤'}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{currentStep?.description || '正在加载审核步骤...'}</p>
            </div>
          </div>

          {/* 审核内容预览 */}
          <div className="space-y-4">
            {/* 基础信息审核 - 显示标题、描述、预览图片、预览视频 */}
            {currentStep?.id === 'basic_info_check' && (
              <>
                {/* 标题 */}
                {submission.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      标题
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">{submission.title}</p>
                    </div>
                  </div>
                )}

                {/* 描述 */}
                {submission.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      描述
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{submission.description}</p>
                    </div>
                  </div>
                )}

                {/* 分类信息 */}
                {(submission.category_name || submission.category_id) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      分类
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-900 dark:text-white font-semibold">
                        {submission.category_name || `分类ID: ${submission.category_id}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 标签信息 */}
                {submission.tags && submission.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      标签
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {submission.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}



                {/* 预览图片 */}
                {submission.preview_images && submission.preview_images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      预览图片
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {submission.preview_images.map((image, index) => (
                        <div key={index} className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img 
                            src={image} 
                            alt={`预览图片 ${index + 1}`} 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(image, '_blank')}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-sm">图片加载失败</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 预览视频 */}
                {submission.preview_video_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      预览视频
                    </label>
                    <div className="w-full max-w-md h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <video 
                        src={submission.preview_video_url} 
                        controls 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Play className="w-8 h-8 mb-2" />
                        <span className="text-sm">视频加载失败</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 价格设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    价格设置
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 运行价格 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">运行价格</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {submission.price !== undefined ? `¥${submission.price}` : '未设置'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">运行会员免费</span>
                          <Badge 
                            variant={submission.is_run_member_free ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {submission.is_run_member_free ? '是' : '否'}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* 下载价格 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">下载价格</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {submission.download_price !== undefined ? `¥${submission.download_price}` : '未设置'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">下载会员免费</span>
                          <Badge 
                            variant={submission.is_download_member_free ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {submission.is_download_member_free ? '是' : '否'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 工作流文件审核 */}
            {currentStep?.id === 'workflow_file_check' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  工作流文件信息
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {submission.workflow_file_name || '工作流文件'}
                      </p>
                      {submission.workflow_file_size && (
                        <p className="text-xs text-gray-500">
                          文件大小: {(submission.workflow_file_size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    {submission.workflow_file_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-800"
onClick={async () => {
                          if (submission.workflow_file_url) {
                            try {
                              // 对于workflow_submission类型，使用专门的下载API
                              if (submission.submission_type === 'workflow_submission') {
                                const response = await api.cozeWorkflow.downloadCozeWorkflow(submission.id);
                                
                                if (response.success && response.download_url) {
                                  // 创建临时下载链接
                                  const link = document.createElement('a');
                                  link.href = response.download_url;
                                  link.download = response.filename || submission.workflow_file_name || 'workflow.zip';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  console.error('下载失败:', response.message || '未知错误');
                                }
                              } else {
                                // 普通文件下载，构建完整的文件下载URL
                                const fileUrl = submission.workflow_file_url.startsWith('http') 
                                  ? submission.workflow_file_url 
                                  : `${window.location.origin}${submission.workflow_file_url}`;
                                
                                // 创建临时下载链接
                                const link = document.createElement('a');
                                link.href = fileUrl;
                                link.download = submission.workflow_file_name || 'workflow.zip';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            } catch (error) {
                              console.error('下载失败:', error);
                            }
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    )}
                  </div>
                  {submission.workflow_file_url && (
                    <div className="text-xs text-gray-500 break-all">
                      <span className="font-medium">文件链接: </span>
                      <a 
                        href={submission.workflow_file_url && submission.workflow_file_url.startsWith('http') 
                          ? submission.workflow_file_url 
                          : `${window.location.origin}${submission.workflow_file_url || ''}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {submission.workflow_file_url && submission.workflow_file_url.startsWith('http') 
                          ? submission.workflow_file_url 
                          : `${window.location.origin}${submission.workflow_file_url || ''}`}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coze API测试 */}
            {currentStep?.id === 'coze_api_test' && (
              <div className="space-y-4">
                {submission.coze_api && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Coze API代码
                    </label>
                    <div className="bg-gray-900 rounded-lg p-4 max-h-60 overflow-y-auto">
                      <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        <code>{submission.coze_api}</code>
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* API测试区域 */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API测试
                  </label>
                  
                  {/* 服务器URL显示 */}
                  {adminServerUrl && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          管理员测试服务器: {adminServerUrl}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 输入区域 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        测试参数 ({Object.keys(apiParameters).length} 个参数)
                      </label>
                      
                      {Object.keys(apiParameters).length > 0 ? (
                        <div className="space-y-3">
                          {Object.keys(apiParameters).map((paramKey) => (
                            <div key={paramKey}>
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {paramKey}
                              </label>
                              <input
                                type="text"
                                value={testInputs[paramKey] || ''}
                                onChange={(e) => updateTestInput(paramKey, e.target.value)}
                                placeholder={`请输入${paramKey}的值...`}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                          未检测到API参数，或参数解析失败
                        </div>
                      )}
                      
                      {/* 通知邮箱输入框 */}
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          通知邮箱
                        </label>
                        <input
                          type="email"
                          value={notificationEmail}
                          onChange={(e) => setNotificationEmail(e.target.value)}
                          placeholder="请输入接收视频生成任务消息的邮箱"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">用于接收视频生成任务的消息通知，默认为当前用户邮箱</p>
                      </div>
                      
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="mt-3 w-full"
                        disabled={testLoading || !adminServerUrl}
                        onClick={handleTestRun}
                      >
                        {testLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            测试中...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            试运行
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* 输出区域 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        运行结果
                      </label>
                      <div className="w-full h-64 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white overflow-y-auto">
                        {testResult ? (
                          <pre className="whitespace-pre-wrap text-xs">{testResult}</pre>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">等待运行结果...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 通用提交内容 */}
            {currentStep?.id !== 'basic_info_check' && currentStep?.id !== 'workflow_file_check' && currentStep?.id !== 'coze_api_test' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  提交内容
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{submission.content}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={loading}
              >
                上一步
              </Button>
            )}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="danger"
              onClick={handleRejectClick}
              disabled={loading}
            >
              <XCircle className="w-4 h-4 mr-2" />
              拒绝
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStepReview('approve')}
              disabled={loading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isLastStep ? '完成审核' : '通过此步骤'}
            </Button>
          </div>
        </div>
      </div>

      {/* 拒绝理由选择模态框 */}
      <RejectionReasonModal
        isOpen={showRejectionModal}
        onClose={() => setShowRejectionModal(false)}
        onConfirm={handleRejectionConfirm}
        stepId={currentStep?.id || ''}
        stepName={currentStep?.name || ''}
      />
    </Modal>
  );
};

export const AdminTaskSubmissionsPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();

  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStepReviewModalOpen, setIsStepReviewModalOpen] = useState(false);

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

  // 加载提交列表
  const loadSubmissions = async () => {
    try {
      setLoading(true);
      
      // 使用真实API调用
      const params = {
        page: currentPage,
        pageSize,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        task_id: taskFilter !== 'all' ? parseInt(taskFilter) : undefined
      };
      
      const response = await adminApi.getTaskSubmissions(params);
      
      // 将数据库字段映射到前端接口
      const mappedSubmissions: TaskSubmission[] = response.items.map((submission: any) => ({
        id: submission.id,
        task_id: submission.task_id,
        task_title: submission.task_title || `任务${submission.task_id}`,
        user_id: submission.user_id,
        username: submission.username || `用户${submission.user_id}`,
        user_avatar: submission.user_avatar,
        content: submission.content,
        attachments: submission.attachments ? JSON.parse(submission.attachments) : [],
        status: submission.status,
        created_at: submission.created_at,
        reviewed_at: submission.reviewed_at,
        reviewer_comment: submission.reviewer_comment,
        reward_amount: submission.reward_amount || 0,
        // 添加审核步骤
        review_steps: [
          {
            id: 'basic_info_check',
            name: '基础信息审核',
            description: '审核提交的标题、分类、描述、封面和预览视频是否符合要求',
            status: 'pending'
          },
          {
            id: 'workflow_file_check',
            name: '工作流文件审核',
            description: '审核工作流文件的完整性和可用性',
            status: 'pending'
          },
          {
            id: 'coze_api_test',
            name: 'Coze API测试',
            description: '测试Coze API的功能和稳定性',
            status: 'pending'
          },
          {
            id: 'final_approval',
            name: '最终审核通过',
            description: '所有审核步骤完成，等待最终批准',
            status: 'pending'
          }
        ],
        // 直接使用后端返回的真实数据
        title: submission.title,
        description: submission.description,
        category: submission.category,
        category_id: submission.category_id,
        category_name: submission.category_name,
        tags: submission.tags ? (typeof submission.tags === 'string' ? JSON.parse(submission.tags) : submission.tags) : [],
        cover_image: submission.cover_image_url,
        preview_video: submission.preview_video_url,
        preview_video_url: submission.preview_video_url,
        preview_images: submission.preview_images ? (typeof submission.preview_images === 'string' ? JSON.parse(submission.preview_images) : submission.preview_images) : [],
        workflow_file_url: submission.workflow_file_url,
        workflow_file_name: submission.workflow_file_name,
        workflow_file_size: submission.workflow_file_size,
        coze_api: submission.coze_api,
        // 价格相关字段映射
        price: submission.price,
        download_price: submission.download_price,
        is_run_member_free: submission.is_member_free || submission.is_run_member_free,
        is_download_member_free: submission.is_download_member_free
      }));
      
      setSubmissions(mappedSubmissions);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load submissions:', error);
      showError('加载提交列表失败，请重试');
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
    loadSubmissions();
  }, [currentPage, debouncedSearchTerm, statusFilter, taskFilter]);

  // 当搜索条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, taskFilter]);

  // 获取状态图标
  const getStatusIcon = (status: TaskSubmission['status']) => {
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

  // 处理提交操作
  const handleSubmissionAction = (submissionId: number, action: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    switch (action) {
      case 'view':
        setSelectedSubmission(submission);
        setIsDetailModalOpen(true);
        break;
      case 'step_review':
        setSelectedSubmission(submission);
        setIsStepReviewModalOpen(true);
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            任务提交审核
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            审核用户提交的任务完成情况
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>待审核: {submissions.filter(s => s.status === 'pending').length}</span>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="搜索任务标题、用户名或提交内容..."
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
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">所有任务</option>
              <option value="1">用户体验调研任务</option>
              <option value="2">内容创作任务</option>
              <option value="3">产品测试任务</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 提交列表 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无提交</h3>
            <p className="text-gray-600 dark:text-gray-400">当前筛选条件下没有找到任务提交</p>
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
                    提交用户
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    奖励
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    审核时间
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
                      <div className="max-w-xs">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {submission.task_title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {submission.content.substring(0, 50)}...
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
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(submission.status)}
                        <Badge 
                          variant={submission.status === 'approved' ? 'success' : submission.status === 'rejected' ? 'error' : 'warning'}
                        >
                          {submission.status === 'pending' ? '待审核' : 
                           submission.status === 'approved' ? '已通过' : '已拒绝'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        ¥{submission.reward_amount}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {formatDateTime(submission.created_at)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {submission.reviewed_at ? formatDateTime(submission.reviewed_at) : '-'}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubmissionAction(submission.id, 'view')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        {submission.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmissionAction(submission.id, 'step_review')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            开始审核
                          </Button>
                        )}
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

      {/* 提交详情模态框 */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSubmission(null);
        }}
        onUpdate={loadSubmissions}
      />

      {/* 分步骤审核模态框 */}
      <StepReviewModal
        submission={selectedSubmission}
        isOpen={isStepReviewModalOpen}
        onClose={() => {
          setIsStepReviewModalOpen(false);
          setSelectedSubmission(null);
        }}
        onUpdate={loadSubmissions}
      />
    </div>
  );
};