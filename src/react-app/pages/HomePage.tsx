import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight
} from 'lucide-react';
import { Workflow, Category, AIApp } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import { AIAppService } from '../services/aiAppService';
import { WorkflowCard } from '../components/WorkflowCard';
import { SearchBox } from '../components/SearchAndFilter';

// 导入AIAppCard相关组件和工具函数
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Download, Sparkles, MessageCircle, Star } from 'lucide-react';
import { clsx } from 'clsx';


// 时间格式化工具函数
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}天前`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}个月前`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years}年前`;
  }
};

// 数字格式化工具函数
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

// AI应用价格显示组件
const PriceDisplay: React.FC<{ app: AIApp; className?: string }> = ({ 
  app, 
  className 
}) => {
  if (app.price === 0) {
    if (app.is_member_free) {
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
    <span className={clsx('text-blue-400 font-semibold', className)}>
      {app.price} WH币
    </span>
  );
};

// AI应用卡片组件
const AIAppCard: React.FC<{ app: AIApp; navigate: any }> = ({ app, navigate }) => {
  // const { t } = useLanguage();

  const handleView = () => {
    navigate(`/ai-app/${app.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden bg-white dark:bg-gray-800 w-full relative" onClick={handleView}>
      <div className="absolute top-3 right-3 z-10">
        <PriceDisplay app={app} className="text-sm px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm" />
      </div>
      
      <div className="flex items-start p-2 space-x-2">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
          {app.app_avatar_url ? (
            <img
              src={app.app_avatar_url}
              alt={app.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
              {app.title?.charAt(0) || 'A'}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 pr-16">
          <div className="mb-2">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{app.title}</h3>
              {app.is_featured && (
                <Badge variant="primary" className="text-xs px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  精选
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <img
                src={app.creator?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.username || 'User')}&size=16&background=6366f1&color=ffffff&rounded=true`}
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.username || 'User')}&size=16&background=6366f1&color=ffffff&rounded=true`;
                      }}
                alt={app.creator?.username || app.creator_name || 'User'}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {app.creator?.username || app.creator_name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-400 dark:text-gray-500">·</span>
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {formatTimeAgo(app.updated_at || app.created_at)}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2 line-clamp-2">
            {app.description || '暂无描述'}
          </p>
        </div>
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-700 mx-3"></div>
      
      <div className="px-3 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>{formatNumber(app.download_count || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{formatNumber(app.conversation_count || 0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{formatNumber(app.like_count || 0)}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span>🔥</span>
            <span>🌊</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
import { Button } from '../components/ui/Button';
import { MainLayout } from '../components/NewNavigation';
import WelcomeCeremony from '../components/WelcomeCeremony';
import { useAuth } from '../contexts/AuthContext';

// 统计数据接口
// 使用HomeStats类型




// 首页组件
// 统一的作品类型
type Work = (Workflow | AIApp) & {
  type: 'workflow' | 'ai-app';
};

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const { showWelcome, welcomeType, hideWelcomeCeremony } = useAuth();
  const navigate = useNavigate();
// 作品状态
  const [featuredWorks, setFeaturedWorks] = useState<Workflow[]>([]);
  const [popularWorks, setPopularWorks] = useState<Workflow[]>([]);
  const [recentWorks, setRecentWorks] = useState<Workflow[]>([]);
  
  // AI应用状态
  const [featuredAIApps, setFeaturedAIApps] = useState<AIApp[]>([]);
  const [popularAIApps, setPopularAIApps] = useState<AIApp[]>([]);
  const [recentAIApps, setRecentAIApps] = useState<AIApp[]>([]);
  
  // 合并工作流和AI应用的辅助函数
  const combineWorks = (workflows: Workflow[], aiApps: AIApp[]): Work[] => {
    const workflowWorks: Work[] = workflows.map(workflow => ({ ...workflow, type: 'workflow' as const }));
    const aiAppWorks: Work[] = aiApps.map(aiApp => ({ ...aiApp, type: 'ai-app' as const }));
    return [...workflowWorks, ...aiAppWorks].sort((a, b) => {
      // 按创建时间或其他排序逻辑排序
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  };
  
  // 统一的作品卡片组件
  const WorkCard: React.FC<{ work: Work }> = ({ work }) => {
    if (work.type === 'ai-app') {
      return <AIAppCard app={work as AIApp} navigate={navigate} />;
    } else {
      return (
        <WorkflowCard
          workflow={work as Workflow}
          onView={() => handleWorkView(work as Workflow)}
          onDownload={() => handleWorkDownload(work as Workflow)}
          onFavorite={() => handleWorkFavorite(work as Workflow)}
        />
      );
    }
  };
  const [, setCategories] = useState<Category[]>([]);


  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);







  // 加载作品数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        
        // 并行加载所有数据
        const [
          featuredWorkflowsRes, popularWorkflowsRes, recentWorkflowsRes,
          featuredAIAppsRes, popularAIAppsRes, recentAIAppsRes,
          categoriesRes
        ] = await Promise.all([
          // 工作流数据
          api.cozeWorkflow.getCozeWorkflows({ featured: true, pageSize: 3 }),
          api.cozeWorkflow.getCozeWorkflows({ sortBy: 'hot', pageSize: 3 }),
          api.cozeWorkflow.getCozeWorkflows({ sortBy: 'latest', pageSize: 3 }),
          // AI应用数据
          AIAppService.getAIApps({ featured: true, limit: 3 }),
          AIAppService.getAIApps({ sortBy: 'popular', limit: 3 }),
          AIAppService.getAIApps({ sortBy: 'recent', limit: 3 }),
          // 分类数据
          api.category.getCategories(),
        ]);

        // 设置工作流数据
        setFeaturedWorks(featuredWorkflowsRes.items);
        setPopularWorks(popularWorkflowsRes.items);
        setRecentWorks(recentWorkflowsRes.items);
        
        // 设置AI应用数据
        setFeaturedAIApps(featuredAIAppsRes.data?.items || []);
        setPopularAIApps(popularAIAppsRes.data?.items || []);
        setRecentAIApps(recentAIAppsRes.data?.items || []);
        
        setCategories(categoriesRes);
      } catch (error) {
        console.error('Failed to load homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理搜索
  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  // 处理作品操作
  const handleWorkView = (work: Workflow | AIApp) => {
    if ('type' in work && work.type === 'ai-app') {
      navigate(`/ai-app/${work.id}`);
    } else {
      navigate(`/coze-workflow/${work.id}`);
    }
  };

  const handleWorkDownload = async (work: Workflow | AIApp) => {
    try {
      // 这里应该调用下载API
      console.log('Download work:', work);
      // AI应用和工作流可能有不同的下载逻辑
    } catch (error) {
      console.error('Failed to download work:', error);
    }
  };

  const handleWorkFavorite = async (work: Workflow | AIApp) => {
    try {
      // 这里应该调用收藏API
      console.log('Favorite work:', work);
      // AI应用和工作流可能有不同的收藏逻辑
    } catch (error) {
      console.error('Failed to favorite work:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 dark:bg-gray-700/50 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* 装饰背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/5 dark:from-blue-500/10 to-purple-600/5 dark:to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-500/5 dark:from-teal-500/10 to-blue-600/5 dark:to-blue-600/10 rounded-full blur-3xl" />
      </div>
      
      <MainLayout>
        {/* 英雄区域 */}
        <section className="relative z-10 bg-white dark:bg-gradient-to-br dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm text-gray-900 dark:text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {t('home.hero.title')}
                <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  {t('home.hero.title.highlight')}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t('home.hero.subtitle')}
              </p>
            
              {/* 移动端搜索框 */}
              <div className="max-w-2xl mx-auto md:hidden px-4">
                <SearchBox
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  placeholder={t('home.hero.search.placeholder')}
                  className="w-full"
                />
              </div>


            </div>
          </div>
        </section>



        {/* 精选作品 */}
        <section className="relative z-10 py-16 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">精选作品</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">发现最受欢迎的工作流和AI应用</p>
              </div>
              <Button variant="outline" className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                <span>{t('home.viewAll')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {combineWorks(featuredWorks, featuredAIApps).map((work) => (
              <WorkCard key={`${work.type}-${work.id}`} work={work} />
            ))}
          </div>
        </div>
      </section>

        {/* 热门作品 */}
        <section className="relative z-10 py-16 bg-white dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">热门作品</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">最受用户喜爱的工作流和AI应用</p>
              </div>
              <Button variant="outline" className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                <span>{t('home.viewAll')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {combineWorks(popularWorks, popularAIApps).map((work) => (
              <WorkCard key={`${work.type}-${work.id}`} work={work} />
            ))}
          </div>
        </div>
      </section>

        {/* 最新作品 */}
        <section className="relative z-10 py-16 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">最新作品</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">最新发布的工作流和AI应用</p>
              </div>
              <Button variant="outline" className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                <span>{t('home.viewAll')}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {combineWorks(recentWorks, recentAIApps).map((work) => (
              <WorkCard key={`${work.type}-${work.id}`} work={work} />
            ))}
          </div>
        </div>
      </section>


      
      {/* 欢迎仪式弹窗 - 只在首页显示 */}
      <WelcomeCeremony
        isOpen={showWelcome}
        onClose={hideWelcomeCeremony}
        userType={welcomeType || 'new_user'}
      />
    </MainLayout>
    </div>
  );
};

export default HomePage;