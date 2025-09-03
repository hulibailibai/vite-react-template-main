import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { clsx } from 'clsx';
import {
  Download,
  Eye,
  Sparkles,
  Users,
  DollarSign,
  Workflow,
  VolumeX,
  Volume2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { Workflow as WorkflowType } from '../types';

// 工作流卡片组件
const WorkflowCard: React.FC<{ workflow: WorkflowType; navigate: ReturnType<typeof useNavigate>; t: (key: string) => string }> = ({ workflow, navigate, t }) => {
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

  // 已移除鼠标进入/离开时控制播放，视频将持续自动播放

  // 预览媒体组件
  const PreviewMedia: React.FC<{ className?: string }> = ({ className }) => {
    const hasVideo = workflow.preview_video_url || workflow.preview_video;
    const previewImage = workflow.preview_images?.[0] || `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=${encodeURIComponent(workflow.title)}`;

    if (hasVideo) {
      return (
        <div 
          className={`${className} relative group`}
        >
          <video
            ref={videoRef}
            src={workflow.preview_video_url || workflow.preview_video}
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
              title={isVideoMuted ? t('workflows.unmute') : t('workflows.mute')}
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
              {t('workflows.featured')}
            </Badge>
          </div>
        )}
        
        {/* 价格 */}
        <div className="absolute top-4 right-4 z-10">
          {workflow.price === 0 ? (
            workflow.is_member_free ? (
              <Badge variant="secondary" className="text-xs font-semibold shadow-lg bg-purple-600 text-white">
                会员免费
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs font-semibold shadow-lg">
                {t('workflows.free')}
              </Badge>
            )
          ) : (
            <Badge variant="primary" className="text-xs font-semibold shadow-lg">
              {workflow.price}WH币
            </Badge>
          )}
        </div>
        
          {/* 标题和作者信息 - 左下角 */}
          <div className="absolute bottom-4 left-4 z-10">
            <h3
              className="text-lg font-extrabold mb-2 line-clamp-1 text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
            >
              {workflow.title}
            </h3>
            <div className="flex items-center space-x-2">
              <img
                src={workflow.creator?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(workflow.creator?.username || 'U')}&size=40&background=6366f1&color=ffffff`}
                alt={workflow.creator?.username || 'User'}
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(workflow.creator?.username || 'U')}&size=40&background=6366f1&color=ffffff`;
                }}
              />
              <span
                className="text-sm font-semibold text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
              >
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

// 工作流页面主组件
const WorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy] = useState('trending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 12;
  
  // 分类和标签筛选状态
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Array<{id: number, name: string}>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);



  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
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
      if (!selectedCategory) {
        setAvailableTags([]);
        return;
      }

      try {
        setLoadingTags(true);
        const response = await fetch(`/api/tags?category_id=${selectedCategory}`);
        if (response.ok) {
          const data = await response.json();
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
    // 清空已选标签当分类改变时
    setSelectedTags([]);
  }, [selectedCategory]);

  // 获取工作流数据
  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const sortByValue = sortBy === 'trending' ? 'hot' : sortBy === 'downloads' ? 'downloads' : sortBy === 'rating' ? 'likes' : 'latest';
      params.append('sortBy', sortByValue);
      
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          params.append('tags', tag);
        });
      }
      
      // 只获取状态为online的工作流
      params.append('status', 'online');
      
      // 联动获取用户信息
      params.append('include_user', 'true');
      
      // 使用coze_workflows表的API端点
      const response = await fetch(`/api/coze-workflows?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      
      const data = await response.json();
      setWorkflows(data.data?.items || []);
      setTotalPages(Math.ceil((data.data?.pagination?.total || 0) / pageSize));
    } catch (err) {
      console.error('获取工作流失败:', err);
      setError(t('workflows.error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [currentPage, sortBy, selectedCategory, selectedTags]);

  // 处理标签选择
  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
    setCurrentPage(1); // 重置到第一页
  };



  // 处理分类选择
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // 重置到第一页
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-600/5 dark:from-blue-500/10 dark:to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/5 to-blue-600/5 dark:from-teal-500/10 dark:to-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-600/5 dark:from-purple-500/10 dark:to-pink-600/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 创作者申请横幅 */}
        <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 dark:from-blue-700/95 dark:to-purple-700/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sm:p-8 mb-8 text-white border border-blue-500/20 dark:border-blue-400/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">{t('workflows.creator.apply')}</h2>
                <p className="text-blue-100">{t('workflows.creator.description')}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-blue-100">
                  <DollarSign className="w-5 h-5" />
                  <span>{t('workflows.creator.benefits.revenue')}</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <Sparkles className="w-5 h-5" />
                  <span>{t('workflows.creator.benefits.showcase')}</span>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/creator/apply')}
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-700 dark:hover:text-blue-300 active:bg-blue-100 dark:active:bg-gray-600 active:text-blue-800 dark:active:text-blue-200 font-semibold px-6 py-3 whitespace-nowrap flex-shrink-0 shadow-md transition-all duration-200 border border-blue-200 dark:border-gray-600"
                style={{opacity: 1, visibility: 'visible'}}
              >
                {t('workflows.creator.applyNow')}
              </Button>
            </div>
          </div>
        </div>

        {/* 筛选选项 */}
        <div className="space-y-8 mb-8">
          {/* 分类选择 */}
          {loadingCategories ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">加载中...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* 全部分类按钮 */}
              <button
                type="button"
                onClick={() => handleCategoryChange('')}
                className={clsx(
                  'px-3 py-1 rounded text-sm transition-colors',
                  selectedCategory === ''
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                全部
              </button>
              
              {/* 分类标签按钮 */}
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id.toString())}
                  className={clsx(
                    'px-3 py-1 rounded text-sm transition-colors',
                    selectedCategory === category.id.toString()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
          
          {/* 标签筛选 */}
          {selectedCategory && (
            <div>
              {loadingTags ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">加载中...</span>
                </div>
              ) : availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      className={clsx(
                        'px-3 py-1 rounded text-sm transition-colors',
                        selectedTags.includes(tag.name)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

        </div>

        {/* 主内容区 */}
        <div className="w-full">
            
            {/* 工作流列表 */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workflows.loading')}</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 mb-4">
                  <Workflow className="w-20 h-20 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">{t('workflows.error.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                <Button onClick={fetchWorkflows} variant="primary">
                  {t('workflows.retry')}
                </Button>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-16">
                <Workflow className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">{t('workflows.empty.title')}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{t('workflows.empty.description')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {workflows.map((workflow) => (
                    <WorkflowCard key={workflow.id} workflow={workflow} navigate={navigate} t={t} />
                  ))}
              </div>
            )}
            
            {/* 分页 */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <span className="sr-only">{t('workflows.pagination.previous')}</span>
                    ←
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button 
                        key={page}
                        variant={currentPage === page ? "primary" : "outline"} 
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <span className="sr-only">{t('workflows.pagination.next')}</span>
                    →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
  );
};

export default WorkflowsPage;