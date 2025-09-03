import React, { useState, useEffect } from 'react';
import {
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Tag,
  Upload,
  X,
  Plus,
  Send,
  Loader2,
  Image
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/DropdownMenu';
// import { AdminLayout } from '../components/AdminLayout'; // 移除，因为在App.tsx中已经使用了AdminLayout包装
import { useAuth, usePermission } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { adminApi, categoryApi } from '../services/api';
import api from '../services/api';
import { Workflow } from '../types';

// 工作流详情模态框接口
interface WorkflowDetailModalProps {
  workflow: Workflow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (workflow: Workflow) => void;
}

// 工作流详情模态框组件
const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({ workflow, isOpen, onClose, onUpdate }) => {
  const { showError, showAlert } = useAlert();
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (workflow) {
      setEditingWorkflow({ ...workflow });
      setRejectReason('');
      setShowRejectForm(false);
      setIsEditing(false);
    }
  }, [workflow]);

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryApi.getCategories();
        setCategories(response || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const handleSaveEdit = async () => {
    if (!editingWorkflow) return;

    try {
      setLoading(true);
      
      // 准备更新数据
      const updateData = {
        title: editingWorkflow.title,
        description: editingWorkflow.description,
        category_id: typeof editingWorkflow.category === 'string' ? 
          categories.find(cat => cat.name === editingWorkflow.category)?.id || editingWorkflow.category_id :
          editingWorkflow.category_id,
        tags: Array.isArray(editingWorkflow.tags) ? editingWorkflow.tags : [],
        price: editingWorkflow.price || 0,
        is_member_free: editingWorkflow.is_member_free || false,
        is_featured: editingWorkflow.is_featured || false
      };
      
      // 调用真实的API更新工作流信息
      const updatedWorkflow = await adminApi.updateCozeWorkflow(editingWorkflow.id, updateData);
      
      // 更新本地状态
      onUpdate({
        ...editingWorkflow,
        ...updatedWorkflow,
        category_name: categories.find(cat => cat.id === updateData.category_id)?.name || editingWorkflow.category_name
      });
      
      setIsEditing(false);
      showAlert('工作流信息更新成功', 'success');
    } catch (error) {
      console.error('Failed to update workflow:', error);
      showError('更新工作流信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!editingWorkflow) return;
    setEditingWorkflow(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleStatusChange = async (status: Workflow['status']) => {
    if (!editingWorkflow) return;

    if (status === 'rejected' && !showRejectForm) {
      setShowRejectForm(true);
      return;
    }

    try {
      setLoading(true);
      // 调用真实的API更新工作流状态
      await adminApi.updateCozeWorkflowStatus(editingWorkflow.id, status, rejectReason);
      const updatedWorkflow = { ...editingWorkflow, status };
      onUpdate(updatedWorkflow);
      onClose();
    } catch (error) {
      console.error('Failed to update workflow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showError('请输入拒绝原因');
      return;
    }
    await handleStatusChange('rejected');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '未知';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!workflow || !editingWorkflow) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "编辑工作流" : "工作流详情"} size="lg">
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coze工作流标题 *
                  </label>
                  <Input
                    value={editingWorkflow?.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="请输入Coze工作流标题"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Coze工作流描述 *
                  </label>
                  <textarea
                    value={editingWorkflow?.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="请详细描述Coze工作流的功能和用途"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分类 *
                  </label>
                  <select
                    value={typeof editingWorkflow?.category === 'string' ? editingWorkflow.category : editingWorkflow?.category?.id || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">请选择分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      价格 (WH)
                    </label>
                    <Input
                      type="number"
                      value={editingWorkflow?.price || 0}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingWorkflow?.is_member_free || false}
                        onChange={(e) => handleInputChange('is_member_free', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">会员免费</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    标签 (用逗号分隔)
                  </label>
                  <Input
                    value={Array.isArray(editingWorkflow?.tags) ? editingWorkflow.tags.join(', ') : editingWorkflow?.tags || ''}
                    onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                    placeholder="例如：自动化,效率工具,数据处理"
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{workflow.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{workflow.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">分类：{workflow.category_name || (typeof workflow.category === 'string' ? workflow.category : workflow.category?.name) || '未知'}</span>
                  </div>
                  {workflow.type && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">类型：
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium ml-1">
                          {workflow.type}
                        </Badge>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">价格：
                      {workflow.price === 0 ? (
                        workflow.is_member_free ? (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium ml-1">
                            会员免费
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium ml-1">
                            所有用户免费
                          </Badge>
                        )
                      ) : (
                        `${workflow.price}`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">创作者：{workflow.creator?.username || '未知用户'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">创建时间：{workflow.created_at ? new Date(workflow.created_at).toLocaleDateString() : ''}</span>
                  </div>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Tag className="w-4 h-4 text-gray-400 mt-1" />
                      <div className="flex flex-wrap gap-1">
                        {workflow.tags.map((tag, index) => (
                          <Badge key={index} className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            {/* 预览图片 */}
            {workflow.preview_images && workflow.preview_images.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预览图片</h4>
                <div className="grid grid-cols-2 gap-2">
                  {workflow.preview_images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{workflow.download_count}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">下载量</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center justify-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{workflow.rating}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{workflow.review_count} 评价</p>
              </div>
            </div>
            
            {/* 标签信息 */}
            {workflow.tags && workflow.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {workflow.tags.map((tag, index) => (
                    <Badge key={index} className="bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200 px-2 py-1 rounded text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 文件信息 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">文件信息</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">文件大小：</span>
              <span className="font-medium dark:text-gray-200">{formatFileSize(workflow.file_size)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">版本：</span>
              <span className="font-medium dark:text-gray-200">{workflow.version || 'v1.0'}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">文件格式：</span>
              <span className="font-medium dark:text-gray-200">{workflow.file_url?.split('.').pop()?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* 标签 */}
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签</h4>
            <div className="flex flex-wrap gap-2">
              {workflow.tags.map((tag, index) => (
                <Badge key={index} variant="default" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 当前状态 */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">当前状态</h4>
          <Badge variant={
            workflow.status === 'pending' ? 'warning' :
            workflow.status === 'approved' ? 'success' :
            workflow.status === 'rejected' ? 'error' :
            workflow.status === 'offline' ? 'default' : 'warning'
          }>
            {workflow.status === 'pending' ? '待审核' :
              workflow.status === 'approved' ? '已通过' :
              workflow.status === 'rejected' ? '已拒绝' :
              workflow.status === 'offline' ? '已下线' : '草稿'}
          </Badge>
        </div>

        {/* 拒绝原因表单 */}
        {showRejectForm && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">拒绝原因</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={3}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(workflow.fileUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-1" />
              下载文件
            </Button>
          </div>
          
          <div className="flex space-x-3">
            {showRejectForm ? (
              <>
                <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                  取消
                </Button>
                <Button onClick={handleReject} loading={loading}>
                  确认拒绝
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  关闭
                </Button>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      取消编辑
                    </Button>
                    <Button onClick={handleSaveEdit} loading={loading}>
                      保存修改
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      data-edit-button
                    >
                      编辑
                    </Button>
                    {workflow.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange('rejected')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          拒绝
                        </Button>
                        <Button onClick={() => handleStatusChange('approved')} loading={loading}>
                          通过审核
                        </Button>
                      </>
                    )}
                    {workflow.status === 'approved' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('offline')}
                        className="text-gray-600"
                      >
                        下线
                      </Button>
                    )}
                    {workflow.status === 'offline' && (
                      <Button onClick={() => handleStatusChange('approved')} loading={loading}>
                        重新上线
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 新增Coze工作流模态框组件
const AddCozeWorkflowModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  workflowTitle: string;
  setWorkflowTitle: (value: string) => void;
  workflowDescription: string;
  setWorkflowDescription: (value: string) => void;
  workflowCategory: string;
  setWorkflowCategory: (value: string) => void;
  workflowType: 'workflow' | 'ai_app';
  setWorkflowType: (value: 'workflow' | 'ai_app') => void;
  categories: any[];
  loadingCategories: boolean;
  availableTags: any[];
  loadingTags: boolean;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  runPrice: number;
  setRunPrice: (price: number) => void;
  isRunMemberFree: boolean;
  setIsRunMemberFree: (free: boolean) => void;
  downloadPrice: number;
  setDownloadPrice: (price: number) => void;
  isDownloadMemberFree: boolean;
  setIsDownloadMemberFree: (free: boolean) => void;
  quickCommands: string[];
  quickCommandInput: string;
  setQuickCommandInput: (value: string) => void;
  addQuickCommand: () => void;
  removeQuickCommand: (command: string) => void;
  uploadStates: any;
  setUploadStates: (states: any) => void;
  handlePreviewImageUpload: (files: FileList) => void;
  handleWorkflowFileUpload: (files: FileList) => void;
  handlePreviewVideoUpload: (files: FileList) => void;
  workflowCozeApi: string;
  setWorkflowCozeApi: (value: string) => void;
}> = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  workflowTitle,
  setWorkflowTitle,
  workflowDescription,
  setWorkflowDescription,
  workflowCategory,
  setWorkflowCategory,
  workflowType,
  setWorkflowType,
  categories,
  loadingCategories,
  availableTags,
  loadingTags,
  selectedTags,
  setSelectedTags,
  runPrice,
  setRunPrice,
  isRunMemberFree,
  setIsRunMemberFree,
  downloadPrice,
  setDownloadPrice,
  isDownloadMemberFree,
  setIsDownloadMemberFree,
  quickCommands,
  quickCommandInput,
  setQuickCommandInput,
  addQuickCommand,
  removeQuickCommand,
  uploadStates,
  setUploadStates,
  handlePreviewImageUpload,
  handleWorkflowFileUpload,
  handlePreviewVideoUpload,
  workflowCozeApi,
  setWorkflowCozeApi
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="新增Coze工作流"
      size="lg"
    >
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-6">
        <div className="space-y-6">
          {/* 标题区域 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">创建新的Coze工作流</h3>
            <p className="text-slate-600 dark:text-slate-300">请填写工作流的详细信息并上传相关文件</p>
          </div>

          {/* 基本信息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                <Send className="w-4 h-4 text-white" />
              </div>
              基本信息
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  工作流标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workflowTitle}
                  onChange={(e) => setWorkflowTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                  placeholder="请输入工作流标题"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  工作流描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="请详细描述工作流的功能和用途"
                  rows={4}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={workflowCategory}
                    onChange={(e) => setWorkflowCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                    required
                    disabled={loadingCategories}
                  >
                    <option value="">请选择分类</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  {loadingCategories && (
                    <p className="text-xs text-gray-500 mt-1">正在加载分类...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value as 'workflow' | 'ai_app')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="workflow">工作流</option>
                    <option value="ai_app">AI应用</option>
                  </select>
                </div>
              </div>

              {/* 运行功能设置 */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">运行功能设置</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="runMemberFree"
                      checked={isRunMemberFree}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIsRunMemberFree(isChecked);
                        if (isChecked) {
                          setRunPrice(0);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="runMemberFree" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      会员免费运行
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    运行价格 (WH币)
                  </label>
                  <input
                    type="number"
                    value={runPrice}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setRunPrice(price);
                      if (price > 0) {
                        setIsRunMemberFree(false);
                      }
                    }}
                    disabled={isRunMemberFree}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 ${
                      isRunMemberFree ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              {/* 下载功能设置 */}
              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">下载功能设置</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="downloadMemberFree"
                      checked={isDownloadMemberFree}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setIsDownloadMemberFree(isChecked);
                        if (isChecked) {
                          setDownloadPrice(0);
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="downloadMemberFree" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      会员免费下载
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    下载价格 (WH币)
                  </label>
                  <input
                    type="number"
                    value={downloadPrice}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setDownloadPrice(price);
                      if (price > 0) {
                        setIsDownloadMemberFree(false);
                      }
                    }}
                    disabled={isDownloadMemberFree}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-slate-800 dark:text-slate-100 ${
                      isDownloadMemberFree ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              {/* 标签选择 */}
              {workflowCategory && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    标签 <span className="text-gray-400">(可选)</span>
                  </label>
                  {loadingTags ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">加载标签中...</span>
                    </div>
                  ) : availableTags.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(selectedTags.filter(t => t !== tag.name));
                                } else {
                                  setSelectedTags([...selectedTags, tag.name]);
                                }
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              style={{
                                backgroundColor: isSelected ? tag.color : undefined,
                                borderColor: tag.color,
                                border: `1px solid ${tag.color}`
                              }}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                      {selectedTags.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            已选择标签 ({selectedTags.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTags.map((tagName, index) => {
                              const tag = availableTags.find(t => t.name === tagName);
                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white"
                                  style={{ backgroundColor: tag?.color || '#6B7280' }}
                                >
                                  <span>{tagName}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTags(selectedTags.filter(t => t !== tagName));
                                    }}
                                    className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">该分类下暂无可用标签</p>
                  )}
                </div>
              )}

              {/* 快捷命令 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  快捷命令 <span className="text-gray-400">(可选)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickCommandInput}
                      onChange={(e) => setQuickCommandInput(e.target.value)}
                      placeholder="输入快捷命令，如：生成报告、数据分析等"
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addQuickCommand();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addQuickCommand}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>
                  
                  {quickCommands.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        已添加的快捷命令 ({quickCommands.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {quickCommands.map((command, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm"
                          >
                            <span>{command}</span>
                            <button
                              type="button"
                              onClick={() => removeQuickCommand(command)}
                              className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coze API 代码 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Coze API 代码 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workflowCozeApi}
                  onChange={(e) => setWorkflowCozeApi(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 font-mono text-sm"
                  placeholder="请输入 Coze API 代码\n\n例如：\nconst response = await fetch('/api/coze', {\n  method: 'POST',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify(data)\n});"
                  rows={8}
                  required
                />
              </div>
            </div>
          </div>

          {/* 文件上传 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                <Upload className="w-4 h-4 text-white" />
              </div>
              文件上传
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 工作流文件 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    工作流文件 <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('workflow-file-upload')?.click()}>
                    {uploadStates.workflowFile.uploading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">上传中...</span>
                      </div>
                    ) : uploadStates.workflowFile.url ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-500 mr-2" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">已上传工作流文件</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">工作流文件已上传</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">上传工作流压缩包文件</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">仅支持压缩包格式：.zip, .rar, .7z</p>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) handleWorkflowFileUpload(files);
                      }}
                      className="hidden"
                      id="workflow-file-upload"
                      accept=".zip,.rar,.7z"
                      required
                    />
                  </div>
                </div>
                
                {/* 预览图片 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    预览图片 <span className="text-red-500">*</span> <span className="text-gray-400">(建议尺寸: 800x600，可上传多张)</span>
                  </label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-white dark:bg-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    {uploadStates.previewImages.uploading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">上传中...</span>
                      </div>
                    ) : uploadStates.previewImages.urls.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                              <Upload className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              已上传 {uploadStates.previewImages.urls.length} 张预览图片
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadStates((prev: any) => ({ ...prev, previewImages: { uploading: false, urls: [] } }));
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-center">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) handlePreviewImageUpload(files);
                            }}
                            className="hidden"
                            id="addMoreImages"
                          />
                          <label
                            htmlFor="addMoreImages"
                            className="cursor-pointer inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            添加更多图片
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">点击上传预览图片</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">支持 JPG, PNG 格式，可上传多张</p>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files) handlePreviewImageUpload(files);
                          }}
                          className="hidden"
                          id="previewImagesUpload"
                        />
                        <label
                          htmlFor="previewImagesUpload"
                          className="cursor-pointer inline-block mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                        >
                          选择图片
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 预览视频 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    预览视频 <span className="text-gray-400">(可选)</span>
                  </label>
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('preview-video-upload')?.click()}>
                    {uploadStates.previewVideo.uploading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">上传中...</span>
                      </div>
                    ) : uploadStates.previewVideo.url ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-500 mr-2" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">已上传预览视频</span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">预览视频已上传</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">上传预览视频</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">支持 MP4, MOV 格式</p>
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) handlePreviewVideoUpload(files);
                      }}
                      className="hidden"
                      id="preview-video-upload"
                      accept=".mp4,.mov,.avi"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
            
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              取消
            </Button>
            <Button
              onClick={onSubmit}
              disabled={loading || !workflowTitle.trim() || !workflowDescription.trim() || !workflowCategory.trim() || !workflowCozeApi.trim() || uploadStates.previewImages.urls.length === 0 || !uploadStates.workflowFile.url}
              className="min-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  创建中...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  创建工作流
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 管理员工作流管理页面
interface AdminCozeWorkflowPageProps {
  defaultStatus?: 'pending' | 'approved' | 'rejected' | 'offline' | 'online';
}

export const AdminCozeWorkflowPage: React.FC<AdminCozeWorkflowPageProps> = ({ defaultStatus }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showAlert, showConfirm } = useAlert();


  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatus || 'all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const pageSize = 10;
  
  // 详细审核相关状态
  const [reviewingWorkflow, setReviewingWorkflow] = useState<Workflow | null>(null);
  const [reviewStep, setReviewStep] = useState<'info' | 'media' | 'test' | 'final'>('info');
  const [reviewChecklist, setReviewChecklist] = useState({
    titleDescription: false,
    coverImage: false,
    fileDownload: false,
    functionality: false
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

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

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      
      // 构建查询参数
      const params = {
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? parseInt(categoryFilter) : undefined,
        sortBy: sortBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      // 调用真实的API获取coze工作流数据
      const response = await adminApi.getAllCozeWorkflows(params);
      
      // 转换数据格式以匹配全局Workflow接口
      const transformedWorkflows: Workflow[] = response.items.map((item: any) => {
        // 根据category_id查找分类名称
        const categoryName = item.category_id ? 
          categories.find(cat => cat.id === item.category_id)?.name || '未分类' : 
          '未分类';
        
        return {
          id: item.id,
          creator_id: item.creator_id,
          creator: item.creator,
          title: item.title,
          description: item.description || '',
          category_id: item.category_id,
          category_name: categoryName,
          subcategory_id: item.subcategory_id,
          price: item.price || 0,
          tags: item.tags || [],
          is_member_free: item.is_member_free || false,
          file_url: item.workflow_file_url || '',
          fileUrl: item.workflow_file_url || '', // 兼容字段
          fileSize: item.workflow_file_size, // 兼容字段
          preview_images: item.preview_images || [],
          preview_video: item.preview_video_url || undefined,
          preview_video_url: item.preview_video_url || undefined,
          previewVideo: item.preview_video_url || undefined, // 兼容字段
          download_count: item.download_count || 0,
          view_count: item.view_count || 0,
          like_count: item.like_count || 0,
          favorite_count: item.favorite_count || 0,
          rating: 0, // coze_workflows表已移除评分系统
          review_count: 0, // coze_workflows表已移除评分系统
          status: item.status as 'pending' | 'approved' | 'rejected' | 'offline' | 'draft',
          is_featured: item.is_featured || false,
          type: item.type || 'coze-workflow',
          coze_api: item.coze_api,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });
      
      setWorkflows(transformedWorkflows);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      // 如果API调用失败，显示空列表
      setWorkflows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [currentPage, searchTerm, categoryFilter, statusFilter, sortBy, categories, startDate, endDate]);

  // 由于过滤现在在服务器端进行，直接使用workflows数据
  const filteredWorkflows = workflows;

  // 获取状态图标
  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'pending':
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  // 根据页面类型获取操作菜单项
  const getActionItems = (workflow: Workflow) => {
    const baseItems = [
      {
        label: '查看详情',
        icon: <Eye className="w-4 h-4" />,
        onClick: () => handleWorkflowAction(workflow.id, 'view')
      }
    ];

    // 工作流列表页面（defaultStatus为undefined）- 只包含基本CRUD操作
    if (!defaultStatus) {
      return [
        ...baseItems,
        {
          label: workflow.is_featured ? '取消推荐' : '推荐',
          icon: <Star className={`w-4 h-4 ${workflow.is_featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />,
          onClick: () => handleWorkflowAction(workflow.id, 'recommend'),
          className: workflow.is_featured ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' : 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        },
        {
          label: '编辑',
          icon: <FileText className="w-4 h-4" />,
          onClick: () => handleWorkflowAction(workflow.id, 'edit'),
          className: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        },
        {
          label: '删除',
          icon: <Trash2 className="w-4 h-4" />,
          onClick: () => handleWorkflowAction(workflow.id, 'delete'),
          className: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
        }
      ];
    }

    // 待审核页面 - 专门用于审核操作
    if (defaultStatus === 'pending') {
      return [
        ...baseItems,
        {
          label: '开始审核',
          icon: <CheckCircle className="w-4 h-4" />,
          onClick: () => startDetailedReview(workflow),
          className: 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
        }
      ];
    }

    // 已发布页面 - 专门用于下线操作
    if (defaultStatus === 'approved') {
      return [
        ...baseItems,
        {
          label: '下线',
          icon: <AlertCircle className="w-4 h-4" />,
          onClick: () => handleWorkflowAction(workflow.id, 'offline'),
          className: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      ];
    }

    // 已下架页面 - 专门用于修复上线操作
    if (defaultStatus === 'offline') {
      return [
        ...baseItems,
        {
          label: '修复上线',
          icon: <CheckCircle className="w-4 h-4" />,
          onClick: () => handleWorkflowAction(workflow.id, 'restore'),
          className: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
        }
      ];
    }

    // 已拒绝页面 - 只显示查看详情
    return baseItems;
  };

  // 开始详细审核工作流
  const startDetailedReview = (workflow: Workflow) => {
    setReviewingWorkflow(workflow);
    setReviewStep('info');
    setReviewChecklist({
      titleDescription: false,
      coverImage: false,
      fileDownload: false,
      functionality: false
    });
  };

  // 关闭详细审核
  const closeDetailedReview = () => {
    setReviewingWorkflow(null);
    setReviewStep('info');
    setReviewChecklist({
      titleDescription: false,
      coverImage: false,
      fileDownload: false,
      functionality: false
    });
  };

  // 更新审核清单并实现自动跳转
  const updateChecklist = (key: keyof typeof reviewChecklist, value: boolean) => {
    setReviewChecklist(prev => {
      const newChecklist = { ...prev, [key]: value };
      
      // 如果勾选了某个步骤，自动跳转到下一步
      if (value) {
        setTimeout(() => {
          if (key === 'titleDescription' && reviewStep === 'info') {
            setReviewStep('media');
          } else if (key === 'coverImage' && reviewStep === 'media') {
            setReviewStep('test');
          } else if ((key === 'fileDownload' || key === 'functionality') && reviewStep === 'test') {
            // 当文件下载和功能测试都完成时，跳转到最终审核
            if ((key === 'fileDownload' && newChecklist.functionality) || 
                (key === 'functionality' && newChecklist.fileDownload)) {
              setReviewStep('final');
            }
          }
        }, 500); // 延迟500ms以显示勾选效果
      }
      
      return newChecklist;
    });
  };

  // 下载工作流文件
  const downloadWorkflowFile = async (workflow: Workflow) => {
    try {
      // 使用API获取下载链接，确保文件可以正常获取
      const response = await api.cozeWorkflow.downloadCozeWorkflow(workflow.id);
      
      if (response.success && response.download_url) {
        // 创建下载链接并触发下载
        const link = document.createElement('a');
        link.href = response.download_url;
        link.download = response.filename || `${workflow.title}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateChecklist('fileDownload', true);
        showAlert(`文件下载成功：${response.filename || workflow.title}`, 'success');
      } else {
        // 如果API不可用，回退到直接下载
        if (workflow.fileUrl) {
          const link = document.createElement('a');
          link.href = workflow.fileUrl;
          link.download = `${workflow.title}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          updateChecklist('fileDownload', true);
          showAlert('文件下载成功', 'success');
        } else {
          showAlert(response.message || '文件链接不存在', 'error');
        }
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      // 如果API调用失败，尝试直接下载
      try {
        if (workflow.fileUrl) {
          const link = document.createElement('a');
          link.href = workflow.fileUrl;
          link.download = `${workflow.title}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          updateChecklist('fileDownload', true);
          showAlert('文件下载成功', 'success');
        } else {
          showAlert('文件下载失败，文件链接不存在', 'error');
        }
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        showAlert('文件下载失败，请检查网络连接后重试', 'error');
      }
    }
  };

  // 检查是否可以进行最终审核
  const canProceedToFinal = () => {
    return reviewChecklist.titleDescription && reviewChecklist.coverImage && reviewChecklist.fileDownload && reviewChecklist.functionality;
  };

  // 审核工作流
  const handleWorkflowReview = async (id: number, status: 'approved' | 'rejected', reason?: string) => {
    // 如果是拒绝操作且没有提供理由，则不执行
    if (status === 'rejected' && !reason?.trim()) {
      showAlert('拒绝工作流时必须填写拒绝理由', 'error');
      return;
    }

    try {
      await adminApi.updateCozeWorkflowStatus(id, status, reason);
      
      // 重新加载数据
      loadWorkflows();
      showAlert(`工作流已${status === 'approved' ? '通过' : '拒绝'}审核`, 'success');
    } catch (error) {
      console.error('Failed to review workflow:', error);
      showAlert('审核操作失败，请重试', 'error');
    }
  };

  // 处理工作流操作
  const handleWorkflowAction = async (workflowId: number, action: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      
      switch (action) {
        case 'create':
          // 打开创建工作流模态框
          setIsCreateModalOpen(true);
          break;
        case 'view':
          if (!workflow) return;
          setSelectedWorkflow(workflow);
          setIsDetailModalOpen(true);
          break;
        case 'edit':
          if (!workflow) return;
          // 打开详情模态框并进入编辑模式
          setSelectedWorkflow(workflow);
          setIsDetailModalOpen(true);
          // 通过延迟设置编辑模式，确保模态框已经打开
          setTimeout(() => {
            const editButton = document.querySelector('[data-edit-button]') as HTMLButtonElement;
            if (editButton) {
              editButton.click();
            }
          }, 100);
          break;
        case 'approve':
          if (!workflow) return;
          await adminApi.updateCozeWorkflowStatus(workflowId, 'approved');
          setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: 'approved' as const } : w));
          showAlert('工作流已通过审核', 'success');
          break;
        case 'reject':
          if (!workflow) return;
          await adminApi.updateCozeWorkflowStatus(workflowId, 'rejected');
          setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: 'rejected' as const } : w));
          showAlert('工作流已拒绝', 'success');
          break;
        case 'offline':
          if (!workflow) return;
          await adminApi.updateCozeWorkflowStatus(workflowId, 'offline');
          setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: 'offline' as const } : w));
          showAlert('工作流已下线', 'success');
          break;
        case 'restore':
          if (!workflow) return;
          await adminApi.updateCozeWorkflowStatus(workflowId, 'approved');
          setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, status: 'approved' as const } : w));
          showAlert('工作流已修复上线', 'success');
          break;
        case 'recommend':
          if (!workflow) return;
          try {
            // 切换推荐状态
            const newFeaturedStatus = !workflow.is_featured;
            await api.admin.updateCozeWorkflowStatus(workflowId, newFeaturedStatus ? 'featured' : 'online');
            // 更新本地状态
            setWorkflows(workflows.map(w => w.id === workflowId ? { ...w, isFeatured: newFeaturedStatus } : w));
            showAlert(`工作流已${newFeaturedStatus ? '设为推荐' : '取消推荐'}`, 'success');
          } catch (error) {
            console.error('Failed to update workflow featured status:', error);
            showAlert('更新推荐状态失败，请重试', 'error');
          }
          break;
        case 'delete':
          if (!workflow) return;
          const confirmed = await showConfirm(
            `确定要删除工作流「${workflow.title}」吗？\n\n此操作将会：\n• 永久删除工作流文件和数据\n• 删除所有相关的评价和收藏\n• 无法恢复，请谨慎操作`
          );
          if (confirmed) {
            try {
              // 调用管理员删除API
              await adminApi.deleteCozeWorkflow(workflowId);
              // 从本地状态中移除
              setWorkflows(workflows.filter(w => w.id !== workflowId));
              showAlert(`工作流「${workflow.title}」已成功删除`, 'success');
            } catch (error) {
              console.error('删除工作流失败:', error);
              
              // 提取详细错误信息
              let errorMessage = '删除失败，请检查网络连接后重试';
              
              if (error && typeof error === 'object') {
                // 如果是API响应错误
                if ('response' in error && error.response) {
                  const response = error.response as any;
                  console.error('API响应错误:', response);
                  
                  if (response.data && response.data.message) {
                    errorMessage = `删除失败: ${response.data.message}`;
                  } else if (response.data && response.data.error) {
                    errorMessage = `删除失败: ${response.data.error.reason || response.data.error}`;
                  }
                } 
                // 如果是直接的错误对象
                else if ('message' in error && error.message) {
                  errorMessage = `删除失败: ${error.message}`;
                }
                // 如果是包含错误信息的对象
                else if ('error' in error && error.error) {
                  const errorObj = error.error as any;
                  if (errorObj.reason) {
                    errorMessage = `删除失败: ${errorObj.reason}`;
                  } else if (typeof errorObj === 'string') {
                    errorMessage = `删除失败: ${errorObj}`;
                  }
                }
              }
              
              console.error('最终错误信息:', errorMessage);
              showAlert(errorMessage, 'error');
            }
          }
          break;
      }
    } catch (error) {
      console.error('Failed to perform workflow action:', error);
      showAlert('操作失败，请重试', 'error');
    }
  };

  // 更新工作流信息
  const handleUpdateWorkflow = (updatedWorkflow: Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
  };

  const handleCreateWorkflow = (newWorkflow: Workflow) => {
    setWorkflows(prev => [newWorkflow, ...prev]);
  };

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await categoryApi.getCategories();
      // 扁平化分类数据，包括子分类
      const flatCategories: any[] = [];
      response.forEach((category: any) => {
        flatCategories.push(category);
        if (category.children && category.children.length > 0) {
          flatCategories.push(...category.children);
        }
      });
      setCategories(flatCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 统计卡片 - 只在工作流列表页面显示 */}
      {!defaultStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">待审核</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">
                  {workflows.filter(w => w.status === 'pending').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">已通过</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                  {workflows.filter(w => w.status === 'approved').length}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">已拒绝</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-2">
                  {workflows.filter(w => w.status === 'rejected').length}
                </p>
              </div>
              <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                <XCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600 shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">已下线</p>
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-2">
                  {workflows.filter(w => w.status === 'offline').length}
                </p>
              </div>
              <div className="p-3 bg-gray-500 rounded-xl shadow-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300 w-5 h-5" />
              <Input
                placeholder="搜索Coze工作流标题、描述或创作者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 px-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-700 dark:text-gray-300"
              disabled={loadingCategories}
            >
              <option value="all">所有分类</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 px-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-700 dark:text-gray-300"
            >
              <option value="all">所有状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
              <option value="offline">已下线</option>
            </select>
            {/* 排序选择器 - 主要用于已发布页面 */}
            {(defaultStatus === 'approved' || !defaultStatus) && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 px-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-700 dark:text-gray-300"
              >
                <option value="latest">最新发布</option>
                <option value="popular">热门下载</option>
                <option value="rating">评分最高</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
                <option value="hot">综合热度</option>
              </select>
            )}
            {/* 时间筛选器 - 主要用于已下架页面 */}
            {defaultStatus === 'offline' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 px-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-700 dark:text-gray-300"
                  placeholder="开始日期"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12 px-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-700 dark:text-gray-300"
                  placeholder="结束日期"
                />
              </>
            )}
            {!defaultStatus && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                新增Coze工作流
              </Button>
            )}
            </div>
          </div>
        </Card>

      {/* 工作流列表 */}
      <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
              <tr>
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  工作流
                </th>
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  创作者
                </th>
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  价格设置(WH)
                </th>
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                {/* 为已发布页面显示额外的排序相关列 */}
                {defaultStatus === 'approved' && (
                  <>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      下载量
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      评分
                    </th>
                  </>
                )}
                <th className="px-8 py-6 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-8 py-6 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={defaultStatus === 'approved' ? 9 : 7} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {defaultStatus === 'pending' ? '暂无待审核工作流' :
                             defaultStatus === 'approved' ? '暂无已发布工作流' :
                             defaultStatus === 'rejected' ? '暂无已拒绝工作流' :
                             defaultStatus === 'offline' ? '暂无已下架工作流' : '暂无工作流'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {defaultStatus === 'pending' ? '当前没有需要审核的工作流' :
                             defaultStatus === 'approved' ? '当前没有已发布的工作流' :
                             defaultStatus === 'rejected' ? '当前没有被拒绝的工作流' :
                             defaultStatus === 'offline' ? '当前没有已下架的工作流' : '当前没有任何工作流数据'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <tr key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl flex items-center justify-center mr-4 shadow-md">
                          {workflow.preview_images && workflow.preview_images.length > 0 ? (
                            <img 
                              src={workflow.preview_images[0]} 
                              alt={workflow.title}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="max-w-xs">
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {workflow.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {workflow.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {workflow.category_name || (typeof workflow.category === 'string' ? workflow.category : workflow.category?.name) || '未知'}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{workflow.creator?.username || '未知'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">运行:</span>
                          {workflow.price === 0 ? (
                            workflow.is_member_free ? (
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">
                                会员免费
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                                免费
                              </Badge>
                            )
                          ) : (
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.price} WH</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">下载:</span>
                          {(workflow.download_price || 0) === 0 ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded text-xs font-medium">
                              免费
                            </Badge>
                          ) : (
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{workflow.download_price} WH</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(workflow.status)}
                        <Badge className={
                          (workflow.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          workflow.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          workflow.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          workflow.status === 'offline' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : 
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200') + ' px-3 py-1 rounded-full text-sm font-medium'
                        }>
                          {workflow.status === 'pending' ? '待审核' :
                           workflow.status === 'approved' ? '已通过' :
                            workflow.status === 'rejected' ? '已拒绝' :
                            workflow.status === 'offline' ? '已下线' : '草稿'}
                        </Badge>
                      </div>
                    </td>
                    {/* 为已发布页面显示额外的排序相关数据 */}
                    {defaultStatus === 'approved' && (
                      <>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                            <Download className="w-4 h-4 mr-2 text-blue-500" />
                            {workflow.download_count || 0}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                            {workflow.rating ? workflow.rating.toFixed(1) : '暂无'}
                            {workflow.review_count > 0 && (
                              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">({workflow.review_count})</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(workflow.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right text-sm font-medium">
                      {defaultStatus === 'pending' ? (
                        <Button
                          onClick={() => startDetailedReview(workflow)}
                          className="bg-blue-500 hover:bg-blue-600 text-white border-0 rounded-xl px-4 py-2 transition-all duration-200 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>开始审核</span>
                        </Button>
                      ) : (
                        <DropdownMenu
                          trigger={
                            <Button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-0 rounded-xl p-2 transition-all duration-200">
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          }
                          items={getActionItems(workflow)}
                        />
                      )}
                    </td>
                  </tr>
                  )))}
              </tbody>
            </table>
          </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, filteredWorkflows.length)} 条，
                共 {filteredWorkflows.length} 条记录
              </div>
              <div className="flex space-x-3">
                <Button
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 详细审核模态框 */}
      {reviewingWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">详细审核 - {reviewingWorkflow.title}</h3>
              <Button variant="outline" size="sm" onClick={closeDetailedReview}>
                关闭
              </Button>
            </div>
            
            {/* 审核步骤导航 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <Button
                  variant={reviewStep === 'info' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewStep('info')}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>基本信息</span>
                  {reviewChecklist.titleDescription && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <Button
                  variant={reviewStep === 'media' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewStep('media')}
                  className="flex items-center space-x-2"
                >
                  <Image className="w-4 h-4" />
                  <span>媒体文件</span>
                  {reviewChecklist.coverImage && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <Button
                  variant={reviewStep === 'test' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewStep('test')}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>功能测试</span>
                  {reviewChecklist.fileDownload && reviewChecklist.functionality && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <Button
                  variant={reviewStep === 'final' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setReviewStep('final')}
                  disabled={!canProceedToFinal()}
                  className="flex items-center space-x-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>最终审核</span>
                </Button>
              </div>
            </div>
            
            {/* 审核内容 */}
            <div className="px-6 py-4">
              {reviewStep === 'info' && (
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">第一步：基本工作流信息审核</h4>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">审核说明</h5>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          请仔细检查工作流的基本信息，包括标题、描述、分类和价格设置是否合规合理。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标题</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">{reviewingWorkflow.title}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">描述</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-32 overflow-y-auto">
                          {reviewingWorkflow.description || '无描述'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">{reviewingWorkflow.category_name || (typeof reviewingWorkflow.category === 'string' ? reviewingWorkflow.category : reviewingWorkflow.category?.name) || '未知'}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">价格设置</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                          <div>运行价格: ${reviewingWorkflow.price || 0}</div>
                          <div>下载价格: ${reviewingWorkflow.download_price || 0}</div>
                          {reviewingWorkflow.is_member_free && <div className="text-green-600 dark:text-green-400 mt-1">会员免费</div>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">创建者</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">{reviewingWorkflow.creator?.username || '未知'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">创建时间</label>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">{new Date(reviewingWorkflow.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="titleDescription"
                          checked={reviewChecklist.titleDescription}
                          onChange={(e) => updateChecklist('titleDescription', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="titleDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ✓ 基本信息审核通过，内容合规合理
                        </label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          closeDetailedReview();
                          handleWorkflowReview(reviewingWorkflow.id, 'rejected', '基本信息不合规');
                        }}
                        className="flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>拒绝 - 基本信息不合规</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {reviewStep === 'media' && (
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">第二步：封面和预览视频审核</h4>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Image className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200">媒体审核说明</h5>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          请仔细检查工作流的封面图片和预览视频，确保内容清晰、质量良好且符合平台规范。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* 封面图片区域 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">封面图片</h5>
                      </div>
                      
                      {reviewingWorkflow.preview_images && reviewingWorkflow.preview_images.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {reviewingWorkflow.preview_images.map((image: string, index: number) => (
                              <div key={index} className="relative group cursor-pointer" onClick={() => setImagePreview(image)}>
                                <img
                                  src={image}
                                  alt={`封面图片 ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-600 transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder-image.png';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-md flex items-center justify-center">
                                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            共 {reviewingWorkflow.preview_images.length} 张封面图片
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-gray-500 dark:text-gray-400 text-sm">暂无封面图片</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 预览视频区域 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-5 h-5 text-gray-600 dark:text-gray-400">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">预览视频</h5>
                      </div>
                      
                      {reviewingWorkflow.previewVideo ? (
                        <div className="space-y-4">
                          <div className="relative group cursor-pointer" onClick={() => setVideoPreview(reviewingWorkflow.previewVideo!)}>
                            <video
                              src={reviewingWorkflow.previewVideo}
                              controls
                              className="w-full max-w-2xl h-64 rounded-md border border-gray-200 dark:border-gray-600 bg-black"
                              poster={reviewingWorkflow.preview_images?.[0]}
                              onClick={(e) => {
                                e.stopPropagation();
                                setVideoPreview(reviewingWorkflow.previewVideo!);
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-md flex items-center justify-center pointer-events-none">
                              <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            预览视频已上传，请播放检查内容质量（点击可全屏预览）
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <div className="w-8 h-8 text-gray-400 mx-auto mb-2">
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">暂无预览视频</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="coverImageMedia"
                          checked={reviewChecklist.coverImage}
                          onChange={(e) => updateChecklist('coverImage', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="coverImageMedia" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ✓ 封面和预览视频审核通过，内容质量良好
                        </label>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          closeDetailedReview();
                          handleWorkflowReview(reviewingWorkflow.id, 'rejected', '封面图片或预览视频不合规');
                        }}
                        className="flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>拒绝 - 媒体内容不合规</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {reviewStep === 'test' && (
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">第三步：文件下载与功能测试</h4>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <Download className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-200">测试说明</h5>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          请下载工作流文件并在相应平台进行功能测试，确保文件完整性和功能正常运行。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* 文件下载区域 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">文件下载测试</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">文件信息</h6>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">文件名称：</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100 break-all">
                                  {reviewingWorkflow.title}.zip
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">文件大小：</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {reviewingWorkflow.file_size ? `${(reviewingWorkflow.file_size / 1024 / 1024).toFixed(2)} MB` : '未知'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">版本：</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {reviewingWorkflow.version || 'v1.0'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">文件格式：</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {reviewingWorkflow.fileUrl?.split('.').pop()?.toUpperCase() || 'ZIP'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={() => downloadWorkflowFile(reviewingWorkflow)}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                          >
                            <Download className="w-4 h-4" />
                            <span>下载工作流文件</span>
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
                            <div className="flex items-start space-x-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <h6 className="text-sm font-medium text-amber-800 dark:text-amber-200">下载检查要点</h6>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                                  <li>• 文件能够正常下载</li>
                                  <li>• 文件大小合理</li>
                                  <li>• 文件格式正确</li>
                                  <li>• 文件未损坏</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 功能测试区域 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">功能测试验证</h5>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
                        <h6 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">测试平台建议</h6>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          请在相应的AI工作流平台中测试文件的功能性：
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h6 className="text-xs font-medium text-blue-800 dark:text-blue-200">常用平台：</h6>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                              <li>• ComfyUI</li>
                              <li>• Stable Diffusion WebUI</li>
                              <li>• Automatic1111</li>
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h6 className="text-xs font-medium text-blue-800 dark:text-blue-200">检查要点：</h6>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                              <li>• 工作流正常加载</li>
                              <li>• 节点连接正确</li>
                              <li>• 参数设置合理</li>
                              <li>• 输出结果符合预期</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fileDownload"
                          checked={reviewChecklist.fileDownload}
                          onChange={(e) => updateChecklist('fileDownload', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="fileDownload" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ✓ 文件下载成功，格式正确
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="functionality"
                          checked={reviewChecklist.functionality}
                          onChange={(e) => updateChecklist('functionality', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="functionality" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ✓ 功能测试通过，运行正常
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          closeDetailedReview();
                          handleWorkflowReview(reviewingWorkflow.id, 'rejected', '文件下载失败或功能测试不通过');
                        }}
                        className="flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>拒绝 - 测试不通过</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {reviewStep === 'final' && (
                <div className="space-y-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">第四步：最终审核决定</h4>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h5 className="text-lg font-semibold text-green-800 dark:text-green-200">审核流程完成</h5>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          所有审核步骤已完成，请根据审核结果做出最终决定。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* 审核进度总览 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">审核进度总览</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                reviewChecklist.titleDescription 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-gray-100 dark:bg-gray-600'
                              }`}>
                                <span className="text-sm font-medium">1</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">基本信息审核</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">标题、描述、分类等</p>
                              </div>
                            </div>
                            <CheckCircle className={`w-5 h-5 ${
                              reviewChecklist.titleDescription 
                                ? 'text-green-500' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                reviewChecklist.coverImage 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-gray-100 dark:bg-gray-600'
                              }`}>
                                <span className="text-sm font-medium">2</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">媒体内容审核</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">封面图片、预览视频</p>
                              </div>
                            </div>
                            <CheckCircle className={`w-5 h-5 ${
                              reviewChecklist.coverImage 
                                ? 'text-green-500' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                reviewChecklist.fileDownload 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-gray-100 dark:bg-gray-600'
                              }`}>
                                <span className="text-sm font-medium">3</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">文件下载测试</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">文件完整性检查</p>
                              </div>
                            </div>
                            <CheckCircle className={`w-5 h-5 ${
                              reviewChecklist.fileDownload 
                                ? 'text-green-500' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                reviewChecklist.functionality 
                                  ? 'bg-green-100 dark:bg-green-900/30' 
                                  : 'bg-gray-100 dark:bg-gray-600'
                              }`}>
                                <span className="text-sm font-medium">4</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">功能性测试</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">工作流运行验证</p>
                              </div>
                            </div>
                            <CheckCircle className={`w-5 h-5 ${
                              reviewChecklist.functionality 
                                ? 'text-green-500' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} />
                          </div>
                        </div>
                      </div>
                      
                      {/* 完成度统计 */}
                      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">审核完成度</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {Object.values(reviewChecklist).filter(Boolean).length}/4 项完成
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(Object.values(reviewChecklist).filter(Boolean).length / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 最终决定 */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">最终审核决定</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="primary"
                          onClick={() => {
                            handleWorkflowReview(reviewingWorkflow.id, 'approved');
                            closeDetailedReview();
                          }}
                          disabled={!canProceedToFinal()}
                          className="h-12 flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">通过审核</span>
                        </Button>
                        
                        <Button
                          variant="destructive"
                          onClick={() => {
                            closeDetailedReview();
                            handleWorkflowReview(reviewingWorkflow.id, 'rejected', '最终审核未通过');
                          }}
                          className="h-12 flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">拒绝审核</span>
                        </Button>
                      </div>
                      
                      {!canProceedToFinal() && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              请完成所有审核步骤后再进行最终决定。未完成的步骤将以灰色显示。
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 工作流详情模态框 */}
      <WorkflowDetailModal
        workflow={selectedWorkflow}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedWorkflow(null);
        }}
        onUpdate={handleUpdateWorkflow}
      />

      {/* 图片预览模态框 */}
      {imagePreview && (
        <Modal
          isOpen={!!imagePreview}
          onClose={() => setImagePreview(null)}
          title="图片预览"
          size="lg"
        >
          <div className="flex items-center justify-center p-4">
            <img
              src={imagePreview}
              alt="预览图片"
              className="max-w-full max-h-96 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png';
              }}
            />
          </div>
        </Modal>
      )}

      {/* 视频预览模态框 */}
      {videoPreview && (
        <Modal
          isOpen={!!videoPreview}
          onClose={() => setVideoPreview(null)}
          title="视频预览"
          size="lg"
        >
          <div className="flex items-center justify-center p-4">
            <video
              src={videoPreview}
              controls
              className="max-w-full max-h-96 rounded-lg"
              poster={reviewingWorkflow?.preview_images?.[0]}
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
        </Modal>
      )}

      {/* 新增工作流模态框 */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateWorkflow}
        categories={categories}
      />
    </>
  );
};

// 新增工作流模态框组件
interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workflow: Workflow) => void;
  categories: any[];
}

const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose, onSuccess, categories }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [loadingCategories] = useState(false);
  const [availableTags] = useState<any[]>([]);
  const [loadingTags] = useState(false);
  
  // 工作流基本信息
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [workflowType, setWorkflowType] = useState<'workflow' | 'ai_app'>('workflow');
  
  // 价格设置
  const [runPrice, setRunPrice] = useState(0);
  const [downloadPrice, setDownloadPrice] = useState(0);
  const [isRunMemberFree, setIsRunMemberFree] = useState(true);
  const [isDownloadMemberFree, setIsDownloadMemberFree] = useState(true);
  
  // 快捷指令
  const [quickCommands, setQuickCommands] = useState<string[]>([]);
  const [quickCommandInput, setQuickCommandInput] = useState('');
  
  // Coze API 代码
  const [workflowCozeApi, setWorkflowCozeApi] = useState('');
  
  // 文件上传状态
  const [uploadStates, setUploadStates] = useState({
    previewImages: { uploading: false, urls: [] as string[] },
    previewVideo: { uploading: false, url: '' },
    workflowFile: { uploading: false, url: '' }
  });

  const addQuickCommand = () => {
    if (quickCommandInput.trim() && !quickCommands.includes(quickCommandInput.trim())) {
      setQuickCommands([...quickCommands, quickCommandInput.trim()]);
      setQuickCommandInput('');
    }
  };

  const removeQuickCommand = (command: string) => {
    setQuickCommands(quickCommands.filter((cmd: string) => cmd !== command));
  };

  const handlePreviewImageUpload = async (files: FileList) => {
    // 实现图片上传逻辑
    console.log('Uploading preview images:', files);
  };

  const handleWorkflowFileUpload = async (files: FileList) => {
    // 实现工作流文件上传逻辑
    console.log('Uploading workflow files:', files);
  };

  const handlePreviewVideoUpload = async (files: FileList) => {
    // 实现视频上传逻辑
    console.log('Uploading preview video:', files);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      // 这里处理表单提交逻辑
      const formData = {
        title: workflowTitle,
        description: workflowDescription,
        category: workflowCategory,
        type: workflowType,
        tags: selectedTags,
        runPrice,
        downloadPrice,
        isRunMemberFree,
        isDownloadMemberFree,
        quickCommands,
        cozeApi: workflowCozeApi,
        uploadStates
      };
      console.log('Submitting workflow:', formData);
      showAlert('工作流创建成功', 'success');
      onSuccess({} as any);
      onClose();
    } catch (error) {
      console.error('Failed to create workflow:', error);
      showAlert('创建工作流失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddCozeWorkflowModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      workflowTitle={workflowTitle}
      setWorkflowTitle={setWorkflowTitle}
      workflowDescription={workflowDescription}
      setWorkflowDescription={setWorkflowDescription}
      workflowCategory={workflowCategory}
      setWorkflowCategory={setWorkflowCategory}
      workflowType={workflowType}
      setWorkflowType={setWorkflowType}
      categories={categories}
      loadingCategories={loadingCategories}
      availableTags={availableTags}
      loadingTags={loadingTags}
      selectedTags={selectedTags}
      setSelectedTags={setSelectedTags}
      runPrice={runPrice}
      setRunPrice={setRunPrice}
      isRunMemberFree={isRunMemberFree}
      setIsRunMemberFree={setIsRunMemberFree}
      downloadPrice={downloadPrice}
      setDownloadPrice={setDownloadPrice}
      isDownloadMemberFree={isDownloadMemberFree}
      setIsDownloadMemberFree={setIsDownloadMemberFree}
      quickCommands={quickCommands}
      quickCommandInput={quickCommandInput}
      setQuickCommandInput={setQuickCommandInput}
      addQuickCommand={addQuickCommand}
      removeQuickCommand={removeQuickCommand}
      uploadStates={uploadStates}
      setUploadStates={setUploadStates}
      handlePreviewImageUpload={handlePreviewImageUpload}
      handleWorkflowFileUpload={handleWorkflowFileUpload}
      handlePreviewVideoUpload={handlePreviewVideoUpload}
      workflowCozeApi={workflowCozeApi}
      setWorkflowCozeApi={setWorkflowCozeApi}
    />
  );
};