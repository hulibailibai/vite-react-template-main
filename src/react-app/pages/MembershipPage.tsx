import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Gift,
  Bot,
  Cpu,
  Database,
  Rocket,
  Wallet,
  CreditCard,
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/NewNavigation';
import { useMembershipStatus } from '../hooks/useMembershipStatus';
import { useSearchParams } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';
import api from '../services/api';

// 会员套餐类型
interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  icon: React.ReactNode;
}

// 月费套餐数据
const monthlyPlans: MembershipPlan[] = [
  {
    id: 'light',
    name: '轻享版',
    price: 0.01, // 4.9
    period: '月',
    description: '',
    features: [
      '每月可获得8000WH币',
      '约可生成高质量图片133个标准视频'
    ],
    color: 'from-gray-600 to-gray-800',
    icon: <Bot className="w-6 h-6" />
  },
  {
    id: 'light-plus',
    name: '轻享版 Plus',
    price: 8.9,
    originalPrice: 12.9,
    period: '月',
    description: '',
    features: [
      '每月可获得8000WH币',
      '约可生成高质量图片133个标准视频'
    ],
    color: 'from-gray-600 to-gray-800',
    icon: <Cpu className="w-6 h-6" />
  },
  {
    id: 'basic',
    name: '基础版',
    price: 9.9,
    originalPrice: 14.9,
    period: '月',
    description: '',
    features: [
      '每月可获得50000WH币',
      '约可生成高质量图片166个标准视频'
    ],
    popular: true,
    color: 'from-orange-500 to-red-600',
    icon: <Database className="w-6 h-6" />
  },
  {
    id: 'basic-plus',
    name: '基础版 Plus',
    price: 16.9,
    originalPrice: 26.9,
    period: '月',
    description: '',
    features: [
      '每月可获得50000WH币',
      '约可生成高质量图片166个标准视频'
    ],
    color: 'from-teal-500 to-cyan-600',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'professional',
    name: '专业版',
    price: 14.9,
    originalPrice: 24.9,
    period: '月',
    description: '',
    features: [
      '每月可获得75000WH币',
      '约可生成高质量图片333个标准视频'
    ],
    color: 'from-blue-600 to-indigo-700',
    icon: <Rocket className="w-6 h-6" />
  }
];

// 年费套餐数据
const yearlyPlans: MembershipPlan[] = [
  {
    id: 'light-yearly',
    name: '轻享版',
    price: 49.9,
    originalPrice: 58.8,
    period: '年',
    description: '',
    features: [
      '每月可获得8000WH币',
      '约可生成高质量图片133个标准视频',
      '年费享85折优惠'
    ],
    color: 'from-gray-600 to-gray-800',
    icon: <Bot className="w-6 h-6" />
  },
  {
    id: 'light-plus-yearly',
    name: '轻享版 Plus',
    price: 89.9,
    originalPrice: 154.8,
    period: '年',
    description: '',
    features: [
      '每月可获得8000WH币',
      '约可生成高质量图片133个标准视频',
      '年费享6折优惠'
    ],
    color: 'from-gray-600 to-gray-800',
    icon: <Cpu className="w-6 h-6" />
  },
  {
    id: 'basic-yearly',
    name: '基础版',
    price: 99.9,
    originalPrice: 178.8,
    period: '年',
    description: '',
    features: [
      '每月可获得50000WH币',
      '约可生成高质量图片166个标准视频',
      '年费享6折优惠'
    ],
    popular: true,
    color: 'from-orange-500 to-red-600',
    icon: <Database className="w-6 h-6" />
  },
  {
    id: 'basic-plus-yearly',
    name: '基础版 Plus',
    price: 169.9,
    originalPrice: 322.8,
    period: '年',
    description: '',
    features: [
      '每月可获得50000WH币',
      '约可生成高质量图片166个标准视频',
      '年费享5折优惠'
    ],
    color: 'from-teal-500 to-cyan-600',
    icon: <Zap className="w-6 h-6" />
  },
  {
    id: 'professional-yearly',
    name: '专业版',
    price: 149.9,
    originalPrice: 298.8,
    period: '年',
    description: '',
    features: [
      '每月可获得75000WH币',
      '约可生成高质量图片333个标准视频',
      '年费享5折优惠'
    ],
    color: 'from-blue-600 to-indigo-700',
    icon: <Rocket className="w-6 h-6" />
  }
];



// WH币充值套餐
const whCoinPackages = [
  { coins: 500, price: 4.99, bonus: 0 },
  { coins: 1000, price: 9.99, bonus: 100 },
  { coins: 2000, price: 19.99, bonus: 300 },
  { coins: 5000, price: 49.99, bonus: 1000 }
];

