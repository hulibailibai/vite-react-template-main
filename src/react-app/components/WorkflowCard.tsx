import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { Star, Download, Heart, Eye, Tag, User, Calendar, Volume2, VolumeX } from 'lucide-react';
import { Workflow } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

// 工作流卡片属性接口
interface WorkflowCardProps {
  workflow: Workflow;
  onFavorite?: (id: number) => void;
  onDownload?: (id: number) => void;
  onView?: (id: number) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

// 评分星星组件
const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
  rating, 
  size = 'sm' 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={clsx(
            sizeClasses[size],
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          )}
        />
      ))}
    </div>
  );
};

// 价格显示组件
const PriceDisplay: React.FC<{ workflow: Workflow; className?: string }> = ({ 
  workflow, 
  className 
}) => {
  const hasRunPrice = workflow.price > 0;
  const hasDownloadPrice = (workflow.download_price || 0) > 0;
  
  if (!hasRunPrice && !hasDownloadPrice) {
    if (workflow.is_member_free) {
      return (
        <span className={clsx('text-purple-400 font-semibold', className)}>
          会员免费
        </span>
      );
    }
    return (
      <span className={clsx('text-green-400 font-semibold', className)}>
        免费
      </span>
    );
  }

  return (
    <div className={clsx('text-blue-400 font-semibold', className)}>
      {hasRunPrice && (
        <div className="text-xs">运行: ¥{workflow.price.toFixed(2)}</div>
      )}
      {hasDownloadPrice && (
        <div className="text-xs">下载: ¥{(workflow.download_price || 0).toFixed(2)}</div>
      )}
      {workflow.is_member_free && (
        <div className="text-xs text-purple-400">会员免费</div>
      )}
    </div>
  );
};

