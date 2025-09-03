import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Plus,
  Search,

  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  BarChart3,
  Target,
  Calendar,
  DollarSign,

  MousePointer,

  Image as ImageIcon,
  ExternalLink,
  Clock
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { useAlert } from '../contexts/AlertContext';

// 广告接口
interface Advertisement {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  position: 'banner' | 'sidebar' | 'popup' | 'inline';
  status: 'active' | 'paused' | 'ended' | 'pending';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number; // 点击率
  cpc: number; // 每次点击成本
  createdAt: string;
  updatedAt: string;
}

// 广告统计接口
interface AdStats {
  totalAds: number;
  activeAds: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  averageCpc: number;
}

// 广告表单接口
interface AdFormData {
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  position: Advertisement['position'];
  startDate: string;
  endDate: string;
  budget: number;
}

// 广告表单模态框接口
interface AdFormModalProps {
  ad: Advertisement | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ad: Advertisement) => void;
}

// 广告表单模态框组件
const AdFormModal: React.FC<AdFormModalProps> = ({ ad, isOpen, onClose, onSave }) => {
  const { showSuccess, showError } = useAlert();
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    position: 'banner',
    startDate: '',
    endDate: '',
    budget: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AdFormData, string>>>({});

  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title,
        description: ad.description,
        imageUrl: ad.imageUrl,
        targetUrl: ad.targetUrl,
        position: ad.position,
        startDate: ad.startDate,
        endDate: ad.endDate,
        budget: ad.budget
      });
    } else {
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        targetUrl: '',
        position: 'banner',
        startDate: '',
        endDate: '',
        budget: 0
      });
    }
    setErrors({});
  }, [ad, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入广告标题';
    }
    if (!formData.description.trim()) {
      newErrors.description = '请输入广告描述';
    }
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = '请输入广告图片URL';
    }
    if (!formData.targetUrl.trim()) {
      newErrors.targetUrl = '请输入目标链接';
    }
    if (!formData.startDate) {
      newErrors.startDate = '请选择开始日期';
    }
    if (!formData.endDate) {
      newErrors.endDate = '请选择结束日期';
    }
    if (formData.budget <= 0) {
      newErrors.budget = '预算必须大于0';
    }
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = '结束日期必须晚于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const adData: Advertisement = {
        id: ad?.id || Date.now(),
        ...formData,
        status: ad?.status || 'pending',
        spent: ad?.spent || 0,
        impressions: ad?.impressions || 0,
        clicks: ad?.clicks || 0,
        ctr: ad?.ctr || 0,
        cpc: ad?.cpc || 0,
        createdAt: ad?.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      onSave(adData);
      showSuccess(ad ? '广告更新成功！' : '广告创建成功！');
      onClose();
    } catch (error) {
      console.error('Failed to save ad:', error);
      showError('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AdFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ad ? '编辑广告' : '创建广告'} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              广告标题 *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="输入广告标题"
              errorMessage={errors.title}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              广告位置 *
            </label>
            <select
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value as Advertisement['position'])}
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="banner">横幅广告</option>
              <option value="sidebar">侧边栏广告</option>
              <option value="popup">弹窗广告</option>
              <option value="inline">内容内嵌广告</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            广告描述 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="输入广告描述"
            rows={3}
            className={clsx(
              'w-full px-3 py-2 bg-gray-700/50 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.description ? 'border-red-300' : 'border-gray-600'
            )}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            广告图片URL *
          </label>
          <Input
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            placeholder="输入广告图片URL"
            errorMessage={errors.imageUrl}
          />
          {formData.imageUrl && (
            <div className="mt-2">
              <img
                src={formData.imageUrl}
                alt="广告预览"
                className="w-32 h-20 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            目标链接 *
          </label>
          <Input
            value={formData.targetUrl}
            onChange={(e) => handleInputChange('targetUrl', e.target.value)}
            placeholder="输入目标链接URL"
            errorMessage={errors.targetUrl}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              开始日期 *
            </label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              errorMessage={errors.startDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              结束日期 *
            </label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              errorMessage={errors.endDate}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              预算 (¥) *
            </label>
            <Input
              type="number"
              value={formData.budget.toString()}
              onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
              placeholder="输入广告预算"
              min="0"
              step="0.01"
              errorMessage={errors.budget}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white"
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
          >
            {ad ? '更新广告' : '创建广告'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 广告商后台页面
export const AdvertiserPage: React.FC = () => {
  const { showSuccess, showError, showConfirm } = useAlert();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdStats>({
    totalAds: 0,
    activeAds: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCtr: 0,
    averageCpc: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // 加载广告数据
  const loadAds = async () => {
    try {
      setLoading(true);
      
      // 模拟广告数据
      const mockAds: Advertisement[] = [
        {
          id: 1,
          title: '工作流平台推广',
          description: '专业的工作流分享平台，提升工作效率',
          imageUrl: '/images/ad1.jpg',
          targetUrl: 'https://example.com/workflows',
          position: 'banner',
          status: 'active',
          startDate: '2024-01-01',
          endDate: '2024-02-01',
          budget: 5000,
          spent: 2350,
          impressions: 125000,
          clicks: 2500,
          ctr: 2.0,
          cpc: 0.94,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15'
        },
        {
          id: 2,
          title: 'Excel自动化工具',
          description: '一键处理Excel数据，节省时间成本',
          imageUrl: '/images/ad2.jpg',
          targetUrl: 'https://example.com/excel-tools',
          position: 'sidebar',
          status: 'active',
          startDate: '2024-01-10',
          endDate: '2024-01-31',
          budget: 3000,
          spent: 1200,
          impressions: 68000,
          clicks: 1360,
          ctr: 2.0,
          cpc: 0.88,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-15'
        },
        {
          id: 3,
          title: '数据分析课程',
          description: '从零开始学习数据分析，掌握核心技能',
          imageUrl: '/images/ad3.jpg',
          targetUrl: 'https://example.com/data-course',
          position: 'popup',
          status: 'paused',
          startDate: '2024-01-05',
          endDate: '2024-02-05',
          budget: 8000,
          spent: 3200,
          impressions: 95000,
          clicks: 1900,
          ctr: 2.0,
          cpc: 1.68,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-12'
        },
        {
          id: 4,
          title: 'AI写作助手',
          description: '智能写作工具，提升内容创作效率',
          imageUrl: '/images/ad4.jpg',
          targetUrl: 'https://example.com/ai-writer',
          position: 'inline',
          status: 'ended',
          startDate: '2023-12-01',
          endDate: '2023-12-31',
          budget: 4500,
          spent: 4500,
          impressions: 180000,
          clicks: 3600,
          ctr: 2.0,
          cpc: 1.25,
          createdAt: '2023-12-01',
          updatedAt: '2023-12-31'
        }
      ];
      
      setAds(mockAds);
      setTotalPages(Math.ceil(mockAds.length / pageSize));

      // 计算统计数据
      const totalBudget = mockAds.reduce((sum, ad) => sum + ad.budget, 0);
      const totalSpent = mockAds.reduce((sum, ad) => sum + ad.spent, 0);
      const totalImpressions = mockAds.reduce((sum, ad) => sum + ad.impressions, 0);
      const totalClicks = mockAds.reduce((sum, ad) => sum + ad.clicks, 0);
      const activeAds = mockAds.filter(ad => ad.status === 'active').length;
      
      setStats({
        totalAds: mockAds.length,
        activeAds,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        averageCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        averageCpc: totalClicks > 0 ? totalSpent / totalClicks : 0
      });
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [currentPage]);

  // 过滤广告
  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || ad.position === positionFilter;
    
    return matchesSearch && matchesStatus && matchesPosition;
  });

  // 获取状态图标和颜色
  const getStatusInfo = (status: Advertisement['status']) => {
    switch (status) {
      case 'active':
        return { icon: <Play className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-100', label: '投放中' };
      case 'paused':
        return { icon: <Pause className="w-4 h-4" />, color: 'text-yellow-600', bg: 'bg-yellow-100', label: '已暂停' };
      case 'ended':
        return { icon: <Calendar className="w-4 h-4" />, color: 'text-gray-600', bg: 'bg-gray-100', label: '已结束' };
      case 'pending':
      default:
        return { icon: <Clock className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-100', label: '待审核' };
    }
  };

  // 获取位置标签
  const getPositionLabel = (position: Advertisement['position']) => {
    switch (position) {
      case 'banner': return '横幅广告';
      case 'sidebar': return '侧边栏';
      case 'popup': return '弹窗';
      case 'inline': return '内嵌';
      default: return position;
    }
  };

  // 处理广告操作
  const handleAdAction = async (adId: number, action: string) => {
    try {
      const ad = ads.find(a => a.id === adId);
      if (!ad) return;

      switch (action) {
        case 'edit':
          setSelectedAd(ad);
          setIsFormModalOpen(true);
          break;
        case 'pause':
          setAds(ads.map(a => a.id === adId ? { ...a, status: 'paused' as const } : a));
          showSuccess('广告已暂停');
          break;
        case 'resume':
          setAds(ads.map(a => a.id === adId ? { ...a, status: 'active' as const } : a));
          showSuccess('广告已恢复投放');
          break;
        case 'delete':
          const confirmed = await showConfirm('确定要删除这个广告吗？此操作不可恢复。');
          if (confirmed) {
            setAds(ads.filter(a => a.id !== adId));
            showSuccess('广告已删除');
          }
          break;
      }
    } catch (error) {
      console.error('Failed to perform ad action:', error);
      showError('操作失败，请重试');
    }
  };

  // 保存广告
  const handleSaveAd = (adData: Advertisement) => {
    if (selectedAd) {
      // 更新现有广告
      setAds(ads.map(a => a.id === adData.id ? adData : a));
    } else {
      // 创建新广告
      setAds([...ads, adData]);
    }
    setSelectedAd(null);
  };

  // 创建新广告
  const handleCreateAd = () => {
    setSelectedAd(null);
    setIsFormModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700/50 rounded w-64"></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700/50 rounded"></div>
              ))}
            </div>
            <div className="h-12 bg-gray-700/50 rounded"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-700/50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              广告管理
            </h1>
            <p className="text-gray-300">
              管理您的广告投放和效果分析
            </p>
          </div>
          <Button 
            onClick={handleCreateAd}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            创建广告
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">总广告数</p>
                <p className="text-3xl font-bold text-white">{stats.totalAds}</p>
                <p className="text-sm text-green-400 mt-1">
                  {stats.activeAds} 个投放中
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">总预算</p>
                <p className="text-3xl font-bold text-white">${stats.totalBudget.toLocaleString()}</p>
                <p className="text-sm text-gray-300 mt-1">
                  已花费 ${stats.totalSpent.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">总展示</p>
                <p className="text-3xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
                <p className="text-sm text-blue-400 mt-1">
                  {stats.totalClicks.toLocaleString()} 次点击
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1">平均CTR</p>
                <p className="text-3xl font-bold text-white">{stats.averageCtr.toFixed(2)}%</p>
                <p className="text-sm text-gray-300 mt-1">
                  CPC ${stats.averageCpc.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <MousePointer className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* 搜索和过滤 */}
        <Card className="p-6 mb-6 bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索广告标题或描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有状态</option>
                <option value="active">投放中</option>
                <option value="paused">已暂停</option>
                <option value="ended">已结束</option>
                <option value="pending">待审核</option>
              </select>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有位置</option>
                <option value="banner">横幅广告</option>
                <option value="sidebar">侧边栏</option>
                <option value="popup">弹窗</option>
                <option value="inline">内嵌</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 广告列表 */}
        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    广告
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    位置
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    投放时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    预算/花费
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    效果
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {filteredAds.map((ad) => {
                  const statusInfo = getStatusInfo(ad.status);
                  return (
                    <tr key={ad.id} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center mr-4">
                            {ad.imageUrl ? (
                              <img 
                                src={ad.imageUrl} 
                                alt={ad.title}
                                className="w-16 h-12 rounded object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-white truncate">
                              {ad.title}
                            </div>
                            <div className="text-sm text-gray-300 truncate">
                              {ad.description}
                            </div>
                            <div className="flex items-center mt-1">
                              <ExternalLink className="w-3 h-3 text-gray-400 mr-1" />
                              <a 
                                href={ad.targetUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate max-w-32"
                              >
                                {ad.targetUrl}
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="default">{getPositionLabel(ad.position)}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={clsx('p-1 rounded-full', statusInfo.bg)}>
                            <div className={statusInfo.color}>
                              {statusInfo.icon}
                            </div>
                          </div>
                          <span className={clsx('text-sm font-medium', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div>{ad.startDate}</div>
                          <div className="text-gray-300">至 {ad.endDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div>
                          <div className="font-medium">${ad.budget.toLocaleString()}</div>
                          <div className="text-gray-300">已花费 ${ad.spent.toLocaleString()}</div>
                          <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full" 
                              style={{ width: `${Math.min((ad.spent / ad.budget) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span className="text-white">{ad.impressions.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MousePointer className="w-3 h-3 text-gray-400" />
                            <span className="text-white">{ad.clicks.toLocaleString()}</span>
                            <span className="text-gray-400">({ad.ctr.toFixed(1)}%)</span>
                          </div>
                          <div className="text-xs text-gray-300">
                            CPC: ¥{ad.cpc.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu
                          trigger={
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          }
                          items={[
                            {
                              label: '编辑',
                              icon: <Edit className="w-4 h-4" />,
                              onClick: () => handleAdAction(ad.id, 'edit')
                            },
                            {
                              label: '查看报告',
                              icon: <BarChart3 className="w-4 h-4" />,
                              onClick: () => console.log('View report for ad', ad.id)
                            },
                            ...(ad.status === 'active' ? [
                              {
                                label: '暂停',
                                icon: <Pause className="w-4 h-4" />,
                                onClick: () => handleAdAction(ad.id, 'pause'),
                                className: 'text-yellow-600'
                              }
                            ] : ad.status === 'paused' ? [
                              {
                                label: '恢复',
                                icon: <Play className="w-4 h-4" />,
                                onClick: () => handleAdAction(ad.id, 'resume'),
                                className: 'text-green-600'
                              }
                            ] : []),
                            {
                              label: '删除',
                              icon: <Trash2 className="w-4 h-4" />,
                              onClick: () => handleAdAction(ad.id, 'delete'),
                              className: 'text-red-600'
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-300">
                  显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, filteredAds.length)} 条，
                  共 {filteredAds.length} 条记录
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 广告表单模态框 */}
        <AdFormModal
          ad={selectedAd}
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedAd(null);
          }}
          onSave={handleSaveAd}
        />
      </div>
    </div>
  );
};