// 会员权益对比数据
const membershipComparison = {
  features: [
    { name: 'AI生成次数', key: 'aiGeneration' },
    { name: 'AI模型访问', key: 'aiModels' },
    { name: '处理优先级', key: 'priority' },
    { name: 'API接口', key: 'api' },
    { name: '批量处理', key: 'batchProcessing' },
    { name: '赠送WH币', key: 'bonusCoins' },
    { name: '客服支持', key: 'support' }
  ],
  plans: {
    free: {
      name: '免费版',
      aiGeneration: '10次/天',
      aiModels: '基础模型',
      priority: '普通',
      api: '❌',
      batchProcessing: '❌',
      bonusCoins: '0',
      support: '社区支持'
    },
    light: {
      name: '轻享版',
      aiGeneration: '100次/天',
      aiModels: '标准模型',
      priority: '普通',
      api: '✅',
      batchProcessing: '❌',
      bonusCoins: '8000/月',
      support: '邮件支持'
    },
    basic: {
      name: '基础版',
      aiGeneration: '500次/天',
      aiModels: '高级模型',
      priority: '优先',
      api: '✅',
      batchProcessing: '✅',
      bonusCoins: '50000/月',
      support: '在线客服'
    },
    professional: {
      name: '专业版',
      aiGeneration: '无限制',
      aiModels: '全部模型',
      priority: '最高优先',
      api: '✅',
      batchProcessing: '✅',
      bonusCoins: '75000/月',
      support: '专属客服'
    }
  }
};

// 会员权益展示数据


const MembershipPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [activeTab, setActiveTab] = useState<'membership' | 'coins' | 'wallet'>('membership');
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<MembershipPlan | null>(null);
  const [showCoinPaymentModal, setShowCoinPaymentModal] = useState(false);
  const [selectedCoinPackage, setSelectedCoinPackage] = useState<{coins: number, price: number, bonus: number} | null>(null);
  const { membershipInfo } = useMembershipStatus();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();
  
  // 交易记录相关state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [whBalance, setWhBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // 检查URL参数，如果有wallet参数则切换到钱包标签页
  useEffect(() => {
    if (searchParams.get('tab') === 'wallet') {
      setActiveTab('wallet');
      if (searchParams.get('success') === 'true') {
        showAlert('会员开通成功！欢迎查看您的钱包信息', 'success');
        // 清除URL参数
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams, showAlert]);

  // 获取WH币余额
  const fetchWhBalance = async () => {
    if (!user) return;
    
    setBalanceLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('未找到认证token');
        setBalanceLoading(false);
        return;
      }

      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWhBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('获取WH币余额失败:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // 获取交易记录
  const fetchTransactions = async () => {
    if (!user) return;
    
    setTransactionsLoading(true);
    setTransactionsError(null);
    
    try {
      const response = await api.user.getUserTransactions({ page: 1, pageSize: 10 });
      setTransactions(response.items || []);
    } catch (error) {
      console.error('获取交易记录失败:', error);
      setTransactionsError('获取交易记录失败');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // 计算交易后余额（模拟计算）
  const calculateBalanceAfterTransaction = (transaction: any, index: number) => {
    // 这里应该根据实际的交易顺序和当前余额来计算
    // 由于我们没有历史余额数据，这里做一个简单的模拟
    let balance = whBalance;
    
    // 从最新的交易开始倒推
    for (let i = 0; i <= index; i++) {
      const tx = transactions[i];
      if (tx.type === 'recharge' || tx.type === 'commission') {
        balance -= tx.amount; // 倒推时减去收入
      } else if (tx.type === 'ai_usage' || tx.type === 'purchase') {
        balance += Math.abs(tx.amount); // 倒推时加上支出
      }
    }
    
    // 使用transaction参数来确保计算的准确性
    if (transaction.type === 'recharge' || transaction.type === 'commission') {
      balance += transaction.amount;
    } else if (transaction.type === 'ai_usage' || transaction.type === 'purchase') {
      balance -= Math.abs(transaction.amount);
    }
    
    return Math.max(0, balance);
  };

  // 当切换到钱包标签页时获取交易记录和余额
  useEffect(() => {
    if (activeTab === 'wallet' && user) {
      fetchTransactions();
      fetchWhBalance();
    }
  }, [activeTab, user]);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 获取交易类型显示信息
  const getTransactionTypeInfo = (type: string, description: string) => {
    switch (type) {
      case 'recharge':
        return {
          name: '充值',
          icon: <CreditCard className="w-5 h-5 text-green-400" />,
          bgColor: 'bg-green-500/20',
          amountColor: 'text-green-400'
        };
      case 'ai_usage':
        return {
          name: 'AI使用',
          icon: <Bot className="w-5 h-5 text-blue-400" />,
          bgColor: 'bg-blue-500/20',
          amountColor: 'text-red-400'
        };
      case 'purchase':
        return {
          name: '购买',
          icon: <Wallet className="w-5 h-5 text-purple-400" />,
          bgColor: 'bg-purple-500/20',
          amountColor: 'text-red-400'
        };
      case 'commission':
        return {
          name: '佣金',
          icon: <Star className="w-5 h-5 text-yellow-400" />,
          bgColor: 'bg-yellow-500/20',
          amountColor: 'text-green-400'
        };
      default:
        return {
          name: description || '其他',
          icon: <History className="w-5 h-5 text-gray-400" />,
          bgColor: 'bg-gray-500/20',
          amountColor: 'text-gray-400'
        };
    }
  };

  // 格式化交易金额显示
  const formatTransactionAmount = (type: string, amount: number) => {
    const isPositive = ['recharge', 'commission'].includes(type);
    const prefix = isPositive ? '+' : '-';
    
    if (type === 'ai_usage') {
      return `${prefix}${Math.abs(amount)} WH币`;
    }
    
    return amount > 0 ? `¥${amount.toFixed(2)}` : `${prefix}${Math.abs(amount)} WH币`;
  };

  // 获取支付方式显示
  const getPaymentMethodDisplay = (paymentMethod: string | null, transactionType: string) => {
    // 对于AI使用和购买类型，默认使用WH币
    if (transactionType === 'ai_usage' || transactionType === 'purchase') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
          💰 WH币
        </span>
      );
    }
    
    // 根据支付方式显示不同的标识
    switch (paymentMethod) {
      case 'wechat':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
            💬 微信支付
          </span>
        );
      case 'paypal':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
            🅿️ PayPal
          </span>
        );
      case 'alipay':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
            💳 支付宝
          </span>
        );
      case 'wh_coins':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
            💰 WH币
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
            💳 其他
          </span>
        );
    }
  };

  // 获取会员类型配置
  const getMembershipConfig = (type: string) => {
    const configs = {
      free: { name: '免费版', color: 'from-gray-500 to-gray-700', icon: '🆓' },
      basic: { name: '基础版', color: 'from-orange-500 to-red-600', icon: '💎' },
      premium: { name: '高级版', color: 'from-blue-500 to-purple-600', icon: '👑' },
      enterprise: { name: '企业版', color: 'from-purple-500 to-pink-600', icon: '🏢' }
    };
    return configs[type as keyof typeof configs] || configs.free;
  };

  // 根据planType获取当前套餐数据
  const currentPlans = planType === 'monthly' ? monthlyPlans : yearlyPlans;



  // 计算到期时间
  const calculateExpiryDate = (plan: MembershipPlan) => {
    const now = new Date();
    if (plan.period === '月') {
      now.setMonth(now.getMonth() + 1);
    } else if (plan.period === '年') {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  };

  const handlePurchase = (planId: string) => {
    if (!user) {
      window.location.href = '/login?redirect=/membership';
      return;
    }
    
    // 找到选中的套餐
    const plan = currentPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlanForPayment(plan);
      setShowPaymentModal(true);
    }
  };

  const handleCoinPurchase = (pkg: {coins: number, price: number, bonus: number}) => {
    if (!user) {
      window.location.href = '/login?redirect=/membership';
      return;
    }
    
    setSelectedCoinPackage(pkg);
    setShowCoinPaymentModal(true);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 flex flex-col">
        {/* 顶部导航 - 左对齐 */}
        <div className="w-full bg-gray-900/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 dark:border-gray-600 p-4">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setActiveTab('membership')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'membership'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white dark:text-gray-100'
                  : 'text-gray-300 dark:text-gray-200 hover:text-white dark:hover:text-gray-100 hover:bg-gray-700/50 dark:hover:bg-gray-600/50'
              }`}
            >
              <span className="text-xl">💎</span>
              <span>会员</span>
            </button>
            <button
              onClick={() => setActiveTab('coins')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'coins'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white dark:text-gray-100'
                  : 'text-gray-300 dark:text-gray-200 hover:text-white dark:hover:text-gray-100 hover:bg-gray-700/50 dark:hover:bg-gray-600/50'
              }`}
            >
              <span className="text-xl">🪙</span>
              <span>WH币</span>
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'wallet'
                  ? 'bg-blue-600/20 border border-blue-500/30 text-white dark:text-gray-100'
                  : 'text-gray-300 dark:text-gray-200 hover:text-white dark:hover:text-gray-100 hover:bg-gray-700/50 dark:hover:bg-gray-600/50'
              }`}
            >
              <span className="text-xl">💰</span>
              <span>钱包</span>
            </button>
            <button className="flex items-center space-x-3 px-4 py-2 rounded-lg font-medium text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 hover:bg-gray-700/50 dark:hover:bg-gray-600/50 transition-all">
              <span className="text-xl">⭐</span>
              <span>独占</span>
            </button>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1">
        {/* 装饰背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-500/10 to-blue-600/10 rounded-full blur-3xl" />
        </div>

        {/* 会员套餐选择 */}
        {activeTab === 'membership' && (
          <div className="relative z-10 p-8">
            {/* 页面标题 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-2">选择您的会员套餐</h1>
              <p className="text-xl text-gray-300 dark:text-gray-200">解锁更多AI创作可能</p>
            </div>

            {/* 月费/年费切换 */}
            <div className="flex justify-center mb-12">
              <div className="flex bg-gray-800/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700 dark:border-gray-600">
                <button 
                  onClick={() => setPlanType('monthly')}
                  className={`px-8 py-3 rounded-lg text-base font-medium transition-all ${
                    planType === 'monthly'
                      ? 'bg-teal-500 text-white shadow-lg'
                      : 'text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100'
                  }`}
                >
                  <span className="text-lg mr-2">📅</span>
                  连续包月
                </button>
                <button 
                  onClick={() => setPlanType('yearly')}
                  className={`px-8 py-3 rounded-lg text-base font-medium transition-all ${
                    planType === 'yearly'
                      ? 'bg-teal-500 text-white shadow-lg'
                      : 'text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100'
                  }`}
                >
                  <span className="text-lg mr-2">🎯</span>
                  连续包年
                  <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">省更多</span>
                </button>
              </div>
            </div>
            
            {/* 套餐卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-7xl mx-auto mb-16">
              {currentPlans.map((plan) => (
                <Card
                  key={plan.id}
                  variant="filled"
                  className={`relative !bg-gray-800/80 dark:!bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600 p-6 cursor-pointer transition-all duration-300 hover:!bg-gray-700/80 dark:hover:!bg-gray-600/80 hover:transform hover:scale-105 ${
                    selectedPlan === plan.id
                      ? 'ring-2 ring-teal-500 shadow-2xl transform scale-105'
                      : 'hover:shadow-xl'
                  } ${plan.popular ? 'border-2 border-orange-500 shadow-orange-500/20' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="absolute -top-2 -right-2">
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      限时优惠
                    </span>
                  </div>
                  
                  <div className="text-center">
                    {/* 套餐名称 */}
                    <h3 className={`text-xl font-bold mb-3 ${
                      plan.popular 
                        ? 'text-orange-300' 
                        : plan.id.includes('professional') 
                        ? 'text-blue-300'
                        : plan.id.includes('basic')
                        ? 'text-teal-300'
                        : 'text-gray-200 dark:text-gray-100'
                    }`}>{plan.name}</h3>
                    
                    {/* 价格显示 */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center mb-2">
                        <span className={`text-4xl font-bold ${
                          plan.popular 
                            ? 'text-orange-400' 
                            : plan.id.includes('professional') 
                            ? 'text-blue-400'
                            : plan.id.includes('basic')
                            ? 'text-teal-400'
                            : 'text-gray-300 dark:text-gray-200'
                        }`}>${plan.price}</span>
                        <span className="text-lg text-gray-400 dark:text-gray-300 ml-1">/{plan.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="flex items-center justify-center space-x-2">
                          <span className="text-gray-500 dark:text-gray-400 line-through text-base">
                            原价${plan.originalPrice}
                          </span>
                          <span className="text-green-400 text-sm font-medium">
                            省{Math.round((1 - plan.price / plan.originalPrice) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* 套餐描述 */}
                    <p className="text-gray-300 dark:text-gray-200 text-base mb-6 font-medium">{plan.description}</p>
                    
                    {/* 套餐特性 */}
                    <div className="space-y-2 mb-8 text-left">
                      {plan.features.map((feature, index) => {
                        // 判断是否为主要特性（包含WH币的行）
                        const isMainFeature = feature.includes('WH币');
                        
                        if (isMainFeature) {
                           // 处理WH币文字，让数字显示颜色
                           const numberMatch = feature.match(/(\d+)/);
                           const number = numberMatch ? numberMatch[1] : '';
                           const beforeNumber = feature.substring(0, feature.indexOf(number));
                           const afterNumber = feature.substring(feature.indexOf(number) + number.length);
                           
                           return (
                             <div key={index} className="text-left">
                               <span className="text-sm text-white">
                                 {beforeNumber}
                               </span>
                               <span className={`text-lg font-bold ${
                                 plan.popular 
                                   ? 'text-orange-300' 
                                   : plan.id.includes('professional') 
                                   ? 'text-blue-300'
                                   : plan.id.includes('basic')
                                   ? 'text-teal-300'
                                   : 'text-yellow-300'
                               }`}>
                                 {number}
                               </span>
                               <span className="text-sm text-white">
                                 {afterNumber}
                               </span>
                             </div>
                           );
                        } else {
                           return (
                             <div key={index} className="text-left">
                               <span className="text-xs text-gray-400">
                                 {feature}
                               </span>
                             </div>
                           );
                         }
                      })}
                    </div>
                    
                    {/* 购买按钮 */}
                    <Button
                      className={`w-full py-4 font-bold transition-all text-base rounded-xl shadow-lg ${
                        selectedPlan === plan.id
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-teal-500/30'
                          : plan.popular
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-500/30'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-500 hover:to-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(plan.id);
                      }}
                    >
                      {selectedPlan === plan.id ? '✨ 已选择' : '立即购买'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* 会员权益对比表格 */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white dark:text-gray-100 mb-2">会员权益对比</h2>
                <p className="text-lg text-gray-400 dark:text-gray-300">详细了解各套餐包含的功能和服务</p>
              </div>
              
              <div className="bg-gray-800/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl border border-gray-700 dark:border-gray-600 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-700/50 dark:bg-gray-600/50">
                        <th className="text-left p-6 text-lg font-bold text-white dark:text-gray-100 border-r border-gray-600 dark:border-gray-500">功能特性</th>
                        <th className="text-center p-6 text-base font-semibold text-gray-300 dark:text-gray-200 border-r border-gray-600 dark:border-gray-500">免费版</th>
                        <th className="text-center p-6 text-base font-semibold text-white dark:text-gray-100 border-r border-gray-600 dark:border-gray-500">轻享版</th>
                        <th className="text-center p-6 text-base font-semibold text-white dark:text-gray-100 border-r border-gray-600 dark:border-gray-500 bg-orange-500/20 dark:bg-orange-500/30">基础版</th>
                        <th className="text-center p-6 text-base font-semibold text-white dark:text-gray-100">专业版</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membershipComparison.features.map((feature, index) => (
                        <tr key={feature.key} className={index % 2 === 0 ? 'bg-gray-800/30 dark:bg-gray-700/30' : 'bg-gray-800/10 dark:bg-gray-700/10'}>
                          <td className="p-6 text-base font-medium text-white dark:text-gray-100 border-r border-gray-600 dark:border-gray-500">
                            {feature.name}
                          </td>
                          <td className="text-center p-6 text-sm text-gray-400 dark:text-gray-300 border-r border-gray-600 dark:border-gray-500">
                            {membershipComparison.plans.free[feature.key as keyof typeof membershipComparison.plans.free]}
                          </td>
                          <td className="text-center p-6 text-sm text-gray-200 dark:text-gray-100 border-r border-gray-600 dark:border-gray-500">
                            {membershipComparison.plans.light[feature.key as keyof typeof membershipComparison.plans.light]}
                          </td>
                          <td className="text-center p-6 text-sm text-white dark:text-gray-100 border-r border-gray-600 dark:border-gray-500 bg-orange-500/10 dark:bg-orange-500/20">
                            {membershipComparison.plans.basic[feature.key as keyof typeof membershipComparison.plans.basic]}
                          </td>
                          <td className="text-center p-6 text-sm text-white dark:text-gray-100">
                            {membershipComparison.plans.professional[feature.key as keyof typeof membershipComparison.plans.professional]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WH币充值选项 */}
        {activeTab === 'coins' && (
          <div className="relative z-10 p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-2">WH币充值</h1>
              <p className="text-xl text-gray-300 dark:text-gray-200">WH币可用于AI生成、模型调用等服务消费</p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500/20 dark:bg-blue-500/30 rounded-full border border-blue-500/30 dark:border-blue-500/40">
                <span className="text-blue-300 dark:text-blue-200 text-sm">💡 充值越多，赠送越多</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {whCoinPackages.map((pkg, index) => (
                <Card 
                  key={index} 
                  className="bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600 p-8 text-center hover:bg-gray-700/80 dark:hover:bg-gray-600/80 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:border-blue-500/50 dark:hover:border-blue-400/50"
                >
                  {/* 币数量显示 */}
                  <div className="mb-6">
                    <div className="flex justify-center mb-3">
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                        <span className="text-2xl">🪙</span>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-blue-400 dark:text-blue-300 mb-2">{pkg.coins.toLocaleString()}</div>
                    <div className="text-base text-gray-400 dark:text-gray-300 font-medium">WH币</div>
                    {pkg.bonus > 0 && (
                      <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                        <Gift className="w-4 h-4 text-green-400 mr-1" />
                        <span className="text-sm text-green-400 font-bold">+{pkg.bonus} 赠送</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 价格显示 */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-white dark:text-gray-100">${pkg.price}</div>
                    {pkg.bonus > 0 && (
                      <div className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                        实得 {(pkg.coins + pkg.bonus).toLocaleString()} WH币
                      </div>
                    )}
                  </div>
                  
                  {/* 充值按钮 */}
                  <Button 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-blue-500/30 transition-all"
                    onClick={() => handleCoinPurchase(pkg)}
                  >
                    立即充值
                  </Button>
                </Card>
              ))}
            </div>

            {/* 充值说明 */}
            <div className="max-w-4xl mx-auto mt-16">
              <div className="bg-gray-800/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl border border-gray-700 dark:border-gray-600 p-8">
                <h3 className="text-2xl font-bold text-white dark:text-gray-100 mb-6 text-center">WH币使用说明</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-blue-400 dark:text-blue-300 flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      消费场景
                    </h4>
                    <ul className="space-y-2 text-gray-300 dark:text-gray-200">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        AI图像生成 (10-50 WH币/张)
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        AI视频生成 (100-500 WH币/个)
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        高级模型调用 (5-20 WH币/次)
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        批量处理任务 (按量计费)
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-orange-400 dark:text-orange-300 flex items-center">
                      <Gift className="w-5 h-5 mr-2" />
                      充值优惠
                    </h4>
                    <ul className="space-y-2 text-gray-300 dark:text-gray-200">
                      <li className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-2" />
                        单次充值1000+，赠送10%
                      </li>
                      <li className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-2" />
                        单次充值2000+，赠送15%
                      </li>
                      <li className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-2" />
                        单次充值5000+，赠送20%
                      </li>
                      <li className="flex items-center">
                        <Crown className="w-4 h-4 text-purple-400 mr-2" />
                        会员用户享受额外5%折扣
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 钱包标签页内容 */}
        {activeTab === 'wallet' && (
          <div className="relative z-10 p-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white dark:text-gray-100 mb-2">我的钱包</h1>
              <p className="text-xl text-gray-300 dark:text-gray-200">查看您的会员状态、余额和交易记录</p>
            </div>

            <div className="space-y-8 max-w-6xl mx-auto">
              {/* 钱包概览 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 会员状态卡片 */}
                <Card className="p-6 bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getMembershipConfig(membershipInfo?.membership_type || 'free').color} flex items-center justify-center text-white text-xl`}>
                         {getMembershipConfig(membershipInfo?.membership_type || 'free').icon}
                       </div>
                       <div>
                         <h3 className="text-lg font-semibold text-white dark:text-gray-100">会员状态</h3>
                         <p className="text-sm text-gray-400 dark:text-gray-300">{getMembershipConfig(membershipInfo?.membership_type || 'free').name}</p>
                       </div>
                    </div>
                    <Crown className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 dark:text-gray-300">开通时间:</span>
                      <span className="font-medium text-gray-200 dark:text-gray-100">{formatDate(membershipInfo?.membership_start_date || null)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 dark:text-gray-300">到期时间:</span>
                        <span className="font-medium text-gray-200 dark:text-gray-100">{formatDate(membershipInfo?.membership_end_date || null)}</span>
                    </div>
                  </div>
                </Card>

                {/* WH币余额卡片 */}
                <Card className="p-6 bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white text-xl">
                        💰
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white dark:text-gray-100">WH币余额</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-300">可用余额</p>
                      </div>
                    </div>
                    <Wallet className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-white dark:text-gray-100 mb-2">
                    {membershipInfo?.wh_coins || 0} <span className="text-sm font-normal text-gray-400 dark:text-gray-300">WH币</span>
                  </div>
                  <Button 
                    onClick={() => setActiveTab('coins')}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white"
                  >
                    充值WH币
                  </Button>
                </Card>

                {/* 使用统计卡片 */}
                <Card className="p-6 bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white text-xl">
                        📊
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white dark:text-gray-100">使用统计</h3>
                        <p className="text-sm text-gray-400 dark:text-gray-300">本月使用情况</p>
                      </div>
                    </div>
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 dark:text-gray-300">AI对话次数:</span>
                      <span className="font-medium text-gray-200 dark:text-gray-100">156次</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 dark:text-gray-300">消耗WH币:</span>
                      <span className="font-medium text-gray-200 dark:text-gray-100">89币</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 交易记录 */}
              <Card className="p-6 bg-gray-800/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-700 dark:border-gray-600">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <History className="w-6 h-6 text-gray-400" />
                    <h3 className="text-xl font-semibold text-white dark:text-gray-100">交易记录</h3>
                  </div>
                  <Button variant="outline" className="text-sm border-gray-600 text-gray-300 hover:bg-gray-700">
                    查看全部
                  </Button>
                </div>
                
                {/* 当前WH币余额显示 */}
                {!balanceLoading && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Wallet className="w-6 h-6 text-blue-400" />
                        <span className="text-lg font-medium text-white">当前WH币余额</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">{whBalance.toLocaleString()} WH币</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* 加载状态 */}
                  {transactionsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-gray-400 dark:text-gray-300">加载交易记录中...</p>
                    </div>
                  )}
                  
                  {/* 错误状态 */}
                  {transactionsError && (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-400 mb-4">{transactionsError}</p>
                      <Button 
                        onClick={fetchTransactions}
                        variant="outline"
                        className="border-red-400 text-red-400 hover:bg-red-400/10"
                      >
                        重试
                      </Button>
                    </div>
                  )}
                  
                  {/* 交易记录表格 */}
                  {!transactionsLoading && !transactionsError && transactions.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-600 dark:border-gray-500">
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">交易时间</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">交易类型</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">金额</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">支付方式</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">交易后余额</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">详情</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-300 dark:text-gray-200">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => {
                            const typeInfo = getTransactionTypeInfo(transaction.type, transaction.description);
                            const balanceAfter = calculateBalanceAfterTransaction(transaction, index);
                            return (
                              <tr key={transaction.id} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-700/30 dark:hover:bg-gray-600/30">
                                <td className="py-3 px-4 text-gray-300 dark:text-gray-200">
                                  {new Date(transaction.created_at).toLocaleString('zh-CN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-8 h-8 rounded-full ${typeInfo.bgColor} flex items-center justify-center`}>
                                      {typeInfo.icon}
                                    </div>
                                    <span className="text-white dark:text-gray-100">{typeInfo.name}</span>
                                  </div>
                                </td>
                                <td className={`py-3 px-4 font-medium ${typeInfo.amountColor}`}>
                                  {formatTransactionAmount(transaction.type, transaction.amount)}
                                </td>
                                <td className="py-3 px-4">
                                  {getPaymentMethodDisplay(transaction.payment_method, transaction.type)}
                                </td>
                                <td className="py-3 px-4 text-blue-400 font-medium">
                                  {balanceAfter.toLocaleString()} WH币
                                </td>
                                <td className="py-3 px-4 text-gray-400 dark:text-gray-300">
                                  {transaction.description || transaction.workflow_title || '无描述'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                                    已完成
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* 空状态提示 */}
                {!transactionsLoading && !transactionsError && transactions.length === 0 && (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 dark:text-gray-300 mb-4">暂无交易记录</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">您的交易记录会显示在这里</p>
                    <Button 
                      onClick={() => setActiveTab('coins')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      立即充值
                    </Button>
                  </div>
                )}
              </Card>

              {/* 会员权益提醒 */}
              <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center space-x-4 mb-4">
                  <Gift className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-semibold">会员专享权益</h3>
                    <p className="text-blue-100">升级会员，享受更多特权</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-300" />
                    <span>无限AI对话次数</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-300" />
                    <span>优先客服支持</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-300" />
                    <span>高级功能访问</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-green-300" />
                    <span>专属会员标识</span>
                  </div>
                </div>
                {membershipInfo?.membership_type === 'free' && (
                  <Button 
                    onClick={() => setActiveTab('membership')}
                    className="bg-white text-blue-600 hover:bg-gray-100 font-medium"
                  >
                    立即升级会员
                  </Button>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
      
      {/* 会员支付弹窗 */}
      {showPaymentModal && selectedPlanForPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 dark:bg-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 dark:border-gray-600 shadow-2xl">
            {/* 关闭按钮 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white dark:text-gray-100">订阅 {selectedPlanForPayment.name}/{selectedPlanForPayment.period}</h2>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 开通后到期时间 */}
             <div className="bg-gray-700/50 dark:bg-gray-600/50 rounded-lg p-4 mb-6">
               <p className="text-gray-300 dark:text-gray-200 text-sm mb-2">开通后到期时间</p>
               <p className="text-white dark:text-gray-100 font-semibold">{calculateExpiryDate(selectedPlanForPayment)}</p>
             </div>
             
             {/* 权益说明 */}
             <div className="bg-gray-700/30 dark:bg-gray-600/30 rounded-lg p-4 mb-6">
               <p className="text-gray-300 dark:text-gray-200 text-sm mb-2">付款后权益即刻开通，WH币有效期{selectedPlanForPayment.period === '月' ? '一个月' : '一年'}</p>
             </div>
            
            {/* 价格显示 */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-orange-400 dark:text-orange-300 mb-2">
                ${selectedPlanForPayment.price}
              </div>
            </div>
            
            {/* 服务协议 */}
             <div className="text-center mb-6">
               <p className="text-gray-400 dark:text-gray-300 text-sm">
                 支付即表示，您同意WorkflowHub的
                 <span className="text-blue-400 dark:text-blue-300 underline cursor-pointer">服务协议</span> 和 
                 <span className="text-blue-400 dark:text-blue-300 underline cursor-pointer">隐私政策</span>，
                 虚拟产品不支持退款
               </p>
             </div>
            
            {/* 支付按钮 */}
             <Button
               className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg"
               onClick={() => {
                 // 跳转到支付页面
                 const paymentUrl = `/payment?planId=${selectedPlanForPayment.id}&planName=${encodeURIComponent(selectedPlanForPayment.name)}&planPrice=${selectedPlanForPayment.price}&planPeriod=${encodeURIComponent(selectedPlanForPayment.period)}`;
                 window.location.href = paymentUrl;
                 setShowPaymentModal(false);
               }}
             >
               支付
             </Button>
          </div>
        </div>
      )}

      {/* WH币充值支付弹窗 */}
      {showCoinPaymentModal && selectedCoinPackage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 dark:bg-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 dark:border-gray-600 shadow-2xl">
            {/* 关闭按钮 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white dark:text-gray-100">充值 {selectedCoinPackage.coins.toLocaleString()} WH币</h2>
              <button 
                onClick={() => setShowCoinPaymentModal(false)}
                className="text-gray-400 dark:text-gray-300 hover:text-white dark:hover:text-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 充值详情 */}
            <div className="bg-gray-700/50 dark:bg-gray-600/50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 dark:text-gray-200 text-sm">基础WH币</span>
                <span className="text-white dark:text-gray-100 font-semibold">{selectedCoinPackage.coins.toLocaleString()}</span>
              </div>
              {selectedCoinPackage.bonus > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300 dark:text-gray-200 text-sm">赠送WH币</span>
                  <span className="text-green-400 font-semibold">+{selectedCoinPackage.bonus.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-gray-600 dark:border-gray-500 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white dark:text-gray-100 font-semibold">总计WH币</span>
                  <span className="text-blue-400 dark:text-blue-300 font-bold text-lg">{(selectedCoinPackage.coins + selectedCoinPackage.bonus).toLocaleString()}</span>
                </div>
              </div>
            </div>
             
             {/* 充值说明 */}
             <div className="bg-gray-700/30 dark:bg-gray-600/30 rounded-lg p-4 mb-6">
               <p className="text-gray-300 dark:text-gray-200 text-sm mb-2">付款后WH币即刻到账，永久有效</p>
             </div>
            
            {/* 价格显示 */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-blue-400 dark:text-blue-300 mb-2">
                ${selectedCoinPackage.price}
              </div>
            </div>
            
            {/* 服务协议 */}
             <div className="text-center mb-6">
               <p className="text-gray-400 dark:text-gray-300 text-sm">
                 支付即表示，您同意WorkflowHub的
                 <span className="text-blue-400 dark:text-blue-300 underline cursor-pointer">服务协议</span> 和 
                 <span className="text-blue-400 dark:text-blue-300 underline cursor-pointer">隐私政策</span>，
                 虚拟产品不支持退款
               </p>
             </div>
            
            {/* 支付按钮 */}
             <Button
               className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
               onClick={() => {
                 // 跳转到支付页面
                 const paymentUrl = `/payment?type=coins&coins=${selectedCoinPackage.coins}&bonus=${selectedCoinPackage.bonus}&price=${selectedCoinPackage.price}`;
                 window.location.href = paymentUrl;
                 setShowCoinPaymentModal(false);
               }}
             >
               立即支付
             </Button>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
};

export default MembershipPage;