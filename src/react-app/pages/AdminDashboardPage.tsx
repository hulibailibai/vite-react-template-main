import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Eye,
  Download,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Activity
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
// import { AdminLayout } from '../components/AdminLayout'; // 移除，因为在App.tsx中已经使用了AdminLayout包装
import api from '../services/api';
import { useAuth, usePermission } from '../contexts/AuthContext';
import { DashboardStats } from '../types';

// 最近活动接口
interface RecentActivity {
  id: number;
  type: 'user_register' | 'workflow_upload' | 'workflow_purchase' | 'workflow_review';
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}

// 管理员仪表盘页面
const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    totalWorkflows: 0,
    pendingWorkflows: 0,
    pendingAIApps: 0,
    pendingCreatorApplications: 0,
    todayDownloads: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => {
    if (!isAuthenticated || !user) return false;
    return isAdmin();
  }, [user?.role, isAuthenticated, isAdmin]);

  // 加载仪表盘数据
  useEffect(() => {
    if (!isAuthenticated || !isAdminUser || isLoading) {
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 获取统计数据
        const statsResponse = await api.admin.getDashboardStats();
        setStats(statsResponse);

        // 模拟最近活动数据
        const mockActivities: RecentActivity[] = [
          {
            id: 1,
            type: 'user_register',
            description: '新用户 "张三" 注册成为创作者',
            timestamp: '2024-01-15 14:30:00',
            status: 'success'
          },
          {
            id: 2,
            type: 'workflow_upload',
            description: '工作流 "Excel自动化处理" 等待审核',
            timestamp: '2024-01-15 13:45:00',
            status: 'warning'
          },
          {
            id: 3,
            type: 'workflow_purchase',
            description: '用户购买工作流 "数据分析模板"',
            timestamp: '2024-01-15 12:20:00',
            status: 'success'
          },
          {
            id: 4,
            type: 'workflow_review',
            description: '工作流 "图像处理工具" 收到新评价',
            timestamp: '2024-01-15 11:15:00',
            status: 'success'
          },
        ];
        setRecentActivities(mockActivities);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, isAdminUser, isLoading]);

  // 显示加载状态
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 获取活动图标
  const getActivityIcon = (type: RecentActivity['type'], status?: string) => {
    const iconClass = clsx('w-4 h-4', {
      'text-green-500': status === 'success',
      'text-yellow-500': status === 'warning',
      'text-red-500': status === 'error',
      'text-gray-500': !status,
    });

    switch (type) {
      case 'user_register':
        return <Users className={iconClass} />;
      case 'workflow_upload':
        return <FileText className={iconClass} />;
      case 'workflow_purchase':
        return <DollarSign className={iconClass} />;
      case 'workflow_review':
        return <Star className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  // 格式化数字
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(Number(num))) {
      return '0';
    }
    
    const numValue = Number(num);
    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    }
    if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    }
    return numValue.toString();
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 总用户数 */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">总用户数</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalUsers)}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* 活跃用户 */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">活跃用户</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.activeUsers)}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* 新增用户 */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">新增用户</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.newUsers)}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* 第二行统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 总工作流 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">总工作流</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.totalWorkflows)}
              </p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* 待审核 */}
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => navigate('/admin/reviews')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">待审核</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.pendingWorkflows + stats.pendingCreatorApplications)}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>工作流: {stats.pendingWorkflows}</span>
                <span className="mx-2">|</span>
                <span>创作者申请: {stats.pendingCreatorApplications}</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        {/* 今日下载 */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">今日下载</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.todayDownloads)}
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* 图表区域 */}
      <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">数据趋势</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">实时监控平台关键指标变化</p>
          </div>
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>查看详情</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 用户增长趋势图占位 */}
          <div className="lg:col-span-1">
            <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl flex flex-col items-center justify-center border border-blue-200 dark:border-blue-800">
              <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
              <p className="text-blue-600 dark:text-blue-400 font-medium">用户增长趋势</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">图表开发中...</p>
            </div>
          </div>
          
          {/* 收入统计图占位 */}
          <div className="lg:col-span-1">
            <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl flex flex-col items-center justify-center border border-green-200 dark:border-green-800">
              <DollarSign className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">收入统计</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">图表开发中...</p>
            </div>
          </div>
          
          {/* 热门分类分布图占位 */}
          <div className="lg:col-span-1">
            <div className="h-64 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl flex flex-col items-center justify-center border border-yellow-200 dark:border-yellow-800">
              <FileText className="w-12 h-12 text-yellow-500 mb-4" />
              <p className="text-yellow-600 dark:text-yellow-400 font-medium">热门分类分布</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">图表开发中...</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近活动 */}
        <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">最近活动</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">系统最新动态和用户行为</p>
            </div>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>查看全部</span>
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.timestamp}</p>
                </div>
                <div className="flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 快速操作 */}
        <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">快速操作</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">常用管理功能快速入口</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200"
              onClick={() => window.location.href = '/admin/users'}
            >
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">用户管理</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200"
              onClick={() => window.location.href = '/admin/coze-workflows'}
            >
              <div className="p-2 bg-purple-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">工作流管理</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200"
              onClick={() => window.location.href = '/admin/transactions'}
            >
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">交易管理</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center space-y-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200"
              onClick={() => window.location.href = '/admin/advertisements'}
            >
              <div className="p-2 bg-orange-500 rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">广告管理</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* 待处理事项 */}
      <Card className="p-8 bg-white dark:bg-gray-800 shadow-xl border-0 rounded-2xl mt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">待处理事项</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">需要关注的重要任务和系统状态</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-200">
            <div className="p-3 bg-yellow-500 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{stats.pendingWorkflows} 个工作流待审核</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">需要及时处理</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200">
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">{stats.pendingAIApps} 个AI应用待审核</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">需要尽快审核</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-lg">系统运行正常</p>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">所有服务正常</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;