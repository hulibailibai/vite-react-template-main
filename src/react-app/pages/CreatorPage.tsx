import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  BarChart3, 
  DollarSign, 
  Download, 
  Star, 
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  Workflow as WorkflowIcon,
  ArrowUpRight,
  VolumeX,
  Volume2,
  FileText,
  Settings,
  AlertCircle,
  XCircle,
  CheckCircle,
  Coins,
  Crown,
  Zap,
  Sparkles,
  Send,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';
import { Workflow, CreatorStats, CreatorApplication } from '../types';
import api from '../services/api';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import WorkListTable from '../components/creator/WorkListTable';


// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className }) => (
  <Card className={clsx('p-6', className)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
        {trend && (
          <div className={clsx(
            'flex items-center mt-2 text-sm',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <TrendingUp className={clsx('w-4 h-4 mr-1', !trend.isPositive && 'rotate-180')} />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        {icon}
      </div>
    </div>
  </Card>
);



// 工作流创作者卡片组件
 interface WorkflowCreatorCardProps {
   workflow: Workflow;
 }
 
 const WorkflowCreatorCard: React.FC<WorkflowCreatorCardProps> = ({ workflow }) => {
  const navigate = useNavigate();
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleView = () => {
    navigate(`/coze-workflow/${workflow.id}`);
  };
 
   // 挂载后确保视频自动播放（在静音状态下浏览器允许自动播放）
   useEffect(() => {
     if (!videoRef.current) return;
     const videoEl = videoRef.current;
     videoEl.muted = isVideoMuted;
     const p = videoEl.play();
     if (p && typeof p.then === 'function') {
       p.catch(() => {});
     }
   }, []);
 
   // 当静音状态切换时，同步到 video 元素
   useEffect(() => {
     if (videoRef.current) {
       videoRef.current.muted = isVideoMuted;
       // 取消静音后在用户点击的手势下播放有声
       if (!isVideoMuted) {
         const p = videoRef.current.play();
         if (p && typeof p.then === 'function') {
           p.catch(() => {});
         }
       }
     }
   }, [isVideoMuted]);
 
   // 处理取消静音
   const handleUnmuteClick = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     if (videoRef.current) {
       const newMutedState = !isVideoMuted;
       setIsVideoMuted(newMutedState);
       videoRef.current.muted = newMutedState;
     }
   };
 
   // 预览媒体组件
   const PreviewMedia: React.FC<{ className?: string }> = ({ className }) => {
     const hasVideo = workflow.preview_video;
     const previewImage = workflow.preview_images?.[0] || `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(workflow.title)}`;
 
     if (hasVideo) {
       return (
         <div className={`${className} relative group`}>
           <video
             ref={videoRef}
             src={workflow.preview_video}
             className="w-full h-full object-cover rounded-lg"
             muted={isVideoMuted}
             loop
             playsInline
             autoPlay
           />
           {/* 取消静音按钮：默认隐藏，悬停视频时显示 */}
           <div className="absolute top-1/2 right-2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
             <button
               onClick={handleUnmuteClick}
               className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
               title={isVideoMuted ? '取消静音' : '静音'}
             >
               {isVideoMuted ? (
                 <VolumeX className="w-3 h-3" />
               ) : (
                 <Volume2 className="w-3 h-3" />
               )}
             </button>
           </div>
         </div>
       );
     }
 
     return (
       <img
         src={previewImage || `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(workflow.title)}`}
         alt={workflow.title}
         className={className}
       />
     );
   };
 
   return (
     <div className="group hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden w-[300px] rounded-lg" onClick={handleView}>
       <div className="relative">
         <PreviewMedia className="w-full h-[400px] object-cover rounded-lg" />
         
         {/* 推荐标签 */}
         {workflow.is_featured && (
           <div className="absolute top-4 left-4 z-10">
             <Badge variant="primary" className="text-xs shadow-lg">
               <Sparkles className="w-3 h-3 mr-1" />
               推荐
             </Badge>
           </div>
         )}
         
         {/* 价格 */}
         <div className="absolute top-4 right-4 z-10">
           {workflow.price === 0 ? (
             workflow.is_member_free ? (
               <Badge variant="primary" className="text-xs font-semibold shadow-lg bg-purple-600 text-white">
                 会员免费
               </Badge>
             ) : (
               <Badge variant="success" className="text-xs font-semibold shadow-lg">
                 免费
               </Badge>
             )
           ) : (
             <Badge variant="primary" className="text-xs font-semibold shadow-lg">
               {workflow.price}
             </Badge>
           )}
         </div>
         
         {/* 标签显示 */}
         {workflow.tags && workflow.tags.length > 0 && (
           <div className="absolute top-16 right-4 z-10 flex flex-col gap-1 max-w-[120px]">
             {workflow.tags.slice(0, 2).map((tag, index) => (
               <Badge key={index} variant="secondary" className="text-xs shadow-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                 {tag}
               </Badge>
             ))}
             {workflow.tags.length > 2 && (
               <Badge variant="secondary" className="text-xs shadow-lg bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                 +{workflow.tags.length - 2}
               </Badge>
             )}
           </div>
         )}
         
         {/* 标题和作者信息 - 左下角 */}
         <div className="absolute bottom-4 left-4 z-10">
           <h3 className="text-lg font-extrabold mb-2 line-clamp-1 text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
             {workflow.title}
           </h3>
           <div className="flex items-center space-x-2">
             <img
               src={workflow.creator?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(workflow.creator?.username || 'User')}&size=40&background=6366f1&color=ffffff&rounded=true`}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(workflow.creator?.username || 'User')}&size=40&background=6366f1&color=ffffff&rounded=true`;
              }}
               alt={workflow.creator?.username || 'User'}
               className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
             />
             <span className="text-sm font-semibold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
               {workflow.creator?.username || 'Unknown'}
             </span>
           </div>
         </div>
         
         {/* 统计信息 - 右下角：统一为高对比白色 + 轻阴影 */}
         <div className="absolute bottom-4 right-4 text-sm z-10">
           <div className="flex items-center space-x-3 text-white">
             <div className="flex items-center space-x-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
               <Download className="w-4 h-4" />
               <span className="font-semibold">{(workflow.download_count || 0) > 1000 ? `${((workflow.download_count || 0) / 1000).toFixed(1)}k` : (workflow.download_count || 0)}</span>
             </div>
             <div className="flex items-center space-x-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]">
               <Eye className="w-4 h-4" />
               <span className="font-semibold">{(workflow.view_count || 0) > 1000 ? `${((workflow.view_count || 0) / 1000).toFixed(1)}k` : (workflow.view_count || 0)}</span>
             </div>
           </div>
         </div>
         
         {/* 渐变遮罩：不拦截鼠标事件，避免阻止视频区域的 hover */}
         <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
       </div>
     </div>
   );
 };


// 创作者中心页面组件
export const CreatorPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showSuccess, showError, showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats | null>(null);

  const [application, setApplication] = useState<CreatorApplication | null>(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [whBalance, setWhBalance] = useState(0);
  const [allWorks, setAllWorks] = useState<any[]>([]);
  
  // 收益记录相关状态
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotalPages, setEarningsTotalPages] = useState(1);
  
  // 提现相关状态
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  
  // 编辑相关状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<(Workflow & { type?: string }) | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: 0,
    is_free_for_members: false,
    category: '',
    customCategory: '',
    country: '',
    customCountry: '',
    tags: [] as string[],
    customTags: [] as string[]
  });

  // 任务提交相关状态
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submittingTask, setSubmittingTask] = useState(false);
  
  // 工作流提交相关状态
  const [workflowTitle, setWorkflowTitle] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState('');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);
  const [workflowPrice, setWorkflowPrice] = useState(0);
  const [workflowDownloadPrice, setWorkflowDownloadPrice] = useState(0);
  const [workflowIsMemberFree, setWorkflowIsMemberFree] = useState(true);
  const [workflowIsDownloadMemberFree, setWorkflowIsDownloadMemberFree] = useState(true);
  const [workflowPreviewImages, setWorkflowPreviewImages] = useState<File[]>([]);
  const [workflowPreviewVideo, setWorkflowPreviewVideo] = useState<File | null>(null);
  const [workflowCozeApi, setWorkflowCozeApi] = useState('');
  const [workflowQuickCommands, setWorkflowQuickCommands] = useState<string[]>([]);
  const [quickCommandInput, setQuickCommandInput] = useState('');
  
  // 分类和标签相关状态
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [availableTags, setAvailableTags] = useState<Array<{id: number, name: string, color: string}>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  
  // 上传进度相关状态
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadStep, setUploadStep] = useState('');
  
  // 重置进度状态
  const resetProgressState = () => {
    setUploadProgress(0);
    setCurrentUploadFile('');
    setUploadError('');
    setUploadStep('');
  };
  



  // 标签页配置
  const tabs = [
    { id: 'overview', label: '概览', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'workflows', label: '我的Coze工作流', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', label: '数据分析', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'earnings', label: '收益管理', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'settings', label: '设置', icon: <Settings className="w-4 h-4" /> },
  ];

  // 加载创作者申请状态
  useEffect(() => {
    const loadApplicationStatus = async () => {
      if (!user) return;

      try {
        setApplicationLoading(true);
        const applicationData = await api.creator.getApplication();
        setApplication(applicationData);
      } catch (error) {
        console.error('Failed to load application status:', error);
      } finally {
        setApplicationLoading(false);
      }
    };

    loadApplicationStatus();
  }, [user]);

  // 加载创作者数据
  useEffect(() => {
    const loadCreatorData = async () => {
      if (!user || user.role !== 'creator') return;

      try {
        setLoading(true);
        const [statsData, workflowsData] = await Promise.all([
          api.creator.getCreatorStats(),
          api.creator.getCreatorWorkflows({ pageSize: 50 }),
        ]);
        
        // 确保正确处理统计数据结构
        console.log('原始统计数据:', statsData);
        
        if (statsData && (statsData as any).data) {
          const data = (statsData as any).data;
          const processedStats = {
            totalEarnings: data.total_earnings || 0,
            monthlyEarnings: data.monthly_earnings || 0,
            workflowCount: data.workflow_count || data.total_works || 0,
            totalWorks: data.total_works || 0,
            averageRating: data.average_rating || 0,
            totalDownloads: data.total_downloads || 0
          };
          console.log('处理后的统计数据:', processedStats);
          setStats(processedStats);
        } else {
          // 如果数据结构不同，直接使用返回的数据
          console.log('直接使用统计数据:', statsData);
          setStats(statsData as CreatorStats);
        }
        
        // 处理Coze工作流数据
        const workflowsWithType = workflowsData.items.map((workflow: Workflow) => ({
          ...workflow,
          type: 'workflow' as const,
          itemType: 'workflow'
        }));
        
        // 按创建时间排序
        const allWorksData = workflowsWithType
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // 设置所有作品数据
        setAllWorks(allWorksData);
        
        // 加载WH币余额
        fetchWhBalance();
        
        // 加载用户余额
        fetchUserBalance();
        
        // 检查是否为首次进入创作者中心
        const hasSeenWelcome = localStorage.getItem(`creator-welcome-${user.id}`);
        if (!hasSeenWelcome) {
          setShowWelcome(true);
          localStorage.setItem(`creator-welcome-${user.id}`, 'true');
        }
      } catch (error) {
        console.error('Failed to load creator data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCreatorData();
  }, [user]);

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

  // 根据分类获取标签
  useEffect(() => {
    const fetchTags = async () => {
      if (!workflowCategory) {
        setAvailableTags([]);
        return;
      }

      try {
        setLoadingTags(true);
        const response = await fetch(`/api/tags?category_id=${workflowCategory}`);
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

    fetchTags();
  }, [workflowCategory]);

  // 监听标签页切换，加载收益记录
  useEffect(() => {
    if (activeTab === 'earnings' && user && user.role === 'creator') {
      fetchEarningsHistory(1);
    }
  }, [activeTab, user]);

  // 获取WH币余额
  const fetchWhBalance = async () => {
    try {
      // 使用真实的API调用获取WH币余额
      const response = await api.user.getMembership();
      console.log('WH币余额API响应:', response);
      
      // 处理不同的响应数据结构
      let whCoins = 0;
      if (response.data && typeof response.data.wh_coins === 'number') {
        whCoins = response.data.wh_coins;
      } else if (response.wh_coins !== undefined) {
        whCoins = response.wh_coins;
      } else if (user && user.wh_coins !== undefined) {
        whCoins = user.wh_coins;
      }
      
      console.log('设置WH币余额:', whCoins);
      setWhBalance(whCoins);
    } catch (error) {
      console.error('获取WH币余额失败:', error);
      // 如果API调用失败，尝试从用户信息中获取
      if (user && user.wh_coins !== undefined) {
        console.log('从用户信息获取WH币:', user.wh_coins);
        setWhBalance(user.wh_coins);
      } else {
        setWhBalance(0);
      }
    }
  };

  // 获取用户余额
  const fetchUserBalance = async () => {
    try {
      // 使用API客户端获取用户资料，包含total_earnings字段
      const response = await api.user.getProfile();
      console.log('用户余额API响应:', response);
      
      // 处理不同的响应数据结构
      let balance = 0;
      if (response.data) {
        // 优先使用total_earnings作为可提现余额
        balance = response.data.total_earnings || response.data.balance || 0;
      } else if (response.total_earnings !== undefined) {
        balance = response.total_earnings;
      } else if (response.balance !== undefined) {
        balance = response.balance;
      } else if (user && user.total_earnings !== undefined) {
        balance = user.total_earnings;
      }
      
      console.log('设置用户余额:', balance);
      setUserBalance(balance);
    } catch (error) {
      console.error('获取用户余额失败:', error);
      // 如果API调用失败，尝试从用户信息中获取
      if (user && user.total_earnings !== undefined) {
        console.log('从用户信息获取余额:', user.total_earnings);
        setUserBalance(user.total_earnings);
      } else {
        setUserBalance(0);
      }
    }
  };



  // 实时验证提现金额
  const validateWithdrawAmount = (amount: string): string | null => {
    if (!amount) return '请输入提现金额';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '请输入有效的金额';
    if (numAmount <= 0) return '提现金额必须大于0元';
    if (numAmount > userBalance) return '提现金额不能超过可用余额';
    if (numAmount !== parseFloat(numAmount.toFixed(2))) return '金额最多保留两位小数';
    
    return null;
  };

  // 微信授权
  const handleWechatAuth = () => {
    const redirectUri = encodeURIComponent('https://www.ai757.cn/auth/wechat/callback');
    
    // 使用网站应用授权登录（二维码扫码）
    const wechatAuthUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=wx3cb32b212d933aa0&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=withdraw#wechat_redirect`;
    window.location.href = wechatAuthUrl;
  };

  // 申请提现
  const handleWithdraw = async () => {
    // 验证提现金额
    const amountError = validateWithdrawAmount(withdrawAmount);
    if (amountError) {
      showError(amountError);
      return;
    }

    // 检查用户是否已绑定微信openid
    if (!user?.wechat_openid) {
      showError('请先绑定微信账号');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    try {
      setWithdrawLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('认证失败，请重新登录');
        setWithdrawLoading(false);
        return;
      }

      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          payment_method: 'wechat'
        })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(data.data.message);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        // 刷新余额
        fetchUserBalance();
      } else {
        showError(data.message || '提现申请失败');
      }
    } catch (error) {
      console.error('提现申请失败:', error);
      showError('提现申请失败，请稍后重试');
    } finally {
      setWithdrawLoading(false);
    }
  };



  // 获取收益记录
  const fetchEarningsHistory = async (page: number = 1) => {
    if (!user) return;
    
    try {
      setEarningsLoading(true);
      const response = await api.creator.getEarningsHistory({
        page,
        pageSize: 10
      });
      
      // 处理PaginatedResponse数据结构
      const earningsData = response.items || [];
      const totalPages = response.pagination?.totalPages || 1;
      
      if (page === 1) {
        setEarningsHistory(earningsData);
      } else {
        setEarningsHistory(prev => [...prev, ...earningsData]);
      }
      
      setEarningsTotalPages(totalPages);
      setEarningsPage(page);
    } catch (error) {
      console.error('获取收益记录失败:', error);
      showError('获取收益记录失败，请稍后重试');
    } finally {
      setEarningsLoading(false);
    }
  };






  // 处理编辑作品
  const handleEditWork = (work: any) => {
    setEditingWorkflow(work);
    setEditFormData({
      title: work.title || '',
      description: work.description || '',
      price: work.price || 0,
      is_free_for_members: work.is_member_free || false,
      category: work.category || '',
      customCategory: '',
      country: work.country || '',
      customCountry: '',
      tags: work.tags || [],
      customTags: []
    });
    setEditModalOpen(true);
  };

  // 处理提交模态框
  const handleCloseSubmissionModal = () => {
    setShowSubmissionModal(false);
    // 重置表单数据
    setWorkflowTitle('');
    setWorkflowDescription('');
    setWorkflowCategory('');
    setWorkflowTags([]);
    setWorkflowPrice(0);
    setWorkflowDownloadPrice(0);
    setWorkflowIsMemberFree(true);
    setWorkflowIsDownloadMemberFree(true);
    setWorkflowPreviewImages([]);
    setWorkflowPreviewVideo(null);
    setWorkflowCozeApi('');
    setWorkflowQuickCommands([]);
    setQuickCommandInput('');
    setSubmissionFiles([]);
  };

  // 处理工作流提交
  const handleSubmitWorkflow = async () => {
    if (!workflowTitle.trim() || !workflowDescription.trim() || !workflowCategory) {
      showAlert(t('请填写完整的工作流信息'), 'error');
      return;
    }

    if (submissionFiles.length === 0) {
      showAlert(t('请上传工作流文件'), 'error');
      return;
    }

    setSubmittingTask(true);
    resetProgressState();
    setShowProgressModal(true);
    
    try {
      // 计算总步骤数
      let totalSteps = 2; // 工作流文件上传 + 最终提交
      if (workflowPreviewImages.length > 0) totalSteps++;
      if (workflowPreviewVideo) totalSteps++;
      let currentStep = 0;
      
      // 上传工作流文件
      setUploadStep('workflow');
      setCurrentUploadFile(submissionFiles[0]?.name || '工作流文件');
      setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      
      // 上传工作流文件（逐个上传）
      const uploadedFiles = [];
      for (let i = 0; i < submissionFiles.length; i++) {
        const file = submissionFiles[i];
        
        const fileUploadResult = await api.creatorUpload.uploadWorkflowFile(file);
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          url: fileUploadResult.url
        });
      }
      currentStep++;
      setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      
      // 上传预览图片
      let previewImageUrls = [];
      if (workflowPreviewImages.length > 0) {
        setUploadStep('images');
        setCurrentUploadFile(`预览图片 (${workflowPreviewImages.length}张)`);
        
        // 逐个上传预览图片
        for (let i = 0; i < workflowPreviewImages.length; i++) {
          const file = workflowPreviewImages[i];
          
          const imageUploadResult = await api.creatorUpload.uploadCoverImage(file);
          previewImageUrls.push(imageUploadResult.url);
        }
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      }
      
      // 上传预览视频
      let previewVideoUrl = '';
      if (workflowPreviewVideo) {
        setUploadStep('video');
        setCurrentUploadFile(workflowPreviewVideo.name);
        
        const videoUploadResult = await api.creatorUpload.uploadPreviewVideo(workflowPreviewVideo);
        previewVideoUrl = videoUploadResult.url;
        currentStep++;
        setUploadProgress(Math.round((currentStep / totalSteps) * 100));
      }
      
      // 最终提交工作流数据
      setUploadStep('submitting');
      setCurrentUploadFile('提交工作流数据');
      
      const workflowData = {
        title: workflowTitle,
        description: workflowDescription,
        category: workflowCategory,
        tags: workflowTags,
        price: workflowPrice,
        download_price: workflowDownloadPrice,
        type: 'coze',
        isMemberFree: workflowIsMemberFree,
        isDownloadMemberFree: workflowIsDownloadMemberFree,
        fileUrl: uploadedFiles[0]?.url || '',
        fileName: uploadedFiles[0]?.name || '',
        fileSize: uploadedFiles[0]?.size || 0,
        files: uploadedFiles,
        previewImages: previewImageUrls,
        previewVideoUrl: previewVideoUrl,
        quickCommands: workflowQuickCommands,
        cozeApi: workflowCozeApi
      };

      // 调用新的上传工作流接口
      const response = await fetch('/api/creator/coze-workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(workflowData)
      });

      if (response.ok) {
        const result = await response.json();
        setUploadProgress(100);
        setCurrentUploadFile('上传完成');
        showAlert(result.data?.message || t('工作流上传成功！'), 'success');
        
        // 延迟关闭模态框，让用户看到完成状态
        setTimeout(() => {
          setShowProgressModal(false);
          handleCloseSubmissionModal();
          refreshWorks(); // 重新加载数据
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '工作流提交失败');
      }
    } catch (error: any) {
      console.error('Upload workflow error:', error);
      setUploadError(error.message || t('上传失败，请重试'));
      setCurrentUploadFile('上传失败');
    } finally {
      setSubmittingTask(false);
    }
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSubmissionFiles(files);
  };

  // 处理任务提交（别名）
  const handleSubmitTask = handleSubmitWorkflow;

  // 刷新作品数据
  const refreshWorks = async () => {
    try {
      const workflowsData = await api.creator.getCreatorWorkflows({ pageSize: 50 });
      
      const workflowsWithType = workflowsData.items.map((workflow: Workflow) => ({
        ...workflow,
        type: 'workflow' as const,
        itemType: 'workflow'
      }));
      
      const allWorksData = workflowsWithType
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAllWorks(allWorksData);
    } catch (error) {
      console.error('Failed to refresh works:', error);
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingWorkflow) return;

    try {
      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        price: editFormData.price,
        is_member_free: editFormData.is_free_for_members
      };

      if (editingWorkflow.type === 'workflow') {
        await api.creator.updateWorkflow(editingWorkflow.id, updateData);
        showSuccess('Coze工作流更新成功');
      }

      // 重新加载数据
      await refreshWorks();
      setEditModalOpen(false);
      setEditingWorkflow(null);
    } catch (error: any) {
      showError(error.response?.data?.message || '更新失败');
    }
  };





  // 处理申请操作
  const handleWithdrawApplication = async () => {
    if (!application || !confirm('确定要撤回申请吗？')) return;

    try {
      await api.creator.withdrawApplication(application.id);
      setApplication(null);
      showSuccess('申请已撤回');
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      showError('撤回申请失败，请重试');
    }
  };

  // 渲染概览页面
  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* 欢迎横幅 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">欢迎回来，{user?.username}！</h2>
              <p className="text-blue-100">继续创作精彩内容，赚取更多收益</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-semibold">{whBalance.toLocaleString()} WH币</span>
            </div>

          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="总收益"
          value={`¥${stats?.totalEarnings.toFixed(2) || '0.00'}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trend={{ value: 12.5, isPositive: true }}
          className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800"
        />
        <StatsCard
          title="本月收益"
          value={`¥${stats?.monthlyEarnings.toFixed(2) || '0.00'}`}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          trend={{ value: 8.2, isPositive: true }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800"
        />
        <StatsCard
          title="作品数量"
          value={stats?.workflowCount || 0}
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800"
        />
        <StatsCard
          title="总下载量"
          value={stats?.totalDownloads || 0}
          icon={<Download className="w-6 h-6 text-orange-600" />}
          trend={{ value: 15.3, isPositive: true }}
          className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800"
        />
      </div>

      {/* 快速操作 */}
      <Card className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            快速操作
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">开始创作赚取WH币</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            className="flex items-center justify-center space-x-3 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setShowSubmissionModal(true)}
          >
            <WorkflowIcon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">上传Coze工作流</div>
              <div className="text-xs opacity-90">分享自动化流程</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-3 h-14 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl transition-all duration-200"
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold">数据分析</div>
              <div className="text-xs text-gray-500">查看详细统计</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center space-x-3 h-14 border-2 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 rounded-xl transition-all duration-200"
            onClick={() => setActiveTab('earnings')}
          >
            <DollarSign className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="font-semibold">收益提现</div>
              <div className="text-xs text-gray-500">管理收入</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* 最新作品 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
            最新作品
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('workflows')}
            className="flex items-center space-x-2 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/20"
          >
            <span>查看全部</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 作品类型标签 */}
        <div className="flex items-center space-x-8 mb-6">
          <div className="px-2 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 flex items-center space-x-2">
            <WorkflowIcon className="w-4 h-4" />
            <span>Coze工作流</span>
          </div>
        </div>
        
        {(() => {
          // 过滤Coze工作流
          const filteredWorks = allWorks.filter(work => work.itemType === 'workflow');
          
          return filteredWorks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
              {filteredWorks
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((work) => (
                  <WorkflowCreatorCard
                    key={`workflow-${work.id}`}
                    workflow={work as Workflow}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <FileText className="w-10 h-10 text-purple-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                还没有Coze工作流
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                快去上传第一个Coze工作流，开始赚取WH币吧！
              </p>

            </div>
          );
        })()}
      </div>
    </div>
  );

  // 渲染作品管理页面
  const renderWorkflowsTab = () => (
    <div className="space-y-6">


      {/* 作品类型标签 */}
      <div className="flex items-center space-x-8 mb-6">
        <div className="px-2 py-2 text-sm font-medium flex items-center space-x-2 border-b-2 text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400">
          <WorkflowIcon className="w-4 h-4" />
          <span>Coze工作流</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          共 {allWorks.filter(work => work.itemType === 'workflow').length} 个Coze工作流
        </div>
      </div>
      
      {(() => {
        // 过滤Coze工作流
        const filteredWorks = allWorks.filter(work => work.itemType === 'workflow');
        
        return filteredWorks.length > 0 ? (
          <WorkListTable
            works={filteredWorks}
            loading={loading}
            onEdit={handleEditWork}
            onRefresh={refreshWorks}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              还没有Coze工作流
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              快去上传第一个Coze工作流，开始赚取WH币吧！
            </p>

          </div>
        );
      })()}
    </div>
  );

  // 渲染数据分析页面
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">数据分析</h2>
      
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="总浏览量"
          value="12,345"
          icon={<Eye className="w-6 h-6 text-blue-600" />}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title="转化率"
          value="3.2%"
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          trend={{ value: 0.8, isPositive: true }}
        />
        <StatsCard
          title="平均评分"
          value={stats?.averageRating.toFixed(1) || '0.0'}
          icon={<Star className="w-6 h-6 text-yellow-600" />}
        />
      </div>

      {/* 图表占位符 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">下载趋势</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表功能开发中...</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">收益趋势</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">图表功能开发中...</p>
          </div>
        </Card>
      </div>
    </div>
  );

  // 渲染收益管理页面
  const renderEarningsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">收益管理</h2>
      
      {/* 收益概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="可提现余额"
          value={`¥${userBalance.toFixed(2)}`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
        />
        <StatsCard
          title="本月收益"
          value={`¥${stats?.monthlyEarnings.toFixed(2) || '0.00'}`}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
        />
        <StatsCard
          title="累计提现"
          value="¥0.00"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* 提现操作 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">申请提现</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              提现申请将在3-5个工作日内处理
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            可提现余额：¥{userBalance.toFixed(2)}
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowWithdrawModal(true)}
            disabled={userBalance <= 0}
          >
            申请提现
          </Button>
        </div>
      </Card>

      {/* 收益记录 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">收益记录</h3>
        
        {earningsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
          </div>
        ) : earningsHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            暂无收益记录
          </div>
        ) : (
          <div className="space-y-4">
            {/* 收益记录列表 */}
            <div className="space-y-3">
              {earningsHistory.map((earning) => (
                <div key={earning.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge 
                          variant={earning.status === 'completed' ? 'success' : earning.status === 'pending' ? 'warning' : 'secondary'}
                          className="text-xs"
                        >
                          {earning.status === 'completed' ? '已完成' : earning.status === 'pending' ? '待发放' : '已取消'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {earning.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        +¥{earning.rmb_amount}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {earning.actual_date ? new Date(earning.actual_date).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 加载更多按钮 */}
            {earningsPage < earningsTotalPages && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchEarningsHistory(earningsPage + 1)}
                  disabled={earningsLoading}
                >
                  {earningsLoading ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );

  // 渲染设置页面
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">创作者设置</h2>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">创作者信息</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              创作者简介
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="介绍一下您的专业背景和创作理念..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              专业领域
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：自动化、数据分析、设计等"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">收益设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">自动提现</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">当余额达到指定金额时自动申请提现</p>
            </div>
            <input type="checkbox" className="toggle" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              自动提现金额
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500"
              min="100"
            />
          </div>
        </div>
      </Card>
    </div>
  );

  // 渲染申请状态页面
  const renderApplicationStatus = () => {
    if (applicationLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!application) {
      // 用户还没有申请
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">需要创作者权限</h2>
            <p className="text-gray-300 mb-6">您需要成为创作者才能访问此页面</p>
            <Button onClick={() => window.location.href = '/become-creator'}>
              申请成为创作者
            </Button>
          </Card>
        </div>
      );
    }

    if (application.status === 'pending') {
      // 申请审核中
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <Card className="p-8 text-center max-w-2xl">
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">申请审核中</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">您的创作者申请正在审核中，请耐心等待</p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">申请信息：</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">国家/地区：</span>{application.country}</p>
                <p><span className="font-medium">工作经验：</span>{application.experience}</p>
                <p><span className="font-medium">申请理由：</span>{application.reason}</p>
                <p><span className="font-medium">专业技能：</span>{application.skills}</p>
                {application.linkedin && <p><span className="font-medium">LinkedIn：</span>{application.linkedin}</p>}
                {application.portfolio && <p><span className="font-medium">作品集：</span>{application.portfolio}</p>}
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/become-creator'}
              >
                修改申请资料
              </Button>
              <Button 
                variant="outline"
                onClick={handleWithdrawApplication}
                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                撤回申请
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    if (application.status === 'rejected') {
      // 申请被拒绝
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-2xl">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">申请被拒绝</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">很抱歉，您的创作者申请未通过审核</p>
            
            {application.admin_comment && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">拒绝理由：</h3>
                <p className="text-red-800 dark:text-red-400">{application.admin_comment}</p>
              </div>
            )}
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">原申请信息：</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">国家/地区：</span>{application.country}</p>
                <p><span className="font-medium">工作经验：</span>{application.experience}</p>
                <p><span className="font-medium">申请理由：</span>{application.reason}</p>
                <p><span className="font-medium">专业技能：</span>{application.skills}</p>
                {application.linkedin && <p><span className="font-medium">LinkedIn：</span>{application.linkedin}</p>}
                {application.portfolio && <p><span className="font-medium">作品集：</span>{application.portfolio}</p>}
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/become-creator'}
              >
                重新申请
              </Button>
              <Button 
                variant="outline"
                onClick={handleWithdrawApplication}
                className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                撤回申请
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // 申请已通过，但用户角色还不是creator（这种情况理论上不应该发生）
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">申请已通过</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">您的创作者申请已通过，请刷新页面或重新登录</p>
          <Button onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </Card>
      </div>
    );
  };

  // 检查用户权限和申请状态
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('auth.loginRequired')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('auth.loginToAccess')}</p>
          <Button onClick={() => window.location.href = '/login'}>
            {t('auth.loginNow')}
          </Button>
        </Card>
      </div>
    );
  }

  // 如果用户不是创作者，检查申请状态
  if (user.role !== 'creator') {
    return renderApplicationStatus();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 欢迎仪式弹窗
  const renderWelcomeModal = () => {
    if (!showWelcome) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">🎉 欢迎成为创作者！</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              恭喜您成功通过审核，正式成为我们平台的创作者！
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">您现在可以：</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• 创建和发布工作流</li>
              <li>• 获得收益分成</li>
              <li>• 查看详细数据分析</li>
              <li>• 管理您的创作者资料</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowWelcome(false)}
              className="flex-1"
            >
              稍后探索
            </Button>
            <Button 
              onClick={() => {
                setShowWelcome(false);
                setActiveTab('workflows');
              }}
              className="flex-1"
            >
              开始创作
            </Button>
          </div>
        </div>
      </div>
    );
  };

      
  // 渲染编辑模态框
  const renderEditModal = () => (
    <Modal
      isOpen={editModalOpen}
      onClose={() => setEditModalOpen(false)}
      title={editingWorkflow?.type === 'ai-app' ? '编辑AI应用' : '编辑工作流'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            标题
          </label>
          <input
            type="text"
            value={editFormData.title}
            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="输入工作流标题"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            描述
          </label>
          <textarea
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="输入工作流描述"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            价格 (WH币)
          </label>
          <input
            type="number"
            value={editFormData.price === 0 ? '' : editFormData.price}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setEditFormData({ ...editFormData, price: 0 });
              } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  setEditFormData({ ...editFormData, price: numValue });
                }
              }
            }}
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="输入价格（WH币）"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            💡 WH币汇率：1美元 = 100 WH币
          </p>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_free_for_members"
            checked={editFormData.is_free_for_members}
            onChange={(e) => setEditFormData({ ...editFormData, is_free_for_members: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_free_for_members" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            会员免费
          </label>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => setEditModalOpen(false)}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      {/* 欢迎仪式弹窗 */}
      {renderWelcomeModal()}
      
        {/* 上传工作流模态框 */}
      <Modal
        isOpen={showSubmissionModal}
        onClose={handleCloseSubmissionModal}
        title="上传工作流"
        size="lg"
      >
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl p-6">
          <div className="space-y-6">
            {/* 标题区域 */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">上传您的工作流</h3>
              <p className="text-slate-600 dark:text-slate-300">请详细描述您的工作流并上传相关文件</p>
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
                            showAlert('最多只能上传5张图片', 'error');
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
                    上传中...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    上传工作流
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      
      {/* 编辑工作流模态框 */}
      {renderEditModal()}
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">创作者中心</h1>
            <p className="text-gray-600 dark:text-gray-300">管理您的工作流和收益</p>
          </div>

          {/* 标签页导航 */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 标签页内容 */}
          <div>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'workflows' && renderWorkflowsTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
            {activeTab === 'earnings' && renderEarningsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      </div>

      {/* 编辑模态框 */}
      {renderEditModal()}

      {/* 提现模态框 */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="申请提现到微信"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提现金额
            </label>
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="请输入提现金额"
                min="100"
                max={userBalance}
                step="0.01"
                className={clsx(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white",
                  validateWithdrawAmount(withdrawAmount) && withdrawAmount
                    ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm">¥</span>
              </div>
            </div>
            {withdrawAmount && validateWithdrawAmount(withdrawAmount) ? (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                {validateWithdrawAmount(withdrawAmount)}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                可提现余额：¥{userBalance.toFixed(2)}
              </p>
            )}
          </div>
          
          {/* 微信绑定状态 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              微信账号
            </label>
            {user?.wechat_openid ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">已绑定微信账号</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      OpenID: {user.wechat_openid.substring(0, 8)}***
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      需要绑定微信账号
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                      为了安全地将提现转账到您的微信账号，请先进行微信授权绑定
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWechatAuth}
                      className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
                    >
                      立即绑定微信
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">提现说明：</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>提现申请将在3-5个工作日内处理</li>
                  <li>资金将直接转账到您绑定的微信账号</li>
                  <li>提现手续费由平台承担</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowWithdrawModal(false)}
              disabled={withdrawLoading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleWithdraw}
              loading={withdrawLoading}
              disabled={
                !withdrawAmount || 
                !!validateWithdrawAmount(withdrawAmount) ||
                !user?.wechat_openid
              }
            >
              确认提现
            </Button>
          </div>
        </div>
      </Modal>
      
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
          title="上传进度"
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
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {currentUploadFile || '准备上传...'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {uploadStep === 'workflow' && '正在上传工作流文件...'}
                    {uploadStep === 'images' && '正在上传预览图片...'}
                    {uploadStep === 'video' && '正在上传预览视频...'}
                    {uploadStep === 'submitting' && '正在提交工作流数据...'}
                    {uploadProgress === 100 && !uploadError && '上传完成！'}
                    {uploadError && '上传失败'}
                  </p>
                </div>
              </div>
              
              {/* 错误信息 */}
              {uploadError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
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

    </>
  );
};





export default CreatorPage;