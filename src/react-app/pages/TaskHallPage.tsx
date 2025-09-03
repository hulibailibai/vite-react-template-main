import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { Pagination } from '../components/ui/Pagination';
import { Modal } from '../components/ui/Modal';
import { taskApi, creatorUploadApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Gift, Send, Upload, List, User, Eye, X, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// 任务接口定义
interface Task {
  id: number;
  title: string;
  description: string;
  requirements?: string;
  submission_types: string[];
  reward_amount: number;
  reward_type: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  category: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  submission_count?: number;
}

// 我的任务提交接口定义
interface MyTaskSubmission {
  id: number;
  task_id: number;
  task_title: string;
  task_description: string;
  task_reward_amount: number;
  content: string;
  attachments: string | null;
  status: 'claimed' | 'pending' | 'approved' | 'rejected' | 'abandoned';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_comment: string | null;
  task_end_date: string;
  submission_content?: string;
  submission_files?: string[];
  end_date?: string;
  claimed_at?: string;
  submission_types?: string;
  submission_type?: string;
}

// 工作流数据接口定义
interface WorkflowData {
  id?: number;
  title?: string;
  description?: string;
  category_id?: number;
  tags?: string[];
  price?: number; // 运行工作流的价格
  download_price?: number; // 下载工作流的价格
  type?: string;
  is_member_free?: boolean; // 运行会员免费
  is_download_member_free?: boolean; // 下载会员免费
  workflow_file_url?: string;
  workflow_file_name?: string;
  workflow_file_size?: number;
  cover_image_url?: string;
  preview_images?: string[];
  preview_video_url?: string;
  coze_api?: string;
  quick_commands?: string[];
  status?: string;
  created_at?: string;
  file_url?: string; // API返回的文件URL字段
}

// 标签栏类型
type TabType = 'available' | 'my-tasks';

const TaskHallPage: React.FC = () => {
  const { user } = useAuth();
  
  // 标签栏状态
  const [activeTab, setActiveTab] = useState<TabType>('available');
  
  // 可用任务相关状态
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [claimingTasks, setClaimingTasks] = useState<Set<number>>(new Set());
  const [userParticipations, setUserParticipations] = useState<{[key: string]: boolean}>({});
  
  // 我的任务相关状态
  const [myTasks, setMyTasks] = useState<MyTaskSubmission[]>([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);
  const [myTasksCurrentPage, setMyTasksCurrentPage] = useState(1);
  const [myTasksTotalPages, setMyTasksTotalPages] = useState(1);
  const [abandoningTaskId, setAbandoningTaskId] = useState<number | null>(null);
  const [cancelingTaskId, setCancelingTaskId] = useState<number | null>(null);
  
  // 任务提交相关状态
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionTaskId, setSubmissionTaskId] = useState<string | null>(null);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submittingTask, setSubmittingTask] = useState(false);
  
  // 工作流提交相关状态
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState('');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);
  const [workflowPrice, setWorkflowPrice] = useState(0);
  const [workflowDownloadPrice, setWorkflowDownloadPrice] = useState(0);
  const [workflowType, setWorkflowType] = useState('coze');
  const [workflowIsMemberFree, setWorkflowIsMemberFree] = useState(true); // 运行会员免费
  const [workflowIsDownloadMemberFree, setWorkflowIsDownloadMemberFree] = useState(true); // 下载会员免费

  const [workflowPreviewImages, setWorkflowPreviewImages] = useState<File[]>([]);
  const [workflowPreviewVideo, setWorkflowPreviewVideo] = useState<File | null>(null);
  const [workflowCozeApi, setWorkflowCozeApi] = useState('');
  const [workflowQuickCommands, setWorkflowQuickCommands] = useState<string[]>([]);
  const [quickCommandInput, setQuickCommandInput] = useState('');
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null); // 存储完整的工作流数据
  
  // 分类和标签相关状态
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [availableTags, setAvailableTags] = useState<Array<{id: number, name: string, color: string}>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  
  // 任务详情模态框状态
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MyTaskSubmission | null>(null);
  
  // 可用任务详情模态框状态
  const [showAvailableTaskDetailModal, setShowAvailableTaskDetailModal] = useState(false);
  const [selectedAvailableTask, setSelectedAvailableTask] = useState<Task | null>(null);

  // 上传进度相关状态
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStep, setUploadStep] = useState<'workflow' | 'images' | 'video' | 'submitting'>('workflow');

  // 获取可用任务列表
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getAvailableTasks({
        page: currentPage,
        pageSize: 12,
      });
      
      // 过滤掉已满员的任务
      const availableTasks = response.items.filter((task: Task) => {
        return !isFull(task) && !isExpired(task.end_date) && task.status === 'active';
      });
      
      setTasks(availableTasks);
      setTotalPages(response.pagination.totalPages);
      
      // 如果用户已登录，检查参与状态
      if (user && availableTasks.length > 0) {
        await checkUserParticipations(availableTasks);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取我的任务列表
  const fetchMyTasks = async () => {
    if (!user) return;
    
    try {
      setMyTasksLoading(true);
      const response = await taskApi.getMySubmissions({
        page: myTasksCurrentPage,
        pageSize: 12,
      });
      
      setMyTasks(response.items);
      setMyTasksTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('获取我的任务失败:', error);
      toast.error('获取我的任务失败');
    } finally {
      setMyTasksLoading(false);
    }
  };

  // 检查用户参与状态
  const checkUserParticipations = async (taskList: Task[]) => {
    if (!user) return;
    
    try {
      const participationPromises = taskList.map(task => 
        taskApi.checkTaskParticipation(task.id)
      );
      
      const results = await Promise.all(participationPromises);
      const participationMap: {[key: string]: boolean} = {};
      
      taskList.forEach((task, index) => {
         participationMap[task.id] = results[index].participated;
       });
      
      setUserParticipations(participationMap);
    } catch (error) {
      console.error('检查参与状态失败:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'available') {
      fetchTasks();
      // 如果用户已登录，也需要获取我的任务数据以正确显示按钮状态
      if (user) {
        fetchMyTasks();
      }
    } else if (activeTab === 'my-tasks') {
      fetchMyTasks();
    }
  }, [currentPage, myTasksCurrentPage, activeTab, user]);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API response:', data);
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 根据分类获取标签数据
  const fetchTags = async (categoryId: string) => {
    if (!categoryId) {
      setAvailableTags([]);
      return;
    }

    try {
      setLoadingTags(true);
      const response = await fetch(`/api/tags?category_id=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Tags API response:', data);
        setAvailableTags(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setAvailableTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  // 监听工作流分类变化，获取对应标签
  useEffect(() => {
    if (workflowCategory) {
      fetchTags(workflowCategory);
      // 清空已选标签当分类改变时（但不在数据回填时清空）
      setWorkflowTags([]);
    } else {
      setAvailableTags([]);
      setWorkflowTags([]);
    }
  }, [workflowCategory]);

  // 标签切换处理
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'available') {
      setCurrentPage(1);
    } else {
      setMyTasksCurrentPage(1);
    }
  };

  // 处理放弃任务（撤回已提交的任务）
  const handleAbandonTask = async (submissionId: number) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setAbandoningTaskId(submissionId);
    
    try {
      await taskApi.withdrawMySubmission(submissionId);
      toast.success('任务已放弃');
      fetchMyTasks(); // 刷新我的任务列表
    } catch (error: any) {
      console.error('放弃任务失败:', error);
      toast.error(error.response?.data?.message || '放弃任务失败');
    } finally {
      setAbandoningTaskId(null);
    }
  };

  // 处理取消任务领取（取消已领取但未提交的任务）
  const handleCancelTaskClaim = async (taskId: number) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setCancelingTaskId(taskId);
    
    try {
      await taskApi.cancelTaskClaim(taskId);
      toast.success('任务领取已取消');
      fetchMyTasks(); // 刷新我的任务列表
    } catch (error: any) {
      console.error('取消任务领取失败:', error);
      toast.error(error.response?.data?.message || '取消任务领取失败');
    } finally {
       setCancelingTaskId(null);
     }
   };

  // 查看任务详情
  const handleViewTaskDetail = (task: MyTaskSubmission) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
  };

  // 关闭任务详情模态框
  const handleCloseTaskDetailModal = () => {
    setShowTaskDetailModal(false);
    setSelectedTask(null);
  };

  // 查看可用任务详情
  const handleViewAvailableTaskDetail = (task: Task) => {
    setSelectedAvailableTask(task);
    setShowAvailableTaskDetailModal(true);
  };

  // 关闭可用任务详情模态框
  const handleCloseAvailableTaskDetailModal = () => {
    setShowAvailableTaskDetailModal(false);
    setSelectedAvailableTask(null);
  };

  // 处理任务领取
  const handleClaimTask = async (taskId: number) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setClaimingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const response = await taskApi.claimTask(taskId);
      
      if (response.success) {
        toast.success(response.message || '任务领取成功！');
        // 从任务列表中移除已领取的任务
        setTasks(prev => prev.filter(task => task.id !== taskId));
        // 更新用户参与状态
        setUserParticipations(prev => ({ ...prev, [taskId]: true }));
        // 如果当前在我的任务标签页，刷新我的任务列表
        if (activeTab === 'my-tasks') {
          fetchMyTasks();
        }
      } else {
        toast.error(response.message || '任务领取失败');
      }
    } catch (error: any) {
      console.error('领取任务失败:', error);
      toast.error(error.response?.data?.message || '领取任务失败');
    } finally {
      setClaimingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 打开提交模态框
  const handleOpenSubmissionModal = async (taskId: string) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    
    setSubmissionTaskId(taskId);
    setSubmissionFiles([]);
    
    try {
      // 尝试获取已提交的工作流数据进行回填
      const fetchedWorkflowData = await taskApi.getTaskWorkflow(parseInt(taskId));
      
      if (fetchedWorkflowData) {
        // 保存完整的工作流数据
        setWorkflowData(fetchedWorkflowData);
        
        // 回填工作流数据
        setWorkflowTitle(fetchedWorkflowData.title || '');
        setWorkflowDescription(fetchedWorkflowData.description || '');
        // 使用category_id字段设置分类选择
        const categoryId = fetchedWorkflowData.category_id ? String(fetchedWorkflowData.category_id) : '';
        setWorkflowCategory(categoryId);
        
        // 如果有分类，先获取标签再设置选中的标签
        if (categoryId && fetchedWorkflowData.tags && fetchedWorkflowData.tags.length > 0) {
          // 延迟设置标签，确保fetchTags完成后再设置
          setTimeout(() => {
            setWorkflowTags(fetchedWorkflowData.tags || []);
          }, 100);
        } else {
          setWorkflowTags(fetchedWorkflowData.tags || []);
        }
        setWorkflowPrice(fetchedWorkflowData.price || 0);
        setWorkflowDownloadPrice(fetchedWorkflowData.download_price || 0);
        setWorkflowType(fetchedWorkflowData.type || 'coze');
        setWorkflowIsMemberFree(fetchedWorkflowData.is_member_free ?? true);
        setWorkflowIsDownloadMemberFree(fetchedWorkflowData.is_download_member_free ?? true);
        setWorkflowCozeApi(fetchedWorkflowData.coze_api || '');
        setWorkflowQuickCommands(fetchedWorkflowData.quick_commands || []);
        
        // 如果有已上传的工作流文件，创建虚拟File对象显示
        if (fetchedWorkflowData.workflow_file_name && fetchedWorkflowData.workflow_file_size) {
          // 创建一个虚拟的File对象来显示已上传的文件
          const virtualFile = new File([], fetchedWorkflowData.workflow_file_name, {
            type: 'application/zip', // 默认类型
            lastModified: Date.now()
          });
          
          // 添加自定义属性来标识这是已上传的文件
          Object.defineProperty(virtualFile, 'size', {
            value: fetchedWorkflowData.workflow_file_size,
            writable: false
          });
          Object.defineProperty(virtualFile, 'isExistingFile', {
            value: true,
            writable: false
          });
          
          setSubmissionFiles([virtualFile]);
        }
        
        // 如果有已上传的预览图片，创建虚拟File对象显示
        if (fetchedWorkflowData.preview_images && fetchedWorkflowData.preview_images.length > 0) {
          const previewImageFiles = fetchedWorkflowData.preview_images.map((imageUrl: string, index: number) => {
            const imageFile = new File([], `preview-image-${index + 1}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            Object.defineProperty(imageFile, 'isExistingFile', {
              value: true,
              writable: false
            });
            Object.defineProperty(imageFile, 'url', {
              value: imageUrl,
              writable: false
            });
            
            return imageFile;
          });
          
          setWorkflowPreviewImages(previewImageFiles);
        } else if (fetchedWorkflowData.cover_image_url) {
          // 兼容旧的单张封面图片格式
          const coverImageFile = new File([], 'cover-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          Object.defineProperty(coverImageFile, 'isExistingFile', {
            value: true,
            writable: false
          });
          Object.defineProperty(coverImageFile, 'url', {
            value: fetchedWorkflowData.cover_image_url,
            writable: false
          });
          
          setWorkflowPreviewImages([coverImageFile]);
        }
        
        // 如果有已上传的预览视频，创建虚拟File对象显示
        if (fetchedWorkflowData.preview_video_url) {
          const previewVideoFile = new File([], 'preview-video.mp4', {
            type: 'video/mp4',
            lastModified: Date.now()
          });
          
          Object.defineProperty(previewVideoFile, 'isExistingFile', {
            value: true,
            writable: false
          });
          Object.defineProperty(previewVideoFile, 'url', {
            value: fetchedWorkflowData.preview_video_url,
            writable: false
          });
          
          setWorkflowPreviewVideo(previewVideoFile);
        }
        
        // 价格信息已加载
        
        // 设置下载价格
        setWorkflowDownloadPrice((fetchedWorkflowData as any).download_price || 0);
        
        toast.success('已加载之前提交的数据');
      } else {
        // 如果没有找到已提交的数据，重置表单
        setWorkflowData(null);
        setWorkflowTitle('');
        setWorkflowDescription('');
        setWorkflowCategory('');
        setWorkflowTags([]);
        setWorkflowPrice(0);
        setWorkflowDownloadPrice(0);
        setWorkflowType('coze');
        setWorkflowIsMemberFree(true);
        setWorkflowIsDownloadMemberFree(true);

        setWorkflowPreviewImages([]);
        setWorkflowPreviewVideo(null);
        setWorkflowCozeApi('');
        setWorkflowQuickCommands([]);
        setQuickCommandInput('');
      }
    } catch (error) {
      console.error('获取工作流数据失败:', error);
      // 如果获取失败，重置表单
      setWorkflowData(null);
      setWorkflowTitle('');
      setWorkflowDescription('');
      setWorkflowCategory('');
      setWorkflowTags([]);
      setWorkflowPrice(0);
      setWorkflowDownloadPrice(0);
      setWorkflowType('coze');
      setWorkflowIsMemberFree(true);
      setWorkflowIsDownloadMemberFree(true);

      setWorkflowPreviewImages([]);
      setWorkflowPreviewVideo(null);
      setWorkflowCozeApi('');
      setWorkflowQuickCommands([]);
      setQuickCommandInput('');
    }
    
    setShowSubmissionModal(true);
  };
  
  // 关闭提交模态框
  const handleCloseSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSubmissionTaskId(null);
    setSubmissionFiles([]);
    
    // 重置工作流相关状态
    setWorkflowData(null);
    setWorkflowTitle('');
    setWorkflowDescription('');
    setWorkflowCategory('');
    setWorkflowTags([]);
    setWorkflowPrice(0);
    setWorkflowDownloadPrice(0);
    setWorkflowType('coze');
    setWorkflowIsMemberFree(true);
    setWorkflowIsDownloadMemberFree(true);

    setWorkflowPreviewImages([]);
    setWorkflowPreviewVideo(null);
    setWorkflowCozeApi('');
    setWorkflowQuickCommands([]);
    setQuickCommandInput('');
  };
  
  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 验证文件格式，只允许压缩包格式
    const allowedExtensions = ['.zip', '.rar', '.7z'];
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      return !allowedExtensions.some(ext => fileName.endsWith(ext));
    });
    
    if (invalidFiles.length > 0) {
      toast.error('只支持压缩包格式文件：.zip, .rar, .7z');
      return;
    }
    
    setSubmissionFiles(files);
  };
  
  // 重置进度状态
  const resetProgressState = () => {
    setUploadProgress(0);
    setCurrentUploadFile('');
    setUploadError(null);
    setUploadStep('workflow');
  };

  // 提交任务
  const handleSubmitTask = async () => {
    if (!submissionTaskId || !workflowTitle.trim() || !workflowDescription.trim()) {
      toast.error('请填写工作流标题和描述');
      return;
    }
    
    if (submissionFiles.length === 0) {
      toast.error('请上传工作流文件');
      return;
    }
    
    try {
      setSubmittingTask(true);
      resetProgressState();
      setShowProgressModal(true);
      
      // 计算总步骤数
      let totalSteps = 2; // 工作流文件上传 + 最终提交
      if (workflowPreviewImages.length > 0) totalSteps++;
      if (workflowPreviewVideo) totalSteps++;
      let currentStep = 0;
      
      // 上传工作流文件
      let workflowFileUrl = '';
      const currentFile = submissionFiles[0];
      
      // 检查是否为已存在的文件（重新提交时的虚拟文件）
      if ((currentFile as any).isExistingFile && workflowData?.file_url) {
        // 使用已存在的文件URL，跳过上传步骤
        workflowFileUrl = workflowData.file_url;
        setUploadStep('workflow');
        setCurrentUploadFile(currentFile.name + ' (使用已上传文件)');
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      } else {
        // 上传新文件
        try {
          setUploadStep('workflow');
          setCurrentUploadFile(currentFile.name);
          setUploadProgress(Math.round((currentStep / totalSteps) * 100));
          
          const workflowUploadResult = await creatorUploadApi.uploadWorkflowFile(currentFile);
          workflowFileUrl = workflowUploadResult.url;
          currentStep++;
          setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        } catch (uploadError: any) {
          console.error('工作流文件上传失败:', uploadError);
          setUploadError('工作流文件上传失败: ' + (uploadError.message || '未知错误'));
          return;
        }
      }
      
      // 上传预览图片（如果有）
      let previewImageUrls: string[] = [];
      if (workflowPreviewImages.length > 0) {
        setUploadStep('images');
        setCurrentUploadFile(`正在上传预览图片 (0/${workflowPreviewImages.length})`);
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        
        for (let i = 0; i < workflowPreviewImages.length; i++) {
          const image = workflowPreviewImages[i];
          setCurrentUploadFile(`正在上传预览图片 (${i + 1}/${workflowPreviewImages.length})`);
          
          // 检查是否为已存在的文件（重新提交时的虚拟文件）
          if ((image as any).isExistingFile && workflowData?.preview_images && workflowData.preview_images[i]) {
            // 使用已存在的文件URL，跳过上传步骤
            previewImageUrls.push(workflowData.preview_images[i]);
          } else {
            // 上传新文件
            try {
              const imageUploadResult = await creatorUploadApi.uploadCoverImage(image);
              previewImageUrls.push(imageUploadResult.url);
            } catch (uploadError: any) {
              console.error(`预览图片 ${i + 1} 上传失败:`, uploadError);
              setUploadError(`预览图片 ${i + 1} 上传失败: ` + (uploadError.message || '未知错误'));
              return;
            }
          }
        }
        
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      }
      
      // 上传预览视频（如果有）
      let previewVideoUrl = '';
      if (workflowPreviewVideo) {
        // 检查是否为已存在的文件（重新提交时的虚拟文件）
        if ((workflowPreviewVideo as any).isExistingFile && workflowData?.preview_video_url) {
          // 使用已存在的文件URL，跳过上传步骤
          previewVideoUrl = workflowData.preview_video_url;
          setUploadStep('video');
          setCurrentUploadFile(workflowPreviewVideo.name + ' (使用已上传文件)');
          setUploadProgress(Math.round((currentStep / totalSteps) * 100));
          currentStep++;
          setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        } else {
          // 上传新文件
          try {
            setUploadStep('video');
            setCurrentUploadFile(workflowPreviewVideo.name);
            setUploadProgress(Math.round((currentStep / totalSteps) * 100));
            
            const videoUploadResult = await creatorUploadApi.uploadPreviewVideo(workflowPreviewVideo);
            previewVideoUrl = videoUploadResult.url;
            currentStep++;
            setUploadProgress(Math.round((currentStep / totalSteps) * 100));
          } catch (uploadError: any) {
            console.error('预览视频上传失败:', uploadError);
            setUploadError('预览视频上传失败: ' + (uploadError.message || '未知错误'));
            return;
          }
        }
      }
      
      // 提交工作流到coze_workflows表
      try {
        setUploadStep('submitting');
        setCurrentUploadFile('正在提交工作流信息...');
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
        
        // 构建提交数据
        const submitData = {
          taskId: parseInt(submissionTaskId),
          title: workflowTitle,
          description: workflowDescription,
          category: workflowCategory,
          tags: workflowTags,
          price: workflowPrice,
          download_price: workflowDownloadPrice,
          type: workflowType,
          isMemberFree: workflowIsMemberFree,
          isDownloadMemberFree: workflowIsDownloadMemberFree,
          fileUrl: workflowFileUrl,
          fileName: submissionFiles && submissionFiles.length > 0 ? submissionFiles[0].name : undefined,
          fileSize: submissionFiles && submissionFiles.length > 0 ? submissionFiles[0].size : undefined,
          previewImages: previewImageUrls,
          previewVideoUrl: previewVideoUrl,
          quickCommands: workflowQuickCommands,
          cozeApi: workflowCozeApi
        }
        
        await taskApi.submitWorkflowForTask(submitData);
        setUploadProgress(100);
        
        // 延迟一下显示完成状态
        setTimeout(() => {
          setShowProgressModal(false);
          // 根据是否有已存在的工作流数据来显示不同的成功消息
          const isUpdate = workflowData && workflowData.id;
          toast.success(isUpdate ? '工作流更新成功！' : '工作流提交成功！');
          
          // 关闭模态框并刷新相应的任务列表
          handleCloseSubmissionModal();
          // 无论在哪个标签页，都需要刷新我的任务数据以更新按钮状态
          fetchMyTasks();
          if (activeTab === 'available') {
            fetchTasks();
          }
        }, 1000);
      } catch (submitError: any) {
        console.error('提交工作流失败:', submitError);
        setUploadError('提交工作流失败: ' + (submitError.response?.data?.message || submitError.message || '未知错误'));
        return;
      }
    } catch (error: any) {
      console.error('提交工作流失败:', error);
      setUploadError('提交失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setSubmittingTask(false);
    }
  };

  // 格式化日期
  

  // 检查任务是否即将到期
  const isDeadlineSoon = (endDate: string) => {
    const deadline = new Date(endDate);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // 检查任务是否已过期
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // 检查任务是否已满员 - 由于删除了max_submissions字段，暂时返回false
  const isFull = (_task: Task) => {
    return false;
  };

  // 获取任务状态徽章
  const getTaskStatusBadge = (task: Task) => {
    if (isExpired(task.end_date)) {
      return <Badge variant="danger">已过期</Badge>;
    }
    if (isFull(task)) {
      return <Badge variant="secondary">已满员</Badge>;
    }
    if (isDeadlineSoon(task.end_date)) {
      return <Badge variant="warning">即将截止</Badge>;
    }
    return <Badge variant="success">进行中</Badge>;
  };



  // 检查任务是否可以领取
  const canClaimTask = (task: Task) => {
    return !isExpired(task.end_date) && !isFull(task) && task.status === 'active';
  };

  // 获取我的任务状态徽章
  const getMyTaskStatusBadge = (status: string) => {
    const variants = {
      claimed: 'info' as const,
      pending: 'warning' as const,
      approved: 'success' as const,
      rejected: 'danger' as const,
      abandoned: 'secondary' as const,
    };
    const labels = {
      claimed: '已领取',
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
      abandoned: '已放弃',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };



  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">任务大厅</h1>
        <p className="text-gray-600 dark:text-gray-300">领取任务，完成挑战，获得佣金</p>
      </div>

      {/* 标签栏 */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('available')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <List className="h-4 w-4 mr-2" />
                任务列表
              </div>
            </button>
            <button
              onClick={() => handleTabChange('my-tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                我的任务
              </div>
            </button>
          </nav>
        </div>
      </div>





      {/* 任务内容区域 */}
      {activeTab === 'available' ? (
        // 可用任务列表
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无可用任务</h3>
              <p className="text-gray-500 dark:text-gray-400">请稍后再来查看新的任务</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {task.title}
                    </CardTitle>
                    <div className="text-lg font-bold text-green-600">
                      ¥{task.reward_amount}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {task.description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* 时间信息 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">开始时间:</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(task.start_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">结束时间:</span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {formatDate(task.end_date)}
                        </span>
                      </div>
                    </div>
                    
                    {/* 任务操作按钮 */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAvailableTaskDetail(task)}
                        className="flex-shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                      
                      {!userParticipations[task.id] ? (
                        <Button
                          className="flex-1"
                          onClick={() => handleClaimTask(task.id)}
                          disabled={!canClaimTask(task) || claimingTasks.has(task.id)}
                          variant={canClaimTask(task) ? "primary" : "secondary"}
                        >
                          {claimingTasks.has(task.id) ? (
                            '领取中...'
                          ) : !canClaimTask(task) ? (
                            isExpired(task.end_date) ? '已过期' :
                            isFull(task) ? '已满员' : '不可领取'
                          ) : (
                            '立即领取'
                          )}
                        </Button>
                      ) : (
                        // 检查用户是否已经提交了这个任务
                        (() => {
                          const submittedTask = myTasks.find(myTask => myTask.task_id === task.id && myTask.status !== 'claimed');
                          return submittedTask ? (
                            <Button
                              className="flex-1"
                              disabled={true}
                              variant="secondary"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              已提交
                            </Button>
                          ) : (
                            <Button
                              className="flex-1"
                              onClick={() => handleOpenSubmissionModal(task.id.toString())}
                              disabled={isExpired(task.end_date)}
                              variant="primary"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {isExpired(task.end_date) ? '已截止' : '提交任务'}
                            </Button>
                          );
                        })()
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        // 我的任务列表
        !user ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">请先登录</h3>
              <p className="text-gray-500 dark:text-gray-400">登录后查看您的任务</p>
            </CardContent>
          </Card>
        ) : myTasksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无任务</h3>
              <p className="text-gray-500 dark:text-gray-400">您还没有领取任何任务</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold line-clamp-2">
                      {task.task_title}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      {getMyTaskStatusBadge(task.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {task.task_description}
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* 领取/提交时间 */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {task.status === 'claimed' ? '领取时间:' : '提交时间:'}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {formatDate(task.status === 'claimed' ? (task.claimed_at || task.submitted_at) : task.submitted_at)}
                      </span>
                    </div>
                    
                    {/* 截止时间 */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">截止时间:</span>
                      <span className={`${
                        isExpired(task.end_date || task.task_end_date) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {formatDate(task.end_date || task.task_end_date)}
                      </span>
                    </div>
                    
                    {/* 奖励信息 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Gift className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm text-gray-600">佣金:</span>
                      </div>
                      <span className="font-semibold text-green-600">
                        ¥{task.task_reward_amount}
                      </span>
                    </div>
                    
                    {/* 审核意见 */}
                    {task.reviewer_comment && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">审核意见:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {task.reviewer_comment}
                        </p>
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTaskDetail(task)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                      
                      {/* 根据任务状态显示不同的操作按钮 */}
                      {task.status === 'claimed' && !isExpired(task.end_date || task.task_end_date) && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenSubmissionModal(task.task_id.toString())}
                            className="flex-1"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            提交任务
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleCancelTaskClaim(task.task_id)}
                            disabled={cancelingTaskId === task.task_id}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {cancelingTaskId === task.task_id ? '取消中...' : '取消领取'}
                          </Button>
                        </>
                      )}
                      
                      {task.status === 'rejected' && !isExpired(task.end_date || task.task_end_date) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSubmissionModal(task.task_id.toString())}
                            className="flex-1"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            重新提交
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleAbandonTask(task.id)}
                            disabled={abandoningTaskId === task.id}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {abandoningTaskId === task.id ? '放弃中...' : '放弃任务'}
                          </Button>
                        </>
                      )}
                      
                      {task.status === 'pending' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="flex-1"
                        >
                          待审核中
                        </Button>
                      )}
                      
                      {(task.status === 'approved' || task.status === 'abandoned') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled
                          className="flex-1"
                        >
                          {task.status === 'approved' ? '已完成' : '已放弃'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* 分页 */}
      {activeTab === 'available' ? (
        totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )
      ) : (
        myTasksTotalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={myTasksCurrentPage}
              totalPages={myTasksTotalPages}
              onPageChange={setMyTasksCurrentPage}
            />
          </div>
        )
      )}
      
      {/* 任务提交模态框 */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={handleCloseSubmissionModal}
        title="提交任务"
        size="lg"
      >
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-6">
          <div className="space-y-6">
            {/* 标题区域 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">提交您的任务成果</h3>
              <p className="text-slate-600 dark:text-slate-300">请详细描述您的完成情况并上传相关文件</p>
            </div>

            {/* 工作流信息 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                  <Send className="w-4 h-4 text-white" />
                </div>
                工作流信息
              </h4>
              

              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 工作流标题 */}
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
                
                {/* 工作流分类 */}
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
                            const isSelected = workflowTags.includes(tag.name);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setWorkflowTags(prev => prev.filter(t => t !== tag.name));
                                  } else {
                                    setWorkflowTags(prev => [...prev, tag.name]);
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
                        {workflowTags.length > 0 && (
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              已选择标签 ({workflowTags.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {workflowTags.map((tagName, index) => {
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
                                        setWorkflowTags(prev => prev.filter(t => t !== tagName));
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
                      <p className="text-sm text-gray-500">该分类暂无可选标签</p>
                    )}
                  </div>
                )}
                
                {/* 运行功能设置 */}
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">运行功能设置</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="runMemberFree"
                        checked={workflowIsMemberFree}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setWorkflowIsMemberFree(isChecked);
                          if (isChecked) {
                            setWorkflowPrice(0);
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
                      value={workflowPrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setWorkflowPrice(price);
                        if (price > 0) {
                          setWorkflowIsMemberFree(false);
                        }
                      }}
                      disabled={workflowIsMemberFree}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 ${
                        workflowIsMemberFree ? 'opacity-50 cursor-not-allowed' : ''
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
                        checked={workflowIsDownloadMemberFree}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setWorkflowIsDownloadMemberFree(isChecked);
                          if (isChecked) {
                            setWorkflowDownloadPrice(0);
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
                      value={workflowDownloadPrice}
                      onChange={(e) => {
                        const price = Number(e.target.value);
                        setWorkflowDownloadPrice(price);
                        if (price > 0) {
                          setWorkflowIsDownloadMemberFree(false);
                        }
                      }}
                      disabled={workflowIsDownloadMemberFree}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 text-slate-800 dark:text-slate-100 ${
                        workflowIsDownloadMemberFree ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              {/* 工作流描述 */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  工作流描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100 resize-none"
                  placeholder="请详细描述工作流的功能和用途"
                  required
                />
              </div>
              
              {/* Coze API 代码 */}
              <div className="mt-4">
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
              
              {/* 快捷指令 */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  快捷指令
                </label>
                <div className="space-y-3">
                  {/* 快捷指令输入框 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickCommandInput}
                      onChange={(e) => setQuickCommandInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-slate-100"
                      placeholder="输入快捷指令"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && quickCommandInput.trim()) {
                          e.preventDefault();
                          setWorkflowQuickCommands([...workflowQuickCommands, quickCommandInput.trim()]);
                          setQuickCommandInput('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (quickCommandInput.trim()) {
                          setWorkflowQuickCommands([...workflowQuickCommands, quickCommandInput.trim()]);
                          setQuickCommandInput('');
                        }
                      }}
                      disabled={!quickCommandInput.trim()}
                    >
                      添加
                    </Button>
                  </div>
                  
                  {/* 已添加的快捷指令列表 */}
                  {workflowQuickCommands.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        已添加的快捷指令 ({workflowQuickCommands.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {workflowQuickCommands.map((command, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                          >
                            <span>{command}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setWorkflowQuickCommands(workflowQuickCommands.filter((_, i) => i !== index));
                              }}
                              className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
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
            </div>
            

            
            {/* 工作流文件上传 */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                  <Upload className="w-4 h-4 text-white" />
                </div>
                工作流文件
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 工作流文件 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    工作流文件 <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('workflow-file-upload')?.click()}>
                    {submissionFiles.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-500 mr-2" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {(submissionFiles[0] as any).isExistingFile ? '已上传文件' : '已选择压缩包文件'}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{submissionFiles[0].name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {(submissionFiles[0].size / 1024).toFixed(1)} KB
                            {(submissionFiles[0] as any).isExistingFile && <span className="ml-1 text-green-600 dark:text-green-400">(无需重新上传)</span>}
                          </p>
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
                      onChange={handleFileChange}
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
                    预览图片 (最多5张，第一张为封面)
                  </label>
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('preview-images-upload')?.click()}>
                    {workflowPreviewImages.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-2">
                          {workflowPreviewImages.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="relative">
                                {(image as any).isExistingFile ? (
                                  <img src={(image as any).url} alt={`预览图片 ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                                ) : (
                                  <img src={URL.createObjectURL(image)} alt={`预览图片 ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                                )}
                                {index === 0 && (
                                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1 rounded">
                                    封面
                                  </div>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newImages = workflowPreviewImages.filter((_, i) => i !== index);
                                    setWorkflowPreviewImages(newImages);
                                  }}
                                  className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            已选择 {workflowPreviewImages.length} 张图片
                          </span>
                        </div>
                        {workflowPreviewImages.some((img: any) => img.isExistingFile) && (
                          <p className="text-xs text-green-600 dark:text-green-400">(已上传的图片无需重新上传)</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400">上传预览图片</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">支持 JPG, PNG 格式，最多5张</p>
                      </div>
                    )}
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const totalImages = workflowPreviewImages.length + files.length;
                          if (totalImages > 5) {
                            toast.error('最多只能上传5张图片');
                            return;
                          }
                          setWorkflowPreviewImages([...workflowPreviewImages, ...files]);
                        }
                      }}
                      className="hidden"
                      id="preview-images-upload"
                      accept=".jpg,.jpeg,.png"
                    />
                  </div>
                </div>
                
                {/* 预览视频 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    预览视频
                  </label>
                  <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('preview-video-upload')?.click()}>
                    {workflowPreviewVideo ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center">
                          <FileText className="w-6 h-6 text-purple-500 mr-2" />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {(workflowPreviewVideo as any).isExistingFile ? '已上传视频' : '已选择视频'}
                          </span>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{workflowPreviewVideo.name}</p>
                          {(workflowPreviewVideo as any).isExistingFile && (
                            <p className="text-xs text-green-600 dark:text-green-400">(无需重新上传)</p>
                          )}
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
                        const file = e.target.files?.[0];
                        if (file) setWorkflowPreviewVideo(file);
                      }}
                      className="hidden"
                      id="preview-video-upload"
                      accept=".mp4,.mov,.avi"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={handleCloseSubmissionModal}
                disabled={submittingTask}
                className="px-6"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmitTask}
                disabled={submittingTask || !workflowTitle.trim() || !workflowDescription.trim() || !workflowCategory.trim() || !workflowCozeApi.trim() || submissionFiles.length === 0}
                className="min-w-[120px] bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
              >
                {submittingTask ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    提交中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    提交任务
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 任务详情模态框 */}
      {showTaskDetailModal && selectedTask && (
        <Modal
          isOpen={showTaskDetailModal}
          onClose={handleCloseTaskDetailModal}
          title="任务详情"
        >
          <div className="space-y-4">
            {/* 任务基本信息 */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedTask.task_title}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedTask.task_description}</p>
            </div>
            
            {/* 任务状态和时间信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">任务状态</label>
                <div className="mt-1">
                  {getMyTaskStatusBadge(selectedTask.status)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">佣金金额</label>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  ¥{selectedTask.task_reward_amount}
                </p>
              </div>
            </div>
            
           
          
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">提交时间</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">{formatDate(selectedTask.submitted_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">截止时间</label>
                <p className={`mt-1 ${
                  isExpired(selectedTask.task_end_date) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatDate(selectedTask.task_end_date)}
                </p>
              </div>
            </div>
            
            {/* 提交内容 */}
            {selectedTask.submission_content && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">提交内容</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {selectedTask.submission_content}
                  </p>
                </div>
              </div>
            )}
            
            {/* 提交文件 */}
            {selectedTask.submission_files && selectedTask.submission_files.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">提交文件</label>
                <div className="mt-1 space-y-2">
                  {selectedTask.submission_files.map((file, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 审核意见 */}
            {selectedTask.reviewer_comment && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">审核意见</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {selectedTask.reviewer_comment}
                  </p>
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCloseTaskDetailModal}
                className="flex-1"
              >
                关闭
              </Button>
              
              {selectedTask.status === 'claimed' && !isExpired(selectedTask.task_end_date) && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleCloseTaskDetailModal();
                      handleOpenSubmissionModal(selectedTask.task_id.toString());
                    }}
                    className="flex-1"
                  >
                    提交任务
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleCloseTaskDetailModal();
                      handleCancelTaskClaim(selectedTask.task_id);
                    }}
                    disabled={cancelingTaskId === selectedTask.task_id}
                    className="flex-1"
                  >
                    {cancelingTaskId === selectedTask.task_id ? '取消中...' : '取消领取'}
                  </Button>
                </>
              )}
              
              {selectedTask.status === 'pending' && !isExpired(selectedTask.task_end_date) && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleCloseTaskDetailModal();
                      handleOpenSubmissionModal(selectedTask.task_id.toString());
                    }}
                    className="flex-1"
                  >
                    重新提交
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleCloseTaskDetailModal();
                      handleAbandonTask(selectedTask.id);
                    }}
                    disabled={abandoningTaskId === selectedTask.id}
                    className="flex-1"
                  >
                    {abandoningTaskId === selectedTask.id ? '放弃中...' : '放弃任务'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 可用任务详情模态框 */}
      {showAvailableTaskDetailModal && selectedAvailableTask && (
        <Modal
          isOpen={showAvailableTaskDetailModal}
          onClose={handleCloseAvailableTaskDetailModal}
          title="任务详情"
          size="lg"
        >
          <div className="space-y-6">
            {/* 任务基本信息 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedAvailableTask.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                   {getTaskStatusBadge(selectedAvailableTask)}
                  <Badge variant="outline" className="text-xs">
                    {selectedAvailableTask.category}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">任务描述</h4>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedAvailableTask.description}
                </p>
              </div>

              {/* 任务要求 */}
              {selectedAvailableTask.requirements && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">任务要求</h4>
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedAvailableTask.requirements}
                  </p>
                </div>
              )}

              {/* 提交类型 */}
              {selectedAvailableTask.submission_types && selectedAvailableTask.submission_types.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">提交类型</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAvailableTask.submission_types.map((type, index) => {
                      const typeLabels: { [key: string]: string } = {
                        'ai_app': 'AI应用',
                        'workflow': '工作流',
                        
                      };
                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeLabels[type] || type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">佣金金额</h4>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ¥{selectedAvailableTask.reward_amount}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">开始时间</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {formatDate(selectedAvailableTask.start_date)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">截止时间</h4>
                  <p className={`${
                    isExpired(selectedAvailableTask.end_date) 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {formatDate(selectedAvailableTask.end_date)}
                    {isExpired(selectedAvailableTask.end_date) && ' (已过期)'}
                  </p>
                </div>
              </div>




            </div>
          </div>

          {/* 模态框底部按钮 */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCloseAvailableTaskDetailModal}
              className="flex-1"
            >
              关闭
            </Button>
            
            {!userParticipations[selectedAvailableTask.id] ? (
              <Button
                onClick={() => {
                  handleCloseAvailableTaskDetailModal();
                  handleClaimTask(selectedAvailableTask.id);
                }}
                disabled={!canClaimTask(selectedAvailableTask) || claimingTasks.has(selectedAvailableTask.id)}
                variant={canClaimTask(selectedAvailableTask) ? "primary" : "secondary"}
                className="flex-1"
              >
                {claimingTasks.has(selectedAvailableTask.id) ? (
                  '领取中...'
                ) : !canClaimTask(selectedAvailableTask) ? (
                  isExpired(selectedAvailableTask.end_date) ? '已过期' :
                  isFull(selectedAvailableTask) ? '已满员' : '不可领取'
                ) : (
                  '立即领取'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  handleCloseAvailableTaskDetailModal();
                  handleOpenSubmissionModal(selectedAvailableTask.id.toString());
                }}
                disabled={isExpired(selectedAvailableTask.end_date)}
                variant="primary"
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {isExpired(selectedAvailableTask.end_date) ? '已截止' : '提交任务'}
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* 上传进度模态框 */}
      {showProgressModal && (
        <Modal
          isOpen={showProgressModal}
          onClose={() => {
            if (!submittingTask) {
              setShowProgressModal(false);
              resetProgressState();
            }
          }}
          title="提交进度"
        >
          <div className="space-y-6">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">上传进度</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>

            {/* 当前上传文件信息 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {uploadError ? (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                ) : uploadProgress === 100 ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {uploadError ? '上传失败' : uploadProgress === 100 ? '上传完成' : (() => {
                      switch (uploadStep) {
                        case 'workflow': return '正在上传工作流文件...';
                        case 'images': return '正在上传预览图片...';
                        case 'video': return '正在上传预览视频...';
                        case 'submitting': return '正在提交工作流信息...';
                        default: return '正在处理...';
                      }
                    })()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {currentUploadFile}
                  </p>
                </div>
              </div>
            </div>

            {/* 错误信息 */}
            {uploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    {uploadError}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3">
              {uploadError ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowProgressModal(false);
                      resetProgressState();
                    }}
                    className="flex-1"
                  >
                    关闭
                  </Button>
                  <Button
                    onClick={() => {
                      resetProgressState();
                      handleSubmitTask();
                    }}
                    className="flex-1"
                  >
                    重试
                  </Button>
                </>
              ) : uploadProgress === 100 ? (
                <Button
                  onClick={() => {
                    setShowProgressModal(false);
                    resetProgressState();
                  }}
                  className="w-full"
                >
                  完成
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    // 这里可以添加取消上传的逻辑
                    setShowProgressModal(false);
                    resetProgressState();
                    setSubmittingTask(false);
                  }}
                  className="w-full"
                  disabled={submittingTask}
                >
                  取消
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );


};

export default TaskHallPage;