// 标签组件
const TagList: React.FC<{ tags: string[]; maxTags?: number; className?: string }> = ({ 
  tags, 
  maxTags = 3, 
  className 
}) => {
  if (!tags || tags.length === 0) {
    return null;
  }
  
  const displayTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;

  return (
    <div className={clsx('flex flex-wrap gap-1', className)}>
      {displayTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-700/50 text-gray-200 border border-gray-600/50"
        >
          <Tag className="w-3 h-3 mr-1" />
          {tag}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600/50 text-gray-300 border border-gray-500/50">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};

// 工作流卡片组件
export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onFavorite,
  onDownload,
  onView,
  showActions = true,
  variant = 'default',
  className,
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 处理收藏
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavorite) {
      setIsFavorited(!isFavorited);
      try {
        await onFavorite(workflow.id);
      } catch (error) {
        setIsFavorited(isFavorited); // 回滚状态
      }
    }
  };

  // 处理下载
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload && !isLoading) {
      setIsLoading(true);
      try {
        await onDownload(workflow.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 处理查看
  const handleView = () => {
    if (onView) {
      onView(workflow.id);
    }
  };



  // 处理鼠标悬停视频播放
  const handleVideoHover = async () => {
    if (videoRef.current) {
      // 开始播放视频（静音状态）
      videoRef.current.play().catch(() => {
        console.log('静音视频播放失败');
      });
    }
  };

  // 处理鼠标离开视频暂停
  const handleVideoLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // 处理静音/取消静音按钮点击
  const handleUnmuteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      try {
        if (isVideoMuted) {
          // 取消静音
          videoRef.current.muted = false;
          setIsVideoMuted(false);
          // 确保视频正在播放
          if (videoRef.current.paused) {
            await videoRef.current.play();
          }
        } else {
          // 静音
          videoRef.current.muted = true;
          setIsVideoMuted(true);
        }
      } catch (error) {
        console.log('切换静音状态失败:', error);
      }
    }
  };

  // 预览媒体组件
  const PreviewMedia: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact = false }) => {
    const hasVideo = workflow.preview_video;
    const previewImage = (workflow.preview_images && workflow.preview_images[0]) || '/placeholder-workflow.png';

    // 处理视频自动播放
    React.useEffect(() => {
      if (hasVideo && compact && videoRef.current) {
        const video = videoRef.current;
        // 设置静音状态
        video.muted = isVideoMuted;
        video.load(); // 确保视频加载
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log('视频自动播放失败');
          });
        }
      }
    }, [hasVideo, compact, workflow.preview_video, isVideoMuted]);

    if (hasVideo && workflow.preview_video) {
      return (
        <div className="relative w-full h-full group">
          <video
            ref={videoRef}
            src={workflow.preview_video}
            className={clsx(
              'w-full h-full object-cover object-center rounded-lg',
              compact ? 'scale-110 group-hover:scale-125 transition-transform duration-300' : '',
              className
            )}
            loop
            playsInline
            autoPlay={compact}
            muted={isVideoMuted}
            onMouseEnter={handleVideoHover}
            onMouseLeave={handleVideoLeave}
          />

        </div>
      );
    }

    return (
      <img
        src={previewImage}
        alt={workflow.title}
        className={clsx(
          'w-full h-full object-cover object-center rounded-lg',
          compact ? 'scale-110 group-hover:scale-125 transition-transform duration-300' : '',
          className
        )}
      />
    );
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 紧凑版本
  if (variant === 'compact') {
    return (
      <div 
        className={clsx('cursor-pointer relative group', className)}
        onClick={handleView}
      >
        {/* 预览图 - 居中放大显示，裁剪多余部分 */}
         <div className="relative mb-3">
           <div className="w-full aspect-[3/4] rounded-lg bg-gray-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <PreviewMedia compact={true} />
          </div>
          
          {/* 精选标识 */}
          {workflow.is_featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                精选
              </span>
            </div>
          )}
          
          {/* 类型标识和静音按钮 */}
          <div className="absolute top-2 right-2 flex flex-col items-end space-y-1">
            <span className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium',
              workflow.type === 'ai-app' 
                ? 'bg-purple-500 text-white' 
                : 'bg-blue-500 text-white'
            )}>
              {workflow.type === 'ai-app' ? 'AI应用' : '工作流'}
            </span>
            {/* 静音按钮 - 只在有视频时显示 */}
            {workflow.preview_video && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={handleUnmuteClick}
                  className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
                  title={isVideoMuted ? "点击启用声音" : "点击静音"}
                >
                  {isVideoMuted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
          
          {/* 渐变遮罩层 */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg pointer-events-none" />
           
           {/* 标题和创作者信息在左下角 */}
           <div className="absolute bottom-2 left-3 right-3">
             <h3 className="text-white font-semibold text-sm line-clamp-1 leading-tight drop-shadow-lg mb-1">
               {workflow.title}
             </h3>
             <div className="flex items-center space-x-2">
               <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                 {workflow.creator?.avatar_url ? (
                   <img 
                     src={workflow.creator.avatar_url} 
                     alt={workflow.creator.username}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <User className="w-3 h-3 text-gray-600" />
                 )}
               </div>
               <span className="text-white text-xs font-medium drop-shadow-lg">
                 {workflow.creator?.username || '未知创作者'}
               </span>
             </div>
           </div>
         </div>
         
         {/* 内容区域 */}
         <div className="space-y-2">
           {/* 价格和描述与统计信息在同一行 */}
           <div className="flex justify-between items-start">
             {/* 左侧：价格和描述 */}
             <div className="flex flex-col items-start flex-1 pr-4">
               <PriceDisplay workflow={workflow} className="text-lg font-bold mb-1" />
               {workflow.description && (
                 <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                   {workflow.description}
                 </p>
               )}
             </div>
             
             {/* 右侧：统计信息和评分 */}
              <div className="flex flex-col items-end flex-shrink-0 mt-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Download className="w-3 h-3" />
                    <span>{workflow.download_count}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{workflow.download_count * 3}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 self-end">
                  <StarRating rating={workflow.rating} size="sm" />
                  <span className="text-gray-600 text-xs font-medium">
                    {workflow.rating.toFixed(1)}
                  </span>
                </div>
              </div>
           </div>
         </div>
      </div>
    );
  }

  // 详细版本
  if (variant === 'detailed') {
    return (
      <Card 
        className={clsx('hover:shadow-lg transition-all duration-300', className)}
        hoverable
      >
        {/* 预览图 */}
        <div className="relative aspect-[9/16] mb-4 cursor-pointer max-w-xs mx-auto" onClick={handleView}>
          <PreviewMedia />
          {workflow.is_featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                精选
              </span>
            </div>
          )}
          {/* 类型标识 */}
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <span className={clsx(
              'px-2 py-1 rounded-full text-xs font-medium',
              workflow.type === 'ai-app' 
                ? 'bg-purple-500 text-white' 
                : 'bg-blue-500 text-white'
            )}>
              {workflow.type === 'ai-app' ? 'AI应用' : '工作流'}
            </span>
            {showActions && (
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/80 hover:bg-white"
                onClick={handleFavorite}
              >
                <Heart 
                  className={clsx(
                    'w-4 h-4',
                    isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'
                  )} 
                />
              </Button>
            )}
          </div>
        </div>

        {/* 内容 */}
        <div className="space-y-3">
          {/* 标题和评分 */}
          <div>
            <h3 
              className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleView}
            >
              {workflow.title}
            </h3>
            <div className="flex items-center space-x-2">
              <StarRating rating={workflow.rating} size="md" />
              <span className="text-sm text-gray-500">
                ({workflow.review_count} 评价)
              </span>
            </div>
          </div>

          {/* 描述 */}
          {workflow.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {workflow.description}
            </p>
          )}

          {/* 标签 */}
          {workflow.tags && workflow.tags.length > 0 && (
            <TagList tags={workflow.tags} maxTags={4} />
          )}

          {/* 创作者信息 */}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <User className="w-4 h-4" />
            <span>{workflow.creator?.username || '未知创作者'}</span>
            <Calendar className="w-4 h-4 ml-2" />
            <span>{formatDate(workflow.created_at)}</span>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Download className="w-4 h-4" />
                <span>{workflow.download_count}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{(workflow.view_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Heart className="w-4 h-4" />
                <span>{(workflow.like_count || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <PriceDisplay workflow={workflow} className="text-lg" />
              {showActions && (
                <Button
                  variant="primary"
                  size="sm"
                  loading={isLoading}
                  onClick={handleDownload}
                >
                  {workflow.price === 0 ? '免费下载' : '立即购买'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 默认版本
  return (
    <Card 
      className={clsx('hover:shadow-lg transition-all duration-300', className)}
      hoverable
    >
      {/* 预览图 */}
        <div className="relative aspect-[9/16] mb-3 cursor-pointer max-w-xs mx-auto" onClick={handleView}>
        <PreviewMedia />
        {workflow.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              精选
            </span>
          </div>
        )}
        {showActions && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/80 hover:bg-white"
              onClick={handleFavorite}
            >
              <Heart 
                className={clsx(
                  'w-4 h-4',
                  isFavorited ? 'text-red-500 fill-current' : 'text-gray-600'
                )} 
              />
            </Button>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="space-y-2">
        {/* 标题 */}
        <h3 
          className="font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors line-clamp-1"
          onClick={handleView}
        >
          {workflow.title}
        </h3>

        {/* 评分和统计 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <StarRating rating={workflow.rating} />
            <span className="text-xs text-gray-500">
              ({workflow.review_count})
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Download className="w-3 h-3" />
            <span>{workflow.download_count}</span>
          </div>
        </div>

        {/* 标签 */}
        {workflow.tags && workflow.tags.length > 0 && (
          <TagList tags={workflow.tags} maxTags={2} />
        )}

        {/* 底部 */}
        <div className="flex items-center justify-between pt-2">
          <PriceDisplay workflow={workflow} />
          {showActions && (
            <Button
              variant="primary"
              size="sm"
              loading={isLoading}
              onClick={handleDownload}
            >
              {workflow.price === 0 ? '下载' : '购买'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WorkflowCard;