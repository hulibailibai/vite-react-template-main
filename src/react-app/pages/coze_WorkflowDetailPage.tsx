import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Download, 
  Heart, 
  Eye, 
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Home,
  Target,
  DollarSign,
  Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Workflow, Review } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

import { WorkflowCard } from '../components/WorkflowCard';
import { Breadcrumb } from '../components/ui/Breadcrumb';

// 工作流详情页面组件
export const WorkflowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  // const pageSize = 10; // 暂时未使用
  const [relatedWorkflows, setRelatedWorkflows] = useState<Workflow[]>([]);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewsLoadError, setReviewsLoadError] = useState(false);
  const [subscribedWorkflow, setSubscribedWorkflow] = useState(false);
  const [subscribedCreator, setSubscribedCreator] = useState(false);


  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionData, setPromotionData] = useState({
    channel: 'homepage',
    duration: 7,
    budget: 50
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  // 顶部横幅媒体（视频）相关状态
  const heroVideoRef = React.useRef<HTMLVideoElement>(null);
  // 支付方式选择状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);


  // 加载工作流详情
  useEffect(() => {
    const loadWorkflowDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const workflowId = parseInt(id);
        
        // 首先获取工作流基本信息
        const workflowRes = await api.cozeWorkflow.getCozeWorkflow(workflowId);
        setWorkflow(workflowRes);
        
        // 独立获取评价数据，失败时不影响页面显示
        try {
          // TODO: 评论功能暂时禁用
          // const reviewsRes = await api.review.getWorkflowReviews(workflowId, { page: 1, pageSize });
          // const sorted = (reviewsRes?.items || []).sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned));
          setReviews([]);
          setReviewPage(1);
          setReviewTotalPages(1);
          setReviewsLoadError(false);
        } catch (reviewError) {
          console.error('获取评价数据失败:', reviewError);
          // 设置错误状态和默认的空评价状态
          setReviewsLoadError(true);
          setReviews([]);
          setReviewPage(1);
          setReviewTotalPages(1);
        }

        // 记录浏览量
        try {
          const viewResult = await api.cozeWorkflow.recordView(workflowId);
          if (viewResult.success) {
            // 更新本地工作流数据的浏览量
            setWorkflow(prev => prev ? { ...prev, view_count: viewResult.view_count } : prev);
          }
        } catch (viewError) {
          // 浏览量记录失败不应该影响页面加载
          console.log('记录浏览量失败，但不影响页面显示');
        }
        
        // 初始订阅状态（后端未接入时默认未订阅）
        setSubscribedWorkflow(false);
        setSubscribedCreator(false);

        // 加载相关工作流
        if (workflowRes.category_id) {
          const relatedRes = await api.cozeWorkflow.getCozeWorkflows({
            category: workflowRes.category_id,
            pageSize: 4,
          });
          setRelatedWorkflows(relatedRes.items.filter((w: Workflow) => w.id !== parseInt(id)));
        }
        
        // 检查用户状态（点赞、收藏、购买）
        if (user) {
          try {
            const userStatus = await api.cozeWorkflow.getUserCozeWorkflowStatus(workflowId);
            // 确保从服务器获取的状态正确更新到UI
            const initialLikedState = !!userStatus.liked;
            const initialFavoritedState = !!userStatus.favorited;
            const initialPurchasedState = !!userStatus.purchased || workflowRes.price === 0;
            
            setIsLiked(initialLikedState);
            setIsFavorited(initialFavoritedState);
            setIsPurchased(initialPurchasedState);
            
            console.log('用户状态获取成功:', {
              liked: initialLikedState,
              favorited: initialFavoritedState,
              purchased: initialPurchasedState
            });
            console.log('初始UI状态设置 - isLiked:', initialLikedState, 'isFavorited:', initialFavoritedState, 'isPurchased:', initialPurchasedState);
          } catch (statusError) {
            // 如果API调用失败，重置为默认状态
            console.error('获取用户状态失败:', statusError);
            setIsLiked(false);
            setIsFavorited(false);
            // 只有当是免费工作流时才设置为已购买状态
            setIsPurchased(workflowRes.price === 0);
          }
        } else {
          // 未登录用户的默认状态
          setIsLiked(false);
          setIsFavorited(false);
          setIsPurchased(workflowRes.price === 0);
        }
      } catch (error) {
        console.error('Failed to load workflow detail:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflowDetail();
  }, [id]);

  // 当用户登录状态变化时，重新获取用户状态
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!workflow || loading) {
        return; // workflow还未加载或正在加载中，等待加载完成
      }

      if (!user) {
        // 如果用户未登录，重置状态
        console.log('用户未登录，重置状态');
        setIsLiked(false);
        setIsFavorited(false);
        setIsPurchased(workflow.price === 0);
        return;
      }

      try {
        console.log('重新获取用户状态，用户ID:', user.id, '工作流ID:', workflow.id);
        const userStatus = await api.cozeWorkflow.getUserCozeWorkflowStatus(workflow.id);
        // 确保从服务器获取的状态正确更新到UI
        const newLikedState = !!userStatus.liked;
        const newFavoritedState = !!userStatus.favorited;
        const newPurchasedState = !!userStatus.purchased || workflow.price === 0;
        
        console.log('API返回的用户状态:', userStatus);
        console.log('准备设置的状态:', {
          liked: newLikedState,
          favorited: newFavoritedState,
          purchased: newPurchasedState
        });
        
        setIsLiked(newLikedState);
        setIsFavorited(newFavoritedState);
        setIsPurchased(newPurchasedState);
        
        console.log('用户状态重新获取成功:', {
          liked: newLikedState,
          favorited: newFavoritedState,
          purchased: newPurchasedState
        });
      } catch (statusError) {
        console.error('重新获取用户状态失败:', statusError);
        setIsLiked(false);
        setIsFavorited(false);
        setIsPurchased(workflow.price === 0);
      }
    };

    // 当workflow已加载时，根据用户状态获取用户交互状态
    fetchUserStatus();
  }, [user?.id, workflow?.id, loading]);

  // 调试用：监听状态变化
  useEffect(() => {
    console.log('状态变化监听:', {
      isLiked,
      isFavorited,
      isPurchased,
      workflowId: workflow?.id,
      userId: user?.id
    });
  }, [isLiked, isFavorited, isPurchased, workflow?.id, user?.id]);

  // 处理购买
  const handlePurchase = async () => {
    if (!workflow) return;
    
    try {
      const requestBody = {
        payment_method: 'wh_coins' as 'wh_coins' | 'paypal',
      };
      
      const res = await api.cozeWorkflow.purchaseCozeWorkflow(workflow.id, requestBody);
      
      // WH币支付处理
      if (res.success) {
        setIsPurchased(true);
        setShowPaymentModal(false);
        showSuccess(`购买成功！消耗${res.wh_coins_used}WH币，剩余余额${res.remaining_balance}WH币`);
        
        // 购买成功后立即调用下载
        const downloadResponse = await api.cozeWorkflow.downloadCozeWorkflow(workflow.id);
        if (downloadResponse.success && downloadResponse.download_url) {
          const link = document.createElement('a');
          link.href = downloadResponse.download_url;
          link.download = downloadResponse.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showSuccess(`下载成功：${downloadResponse.filename}`);
        }
      } else {
        showError(res.message || '购买失败');
      }
    } catch (error: any) {
      console.error('购买失败:', error);
      showError(error.message || '购买失败，请稍后重试');
    }
  };



  // 创建媒体数组（视频 + 图片）
  const getMediaItems = () => {
    const items = [];
    if (workflow?.preview_video_url) {
      items.push({ type: 'video', url: workflow.preview_video_url });
    }
    if (workflow?.preview_images && workflow.preview_images.length > 0) {
      workflow.preview_images.forEach(image => {
        items.push({ type: 'image', url: image });
      });
    }
    return items;
  };

  // 处理媒体导航
  const handlePrevMedia = () => {
    const mediaItems = getMediaItems();
    if (mediaItems.length > 0) {
      setCurrentMediaIndex((prev) => 
        prev === 0 ? mediaItems.length - 1 : prev - 1
      );
    }
  };

  const handleNextMedia = () => {
    const mediaItems = getMediaItems();
    if (mediaItems.length > 0) {
      setCurrentMediaIndex((prev) => 
        prev === mediaItems.length - 1 ? 0 : prev + 1
      );
    }
  };

  // 兼容旧的图片导航函数
  const handlePrevImage = handlePrevMedia;
  const handleNextImage = handleNextMedia;

  // 处理收藏
  const handleFavorite = async () => {
    if (!user || !workflow) return;
    
    try {
      // 先调用API，成功后再更新UI状态
      const response = await api.cozeWorkflow.favoriteCozeWorkflow(workflow.id);
      if (response.success) {
        // 根据API返回的状态更新UI，确保布尔值转换
        setIsFavorited(!!response.favorited);
        console.log('收藏状态更新:', response.favorited, response.message);
        showSuccess(response.message || (response.favorited ? '收藏成功' : '取消收藏成功'));
      } else {
        console.error('收藏操作失败:', response.message || '未知错误');
        showError(response.message || '收藏操作失败');
      }
    } catch (error) {
      console.error('收藏API调用失败:', error);
      showError('收藏操作失败，请稍后重试');
      // API调用失败时不更新UI状态，保持与服务器一致
    }
  };

  // 处理点赞
  const handleLike = async () => {
    if (!user || !workflow) {
      showError('请先登录');
      return;
    }
    
    // 防止重复点击
    const currentLikedState = isLiked;
    
    try {
      // 乐观更新UI状态
      setIsLiked(!currentLikedState);
      
      // 调用API
      const response = await api.cozeWorkflow.likeCozeWorkflow(workflow.id);
      
      if (response.success) {
        // API成功，确保UI状态与服务器返回状态一致
        const serverLikedState = !!response.liked;
        setIsLiked(serverLikedState);
        showSuccess(response.message || (serverLikedState ? '点赞成功' : '取消点赞成功'));
      } else {
        // API失败，回滚UI状态
        setIsLiked(currentLikedState);
        showError(response.message || '点赞操作失败');
      }
    } catch (error) {
      // 网络错误，回滚UI状态
      setIsLiked(currentLikedState);
      console.error('点赞API调用失败:', error);
      showError('网络错误，请稍后重试');
    }
  };

  // 处理下载/购买
  const handleDownload = async () => {
    if (!workflow) return;
    
    try {
      const downloadPrice = workflow.download_price || 0;
      const isDownloadFree = workflow.is_download_member_free || downloadPrice === 0;
      
      if (isDownloadFree || isPurchased) {
        // 免费下载或已购买，调用真实下载API
        try {
          const response = await api.cozeWorkflow.downloadCozeWorkflow(workflow.id);
          if (response.success && response.download_url) {
            // 创建下载链接并触发下载
            const link = document.createElement('a');
            link.href = response.download_url;
            link.download = response.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSuccess(`下载成功：${response.filename}`);
          } else {
            showError(response.message || '下载失败');
          }
        } catch (downloadError) {
          console.error('下载API调用失败:', downloadError);
          showError('下载失败，请稍后重试');
        }
      } else {
        // 显示支付方式选择模态框
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Failed to download workflow:', error);
      showError('操作失败，请稍后重试');
    }
  };

  // 处理在线运行 - 跳转到运行页面
  const handleRun = () => {
   
    if (!workflow) {
      console.error('工作流数据不存在，无法跳转');
      return;
    }
    
    const targetUrl = `/coze-workflow/${workflow.id}/run`;
    
    // 跳转到工作流运行页面
    navigate(targetUrl);
  };



  // 订阅按钮占位：仅本地切换，不请求后端
  const handleSubscribeWorkflow = () => {
    if (!workflow) return;
    setSubscribedWorkflow(true);
  };

  const handleSubscribeCreator = () => {
    if (!workflow) return;
    setSubscribedCreator(true);
  };



  // 加载更多评论
  const loadMoreReviews = async () => {
    if (!workflow) return;
    const nextPage = reviewPage + 1;
    if (nextPage > reviewTotalPages) return;
    try {
      // TODO: 评论功能暂时禁用
      // const res = await api.review.getWorkflowReviews(workflow.id, { page: nextPage, pageSize });
      // const sorted = (res.items || []).sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned));
      const sorted: any[] = [];
      setReviews([...reviews, ...sorted]);
      setReviewPage(nextPage);
      setReviewTotalPages(reviewTotalPages);
    } catch (error) {
      console.error('加载更多评论失败:', error);
    }
  };

  // 置顶/取消置顶评论（创作者）
  const togglePinReview = async (review: Review) => {
    if (!user || !workflow) return;
    if (user.id !== workflow.creator_id) return; // 只有创作者可操作
    try {
      // TODO: 评论功能暂时禁用
      // const updated = review.pinned
      //   ? await api.review.unpinReview(review.id)
      //   : await api.review.pinReview(review.id);
      const updated = { ...review, pinned: !review.pinned };
      setReviews(reviews.map((r) => (r.id === review.id ? { ...r, pinned: updated.pinned } : r))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned)));
    } catch (error) {
      console.error('置顶操作失败:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* 骨架屏：顶部横幅位 */}
        <div className="w-full aspect-[16/6] bg-gray-200 dark:bg-gray-700" />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">工作流未找到</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">您访问的工作流不存在或已被删除</p>
          <Button onClick={() => window.history.back()}>返回上一页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 面包屑导航 */}
        <Breadcrumb
          items={[
            { label: '首页', href: '/' },
            { label: '工作流', href: '/coze-workflows' },
            { label: workflow.title },
          ]}
          className="mb-8"
        />

        {/* 顶部：标题与统计信息 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{workflow.title}</h1>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{(workflow.view_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{(workflow.like_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span className="text-sm">{(workflow.download_count || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
          {workflow.tags && workflow.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {workflow.tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* 主内容：左内容（视频+介绍，70%） + 右侧操作卡片（30%） */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 mb-12">
          {/* 左：媒体区 */}
          <div className="space-y-4 lg:col-span-7">
            {(() => {
              const mediaItems = getMediaItems();
              const currentMedia = mediaItems[currentMediaIndex];
              
              if (mediaItems.length === 0) {
                return (
                  <div className="relative aspect-[9/16] max-h-[640px] w-full max-w-[420px] mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src="/placeholder-workflow.png"
                      alt={workflow?.title || 'Workflow'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              }
              
              return (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative aspect-[9/16] max-h-[640px] w-full max-w-[420px] mx-auto rounded-xl overflow-hidden bg-black">
                      {currentMedia?.type === 'video' ? (
                        <video
                          ref={heroVideoRef}
                          src={currentMedia.url}
                          className="w-full h-full object-cover"
                          controls
                          playsInline
                          autoPlay
                          muted
                          poster={workflow?.preview_images?.[0]}
                        />
                      ) : (
                        <img
                          src={currentMedia?.url}
                          alt={workflow?.title}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setIsImageModalOpen(true)}
                        />
                      )}
                    </div>
                    {mediaItems.length > 1 && (
                      <>
                        <button onClick={handlePrevMedia} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={handleNextMedia} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                          {mediaItems.map((_, index) => (
                            <button key={index} onClick={() => setCurrentMediaIndex(index)} className={clsx('w-2 h-2 rounded-full transition-colors', index === currentMediaIndex ? 'bg-white' : 'bg-white/60')} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {mediaItems.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {mediaItems.map((media, index) => (
                        <button key={index} onClick={() => setCurrentMediaIndex(index)} className={clsx('flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors', index === currentMediaIndex ? 'border-blue-500' : 'border-gray-200')}>
                          {media.type === 'video' ? (
                            <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
                              视频
                            </div>
                          ) : (
                            <img src={media.url} alt={`${workflow?.title} ${index + 1}`} className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 右：信息与操作（玻璃卡片 风格 + 吸顶） */}
          <div className="space-y-6 lg:col-span-3">
            <Card className="p-6 sticky top-24 bg-white/80 backdrop-blur border border-white/60 shadow-xl rounded-2xl relative">
              {/* 会员免费标识 - 右上角 */}
              {workflow.price === 0 && workflow.is_member_free && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-600 text-white font-semibold shadow-sm text-sm">会员免费</span>
                </div>
              )}
              


              {/* 统计信息 - 并排显示 */}
              <div className="mb-8 mt-8">
                <div className="flex items-center justify-around py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex flex-col items-center">
                    <Eye className="w-5 h-5 text-blue-500 mb-1" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(workflow.view_count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">浏览</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Download className="w-5 h-5 text-green-500 mb-1" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(workflow.download_count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">下载</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Heart className="w-5 h-5 text-red-500 mb-1" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(workflow.like_count || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">点赞</span>
                  </div>
                </div>
              </div>

              {/* 使用指南 */}
              {workflow.description && (
                <div className="mb-8">
                 
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {workflow.description}
                  </p>
                </div>
              )}



              {/* 操作按钮 */}
              <div className="space-y-3 mb-5">
                {/* 在线运行按钮 */}
                {(() => {
                  const runPrice = workflow.price || 0;
                  const isRunFree = workflow.is_member_free || runPrice === 0;
                  
                  return isRunFree ? (
                    <Button variant="primary" size="lg" onClick={handleRun} className="w-full">
                      <Target className="w-5 h-5 mr-2" /> 在线运行
                    </Button>
                  ) : (
                    <button
                      onClick={handleRun}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="relative flex items-center justify-center">
                        <div className="flex items-center">
                          <div className="bg-white/20 rounded-full p-2 mr-3">
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold">在线运行</div>
                            <div className="text-sm opacity-90">{runPrice}WH币 · 单次运行</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })()}
                
                {/* 下载/购买按钮 */}
                {(() => {
                  const downloadPrice = workflow.download_price || 0;
                  const isDownloadFree = workflow.is_download_member_free || downloadPrice === 0;
                  
                  return isDownloadFree ? (
                    <Button variant="outline" size="lg" onClick={handleDownload} className="w-full">
                      <Download className="w-5 h-5 mr-2" /> 立即下载
                    </Button>
                  ) : isPurchased ? (
                    <Button variant="outline" size="lg" onClick={handleDownload} className="w-full">
                      <Download className="w-5 h-5 mr-2" /> 已购买点击下载
                    </Button>
                  ) : (
                    <button
                      onClick={handleDownload}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="relative flex items-center justify-center">
                        <div className="flex items-center">
                          <div className="bg-white/20 rounded-full p-2 mr-3">
                            <Download className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-lg font-bold">立即购买</div>
                            <div className="text-sm opacity-90">{downloadPrice}WH币 · 永久下载</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })()}
                
                {/* 点赞和收藏按钮 */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleLike} 
                    className={clsx(
                      'flex-1 transition-all duration-200', 
                      isLiked 
                        ? 'text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' 
                        : 'hover:text-red-500 hover:border-red-500'
                    )}
                    disabled={!user}
                  >
                    <Heart className={clsx('w-5 h-5 transition-all duration-200', isLiked && 'fill-current text-red-500')} />
                    <span className="ml-2">{isLiked ? '已点赞' : '点赞'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleFavorite} 
                    className={clsx(
                      'flex-1 transition-all duration-200', 
                      isFavorited 
                        ? 'text-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
                        : 'hover:text-yellow-500 hover:border-yellow-500'
                    )}
                    disabled={!user}
                  >
                    <Star className={clsx('w-5 h-5 transition-all duration-200', isFavorited && 'fill-current text-yellow-500')} />
                    <span className="ml-2">{isFavorited ? '已收藏' : '收藏'}</span>
                  </Button>
                </div>
              </div>

              {/* 创作者信息 + 打赏 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <img src={workflow.creator?.avatar_url || '/default-avatar.png'} alt={workflow.creator?.username} className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">{workflow.creator?.username || '未知创作者'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{workflow.creator?.bio || '创作者'}</div>
                </div>
                <Button
                  variant={subscribedCreator ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleSubscribeCreator}
                  disabled={subscribedCreator}
                >
                  {subscribedCreator ? '已打赏' : '打赏'}
                </Button>
              </div>

              {/* 订阅工作流 */}
              <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">订阅本工作流</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">订阅越多，首页推荐权重越高</div>
                </div>
                <Button
                  variant={subscribedWorkflow ? 'outline' : 'primary'}
                  onClick={handleSubscribeWorkflow}
                  disabled={subscribedWorkflow}
                >
                  {subscribedWorkflow ? '已订阅' : '订阅工作流'}
                </Button>
              </div>

              {/* 标签 */}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    相关标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {workflow.tags.map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 主体区域：内容（详情/评论） */}
        <div className="mb-12">
          {/* 标签页内容 */}
          <div>
            {/* Tabs 和发布作品按钮 */}
            <div className="border-b mb-6">
              <div className="flex items-center justify-between">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {[
                    { key: 'overview', label: '作品' },
                    { key: 'reviews', label: `评论(${workflow.review_count || reviews.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as 'overview' | 'reviews')}
                      className={clsx(
                        'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm',
                        activeTab === tab.key
                          ? 'border-teal-600 text-teal-600'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
                
                {/* 发布作品按钮 */}
                <Button 
                  variant="primary" 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg"
                >
                  发布作品
                </Button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 作品集展示 - 移除预览图片展示 */}
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-lg font-medium mb-2">暂无作品展示</p>
                    <p className="text-sm">创作者还未发布相关作品</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* 添加评论区域 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <textarea
                    placeholder="添加评论..."
                    className="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="flex justify-end mt-3">
                    <Button 
                      variant="primary" 
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg"
                    >
                      发布
                    </Button>
                  </div>
                </div>

                {/* 评论列表 */}
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="flex items-start space-x-4 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        <img 
                          src={review.user?.avatar_url || '/default-avatar.png'} 
                          alt={review.user?.username} 
                          className="w-10 h-10 rounded-full flex-shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{review.user?.username || '匿名用户'}</h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(review.created_at)}</span>
                            {review.pinned && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">置顶</span>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <button className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600">
                              <ThumbsUp className="w-4 h-4" />
                              <span>点赞</span>
                            </button>
                            <button className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                              <span>回复</span>
                            </button>
                            {user?.id === workflow.creator_id && (
                              <button 
                                onClick={() => togglePinReview(review)} 
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-600"
                              >
                                {review.pinned ? '取消置顶' : '置顶'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : reviewsLoadError ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-red-500 dark:text-red-400 text-sm font-medium mb-2">评价数据加载失败</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">无法获取用户评价，请稍后重试</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="text-xs"
                      >
                        重新加载
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">暂无评论</p>
                    </div>
                  )}
                </div>

                {/* 加载更多按钮 */}
                {reviewPage < reviewTotalPages && (
                  <div className="text-center">
                    <Button variant="outline" onClick={loadMoreReviews} className="text-sm">
                      加载更多评论
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>


        </div>

       



        {/* 相关推荐 */}
        {relatedWorkflows.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">相关推荐</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedWorkflows.map((relatedWorkflow) => (
                <WorkflowCard
                  key={relatedWorkflow.id}
                  workflow={relatedWorkflow}
                  onView={(id) => window.location.href = `/coze-workflow/${id}`}
                  onDownload={handleDownload}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 图片模态框 */}
      {isImageModalOpen && workflow && workflow.preview_images && workflow.preview_images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={workflow.preview_images[Math.max(0, currentMediaIndex - (workflow.preview_video_url ? 1 : 0))]}
              alt={workflow.title}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            {workflow.preview_images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 推广模态框 */}
      {showPromotionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">推广工作流</h3>
              <button
                onClick={() => setShowPromotionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 推广渠道 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  推广渠道
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'homepage', label: '首页推荐', icon: Home, price: 10 },
                    { value: 'category', label: '分类置顶', icon: Target, price: 5 },
                    { value: 'search', label: '搜索优先', icon: TrendingUp, price: 8 }
                  ].map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <label
                        key={channel.value}
                        className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="radio"
                          name="channel"
                          value={channel.value}
                          checked={promotionData.channel === channel.value}
                          onChange={(e) => setPromotionData({
                            ...promotionData,
                            channel: e.target.value
                          })}
                          className="mr-3"
                        />
                        <Icon className="w-5 h-5 text-gray-400 mr-3" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{channel.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">${channel.price}/天</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 推广时长 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  推广时长
                </label>
                <select
                  value={promotionData.duration}
                  onChange={(e) => setPromotionData({
                    ...promotionData,
                    duration: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={1}>1天</option>
                  <option value={3}>3天</option>
                  <option value={7}>7天</option>
                  <option value={14}>14天</option>
                  <option value={30}>30天</option>
                </select>
              </div>

              {/* 费用预览 */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-300">推广费用</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${(() => {
                      const channelPrices = { homepage: 10, category: 5, search: 8 };
                      return channelPrices[promotionData.channel as keyof typeof channelPrices] * promotionData.duration;
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>预计曝光量</span>
                  <span>{promotionData.duration * 1000}+</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPromotionModal(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                   variant="primary"
                   className="flex-1 flex items-center justify-center space-x-2"
                   onClick={async () => {
                     if (!workflow) return;
                     
                     try {
                       const channelPrices = { homepage: 10, category: 5, search: 8 };
                       const budget = channelPrices[promotionData.channel as keyof typeof channelPrices] * promotionData.duration;
                       
                       const result = await api.promotion.createPromotion({
                         workflow_id: workflow.id,
                         channel: promotionData.channel as 'homepage' | 'category' | 'search',
                         duration: promotionData.duration,
                         budget: budget
                       });
                       
                       if (result.payment_url) {
                         // 跳转到支付页面
                         window.open(result.payment_url, '_blank');
                       } else {
                         showSuccess('推广订单创建成功！');
                       }
                       
                       setShowPromotionModal(false);
                     } catch (error) {
                       console.error('创建推广订单失败:', error);
                       showError('创建推广订单失败，请重试');
                     }
                   }}
                 >
                   <DollarSign className="w-4 h-4" />
                   <span>立即推广</span>
                 </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 支付方式选择模态框 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择支付方式</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 mb-8">
              {/* 价格信息 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{workflow?.download_price || 0} WH币</h4>
                <p className="text-gray-500 dark:text-gray-400">永久使用权限</p>
              </div>

              {/* 余额信息 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">当前WH币余额</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{user?.wh_coins || 0} WH币</span>
                </div>
                {(user?.wh_coins || 0) < (workflow?.download_price || 0) && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      余额不足，需要 {(workflow?.download_price || 0) - (user?.wh_coins || 0)} WH币
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handlePurchase}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-0"
                disabled={(user?.wh_coins || 0) < (workflow?.download_price || 0)}
              >
                {(user?.wh_coins || 0) >= (workflow?.download_price || 0) ? '确认购买' : '余额不足'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowDetailPage;