import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAlert } from '../../hooks/useAlert';
import { adminApi } from '../../services/api';
import { 
  Users, 
  DollarSign, 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Target,
  Activity
} from 'lucide-react';

// 真实佣金用户数据接口
interface RealCommissionUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  workflow_count: number;
  total_earnings: number;
  created_at: string;
  // 佣金相关字段
  commission_rate: number;
  auto_payout_enabled: boolean;
  last_payout_date?: string;
  pending_commission: number;
  // 真实数据字段
  favorite_count?: number;
  download_count?: number;
  conversation_count?: number;
}

// 佣金算法配置接口
interface CommissionAlgorithmConfig {
  profit_commission_rate: number; // 纯利润佣金发放比例
  platform_cost_rate: number; // 平台运营成本比例（无限制）
  auto_payout_enabled: boolean;
  payout_frequency: 'daily' | 'weekly' | 'monthly';
  favorite_weight: number; // 收藏量权重
  download_weight: number; // 下载量权重
  conversation_weight: number; // 对话量权重
}

// 算法配置模态框
interface AlgorithmConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CommissionAlgorithmConfig;
  onSave: (config: CommissionAlgorithmConfig) => void;
}

const AlgorithmConfigModal: React.FC<AlgorithmConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formConfig, setFormConfig] = useState<CommissionAlgorithmConfig>(config);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(formConfig);
      showAlert({ message: '佣金算法配置已更新', type: 'success' });
      onClose();
    } catch (error) {
      showAlert({ message: '更新配置失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="佣金算法配置" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            智能佣金算法
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            基于纯利润分配和作品数据权重的智能佣金计算系统
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              佣金发放比例 (%)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formConfig.profit_commission_rate}
              onChange={(e) => setFormConfig({...formConfig, profit_commission_rate: parseFloat(e.target.value) || 0})}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              从纯利润中拿出多少百分比用于佣金发放
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              平台运营成本 (%)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={formConfig.platform_cost_rate}
              onChange={(e) => setFormConfig({...formConfig, platform_cost_rate: parseFloat(e.target.value) || 0})}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              从用户充值金额中扣除的运营成本比例
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              发放频率
            </label>
            <select
              value={formConfig.payout_frequency}
              onChange={(e) => setFormConfig({...formConfig, payout_frequency: e.target.value as 'daily' | 'weekly' | 'monthly'})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>


        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">数据权重配置</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                收藏量权重
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formConfig.favorite_weight}
                onChange={(e) => setFormConfig({...formConfig, favorite_weight: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                下载量权重
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formConfig.download_weight}
                onChange={(e) => setFormConfig({...formConfig, download_weight: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                对话量权重
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formConfig.conversation_weight}
                onChange={(e) => setFormConfig({...formConfig, conversation_weight: parseFloat(e.target.value) || 0})}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="auto_payout"
            checked={formConfig.auto_payout_enabled}
            onChange={(e) => setFormConfig({...formConfig, auto_payout_enabled: e.target.checked})}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="auto_payout" className="text-sm text-gray-700 dark:text-gray-300">
            启用自动发放
          </label>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">算法预览</h5>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <p>• 纯利润计算: 用户充值金额 - {formConfig.platform_cost_rate}% 平台运营成本</p>
            <p>• 佣金池: 纯利润 × {formConfig.profit_commission_rate}% 用于佣金发放</p>
            <p>• 数据权重: 收藏{(formConfig.favorite_weight * 100).toFixed(0)}% | 下载{(formConfig.download_weight * 100).toFixed(0)}% | 对话{(formConfig.conversation_weight * 100).toFixed(0)}%</p>
            <p>• 分配方式: 根据创作者的数据权重得分按比例分配佣金池</p>
            <p>• 发放周期: {formConfig.payout_frequency === 'daily' ? '每日' : formConfig.payout_frequency === 'weekly' ? '每周' : '每月'}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading} className="bg-blue-600 hover:bg-blue-700">
            保存配置
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// 排序类型定义
type SortField = 'username' | 'commission_rate' | 'pending_commission' | 'favorite_count' | 'download_count' | 'conversation_count' | 'workflow_count';
type SortOrder = 'asc' | 'desc';

// 主页面组件
const AdminRealCommissionPage: React.FC = () => {
  const [users, setUsers] = useState<RealCommissionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [algorithmRunning, setAlgorithmRunning] = useState(false);
  // 排序状态
  const [sortField, setSortField] = useState<SortField>('pending_commission');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { showAlert } = useAlert();

  // 算法配置状态
  const [algorithmConfig, setAlgorithmConfig] = useState<CommissionAlgorithmConfig>({
    profit_commission_rate: 60, // 从纯利润中拿出60%用于佣金发放
    platform_cost_rate: 15, // 默认15%平台成本
    auto_payout_enabled: true,
    payout_frequency: 'weekly',
    favorite_weight: 0.3, // 收藏量权重30%
    download_weight: 0.4, // 下载量权重40%
    conversation_weight: 0.3 // 对话量权重30%
  });

  // 实时统计数据
  const [stats, setStats] = useState({
    total_creators: 0,
    active_payouts: 0,
    total_commission_paid: 0,
    pending_commission: 0
  });

  // 自动发放状态
  const [autoPayoutStatus, setAutoPayoutStatus] = useState({
    isRunning: false,
    lastRunTime: null as Date | null,
    nextRunTime: null as Date | null,
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0
  });

  // 基于真实数据计算创作者佣金的算法
  const calculateRealCommission = (user: any, config: CommissionAlgorithmConfig): number => {
    // 获取用户的作品数据
    const favoriteCount = user.favorite_count || 0;
    const downloadCount = user.download_count || 0;
    const conversationCount = user.conversation_count || 0;
    
    // 计算用户的数据权重得分
    const userDataScore = (
      favoriteCount * config.favorite_weight + 
      downloadCount * config.download_weight + 
      conversationCount * config.conversation_weight
    );
    // 基于数据权重得分计算佣金
    // 这里简化处理，实际应该根据所有用户的数据权重得分来分配佣金池
    const baseCommissionRate = Math.min(userDataScore / 1000, 1.0); // 标准化到0-1之间
    // 计算最终佣金（基于基础佣金池）
    const baseCommissionPool = 10000; // 基础佣金池
    return baseCommissionPool * baseCommissionRate * (config.profit_commission_rate / 100);
  };

  // 获取真实统计数据
  const fetchRealStats = async () => {
    try {
      const realTimeStats = await adminApi.getRealTimeStats();
      
      setStats({
        total_creators: realTimeStats.total_creators,
        active_payouts: realTimeStats.active_payouts,
        total_commission_paid: realTimeStats.total_commission_paid,
        pending_commission: realTimeStats.pending_commission
      });
      
      // 更新自动发放状态
      setAutoPayoutStatus(prev => ({
        ...prev,
        totalProcessed: realTimeStats.total_processed,
        successCount: realTimeStats.success_count,
        failureCount: realTimeStats.failure_count
      }));
    } catch (error) {
      console.error('获取统计数据失败:', error);
      showAlert({ message: '获取统计数据失败', type: 'error' });
    }
  };



  useEffect(() => {
    fetchUsers();
    fetchRealStats();
  }, [currentPage, searchTerm]);

  // 初始化时获取统计数据
  useEffect(() => {
    fetchRealStats();
  }, []);

  // 定时更新数据和自动发放检查
  useEffect(() => {
    const interval = setInterval(() => {
      if (algorithmRunning) {
        // 获取真实数据更新
        fetchRealStats();
        
        // 检查是否需要自动发放
        const now = new Date();
        if (algorithmConfig.auto_payout_enabled && 
            autoPayoutStatus.nextRunTime && 
            now >= autoPayoutStatus.nextRunTime && 
            !autoPayoutStatus.isRunning) {
          processAutoPayout();
        }
      }
    }, 10000); // 每10秒更新一次真实数据
    
    return () => clearInterval(interval);
  }, [algorithmRunning, algorithmConfig.auto_payout_enabled, autoPayoutStatus.nextRunTime, autoPayoutStatus.isRunning]);

  // 初始化下次运行时间
  useEffect(() => {
    if (algorithmConfig.auto_payout_enabled && !autoPayoutStatus.nextRunTime) {
      setAutoPayoutStatus(prev => ({
        ...prev,
        nextRunTime: getNextRunTime()
      }));
    }
  }, [algorithmConfig.auto_payout_enabled]);

  // 排序函数
  const sortUsers = (users: RealCommissionUser[], field: SortField, order: SortOrder): RealCommissionUser[] => {
    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (field) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'workflow_count':
          aValue = a.workflow_count;
          bValue = b.workflow_count;
          break;
        case 'commission_rate':
          aValue = a.commission_rate;
          bValue = b.commission_rate;
          break;
        case 'pending_commission':
          aValue = a.pending_commission;
          bValue = b.pending_commission;
          break;
        case 'favorite_count':
          aValue = a.favorite_count || 0;
          bValue = b.favorite_count || 0;
          break;
        case 'download_count':
          aValue = a.download_count || 0;
          bValue = b.download_count || 0;
          break;
        case 'conversation_count':
          aValue = a.conversation_count || 0;
          bValue = b.conversation_count || 0;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
  };

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 获取排序图标
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // 获取排序按钮样式
  const getSortButtonClass = (field: SortField) => {
    const baseClass = "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors";
    return sortField === field ? `${baseClass} bg-blue-50 dark:bg-blue-900/30` : baseClass;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getUsersWithStats({
        page: currentPage,
        pageSize: 10,
        search: searchTerm,
        role: 'creator'
      });
      
      // 转换API数据为RealCommissionUser格式
      const transformedUsers: RealCommissionUser[] = response.items.map((user: any) => {
        const userData = {
          favorite_count: user.favorite_count,
          download_count: user.download_count,
          conversation_count: user.conversation_count
        };
        
        const pendingCommission = calculateRealCommission(userData, algorithmConfig);
        const commissionRate = pendingCommission > 0 ? Math.min((pendingCommission / 1000) * 100, 25) : 0; // 基于佣金金额计算比例
        
        return {
          ...user,
          commission_rate: commissionRate,
          auto_payout_enabled: Math.random() > 0.2, // TODO: 从数据库获取实际的自动发放设置
          last_payout_date: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined, // TODO: 从数据库获取实际的最后发放日期
          pending_commission: pendingCommission,
          total_earnings: 0 // TODO: 从数据库获取实际的总收益
        };
      });
      
      // 按待发放佣金排序
      const sortedUsers = sortUsers(transformedUsers, sortField, sortOrder);
      
      setUsers(sortedUsers);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('获取创作者数据失败:', error);
      showAlert({ message: '获取创作者数据失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlgorithm = async () => {
    try {
      setAlgorithmRunning(!algorithmRunning);
      showAlert({
        message: algorithmRunning ? '佣金算法已停止' : '佣金算法已启动，开始实时计算和发放',
        type: algorithmRunning ? 'info' : 'success'
      });
    } catch (error) {
      showAlert({ message: '操作失败', type: 'error' });
    }
  };

  const handleManualPayout = async (userId?: number) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const message = userId ? '单个用户佣金发放成功' : '批量佣金发放成功';
      showAlert({ message, type: 'success' });
      fetchUsers();
    } catch (error) {
      showAlert({ message: '发放失败', type: 'error' });
    }
  };

  // 自动发放佣金逻辑
  const processAutoPayout = async () => {
    if (!algorithmConfig.auto_payout_enabled) return;
    
    setAutoPayoutStatus(prev => ({ ...prev, isRunning: true }));
    
    try {
      // 获取符合自动发放条件的用户
      const eligibleUsers = users.filter(user => 
        user.auto_payout_enabled && 
        user.pending_commission > 0
      );
      
      let successCount = 0;
      let failureCount = 0;
      
      // 批量处理发放
      for (let i = 0; i < eligibleUsers.length; i++) {
        const user = eligibleUsers[i];
        try {
          // 模拟发放API调用
          console.log(`Processing payout for user: ${user.username}, amount: ${user.pending_commission}`);
          await new Promise(resolve => setTimeout(resolve, 200));
          successCount++;
        } catch (error) {
          console.error(`Failed to process payout for user: ${user.username}`, error);
          failureCount++;
        }
      }
      
      // 更新统计信息
      setAutoPayoutStatus(prev => ({
        ...prev,
        isRunning: false,
        lastRunTime: new Date(),
        nextRunTime: getNextRunTime(),
        totalProcessed: prev.totalProcessed + eligibleUsers.length,
        successCount: prev.successCount + successCount,
        failureCount: prev.failureCount + failureCount
      }));
      
      if (successCount > 0) {
        showAlert({ 
          message: `自动发放完成：成功 ${successCount} 个，失败 ${failureCount} 个`, 
          type: 'success' 
        });
        fetchUsers();
      }
    } catch (error) {
      setAutoPayoutStatus(prev => ({ ...prev, isRunning: false }));
      showAlert({ message: '自动发放处理失败', type: 'error' });
    }
  };

  // 计算下次运行时间
  const getNextRunTime = (): Date => {
    const now = new Date();
    const next = new Date(now);
    
    switch (algorithmConfig.payout_frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(now.getMonth() + 1);
        break;
    }
    
    return next;
  };

  // 手动触发自动发放
  const handleTriggerAutoPayout = async () => {
    await processAutoPayout();
  };

  // 批量发放符合条件的佣金
  const handleBatchPayout = async () => {
    const eligibleUsers = users.filter(user => 
      user.pending_commission > 0
    );
    
    if (eligibleUsers.length === 0) {
      showAlert({ message: '没有符合发放条件的用户', type: 'warning' });
      return;
    }
    
    try {
      // 模拟批量发放API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      showAlert({ 
        message: `批量发放成功，共处理 ${eligibleUsers.length} 个用户`, 
        type: 'success' 
      });
      fetchUsers();
    } catch (error) {
      showAlert({ message: '批量发放失败', type: 'error' });
    }
  };

  const handleConfigSave = (config: CommissionAlgorithmConfig) => {
    setAlgorithmConfig(config);
    // 重新生成用户数据以反映新配置
    fetchUsers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getCommissionRateColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 15) return 'text-blue-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和控制面板 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-green-200 dark:border-green-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">智能佣金管理系统</h2>
            <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
              algorithmRunning 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {algorithmRunning ? '运行中' : '已停止'}
            </div>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setIsConfigModalOpen(true)}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              算法配置
            </Button>
            <Button
              onClick={handleTriggerAutoPayout}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
              disabled={autoPayoutStatus.isRunning || !algorithmConfig.auto_payout_enabled}
            >
              <Zap className="h-4 w-4 mr-2" />
              {autoPayoutStatus.isRunning ? '发放中...' : '立即发放'}
            </Button>
            <Button
              onClick={handleBatchPayout}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              批量发放
            </Button>
            <Button
              onClick={handleToggleAlgorithm}
              className={algorithmRunning 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
              }
            >
              {algorithmRunning ? (
                <><Pause className="h-4 w-4 mr-2" />停止算法</>
              ) : (
                <><Play className="h-4 w-4 mr-2" />启动算法</>
              )}
            </Button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          基于AI算法的实时佣金计算与自动发放系统，根据销售表现、作品质量和用户活跃度动态调整佣金率。
        </p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-green-600 dark:text-green-400">
            <Target className="h-4 w-4 mr-1" />
            <span>自动发放: {algorithmConfig.auto_payout_enabled ? '已启用' : '已禁用'}</span>
          </div>
          {algorithmConfig.auto_payout_enabled && (
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              {autoPayoutStatus.lastRunTime && (
                <span>上次发放: {autoPayoutStatus.lastRunTime.toLocaleString()}</span>
              )}
              {autoPayoutStatus.nextRunTime && (
                <span>下次发放: {autoPayoutStatus.nextRunTime.toLocaleString()}</span>
              )}
              <span>成功: {autoPayoutStatus.successCount} | 失败: {autoPayoutStatus.failureCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* 实时统计面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">活跃创作者</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{stats.total_creators}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">活跃发放</p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">{stats.active_payouts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">已发放总额</p>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">¥{stats.total_commission_paid.toFixed(0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400">待发放</p>
              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">¥{stats.pending_commission.toFixed(0)}</p>
            </div>
          </div>
        </Card>


      </div>

      {/* 自动发放状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              autoPayoutStatus.isRunning 
                ? 'bg-yellow-500' 
                : algorithmConfig.auto_payout_enabled 
                  ? 'bg-green-500'
                  : 'bg-gray-500'
            }`}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">自动发放状态</p>
              <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                {autoPayoutStatus.isRunning ? '运行中' : 
                 algorithmConfig.auto_payout_enabled ? '已启用' : '已禁用'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700">
          <div className="flex items-center">
            <div className="p-2 bg-teal-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400">发放统计</p>
              <p className="text-lg font-bold text-teal-900 dark:text-teal-100">
                {autoPayoutStatus.successCount}/{autoPayoutStatus.totalProcessed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-700">
          <div className="flex items-center">
            <div className="p-2 bg-pink-500 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-pink-600 dark:text-pink-400">发放频率</p>
              <p className="text-lg font-bold text-pink-900 dark:text-pink-100">
                {algorithmConfig.payout_frequency === 'daily' ? '每日' : 
                 algorithmConfig.payout_frequency === 'weekly' ? '每周' : '每月'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索创作者用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="pending_commission-desc">待发放佣金 ↓</option>
              <option value="pending_commission-asc">待发放佣金 ↑</option>
              <option value="workflow_count-desc">作品数量 ↓</option>
              <option value="workflow_count-asc">作品数量 ↑</option>
              <option value="commission_rate-desc">佣金率 ↓</option>
              <option value="commission_rate-asc">佣金率 ↑</option>
              <option value="favorite_count-desc">收藏量 ↓</option>
              <option value="favorite_count-asc">收藏量 ↑</option>
              <option value="download_count-desc">下载量 ↓</option>
              <option value="download_count-asc">下载量 ↑</option>
              <option value="conversation_count-desc">对话量 ↓</option>
              <option value="conversation_count-asc">对话量 ↑</option>
              <option value="username-asc">用户名 A-Z</option>
              <option value="username-desc">用户名 Z-A</option>
            </select>
            <Button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700">
              搜索
            </Button>
          </div>
        </div>

        {/* 创作者列表 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className={getSortButtonClass('username')} onClick={() => handleSort('username')}>
                      创作者信息 {getSortIcon('username')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="space-y-1">
                      <div className="text-xs">作品数据</div>
                      <div className="flex space-x-2 text-xs">
                        <span className={getSortButtonClass('favorite_count')} onClick={() => handleSort('favorite_count')}>
                          收藏 {getSortIcon('favorite_count')}
                        </span>
                        <span className={getSortButtonClass('download_count')} onClick={() => handleSort('download_count')}>
                          下载 {getSortIcon('download_count')}
                        </span>
                        <span className={getSortButtonClass('conversation_count')} onClick={() => handleSort('conversation_count')}>
                          对话 {getSortIcon('conversation_count')}
                        </span>
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className={getSortButtonClass('workflow_count')} onClick={() => handleSort('workflow_count')}>
                      作品数量 {getSortIcon('workflow_count')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className={getSortButtonClass('commission_rate')} onClick={() => handleSort('commission_rate')}>
                      佣金率 {getSortIcon('commission_rate')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className={getSortButtonClass('pending_commission')} onClick={() => handleSort('pending_commission')}>
                      待发放 {getSortIcon('pending_commission')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    自动发放
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {user.workflow_count} 个作品
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? '活跃' : '非活跃'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center text-blue-600">
                          <span className="mr-1">❤️</span>
                          <span>{user.favorite_count || 0} 收藏</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <span className="mr-1">⬇️</span>
                          <span>{user.download_count || 0} 下载</span>
                        </div>
                        <div className="flex items-center text-purple-600">
                          <span className="mr-1">💬</span>
                          <span>{user.conversation_count || 0} 对话</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {user.workflow_count} 个作品
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getCommissionRateColor(user.commission_rate)}`}>
                        {user.commission_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ¥{user.pending_commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.auto_payout_enabled ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {user.auto_payout_enabled ? '已启用' : '已禁用'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        size="sm"
                        onClick={() => handleManualPayout(user.id)}
                        disabled={user.pending_commission <= 0}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        立即发放
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                第 {currentPage} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 算法配置模态框 */}
      <AlgorithmConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={algorithmConfig}
        onSave={handleConfigSave}
      />
    </div>
  );
};

export default AdminRealCommissionPage;