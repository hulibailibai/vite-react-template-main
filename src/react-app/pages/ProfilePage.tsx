import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  User, 
  Settings, 
  Heart, 
  Download, 
  CreditCard, 
  History,
  Camera,
  Save,
  Edit3,
  Bot,
  Wallet,
  Star,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Workflow, Transaction } from '../types';
import api from '../services/api';
import { WorkflowCard } from '../components/WorkflowCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { MembershipStatus } from '../components/MembershipStatus';

// 侧边栏菜单项
interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

// 个人中心页面组件
export const ProfilePage: React.FC = () => {
  const { user, updateUser, isAuthenticated, token } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [favoriteWorkflows, setFavoriteWorkflows] = useState<Workflow[]>([]);
  const [purchaseRecords, setPurchaseRecords] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wechatBinding, setWechatBinding] = useState({
    isBinding: false,
    bindingUrl: '',
    isUnbinding: false
  });

  // 获取交易类型显示信息
  const getTransactionTypeInfo = (type: string, description: string, paymentMethod?: string) => {
    switch (type) {
      case 'recharge':
        // 会员充值需要区分支付方式
        if (paymentMethod === 'wechat') {
          return {
            name: '会员充值 (微信支付)',
            icon: <CreditCard className="w-4 h-4 text-green-400" />,
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-800 dark:text-green-400'
          };
        } else if (paymentMethod === 'paypal') {
          return {
            name: '会员充值 (PayPal)',
            icon: <CreditCard className="w-4 h-4 text-blue-400" />,
            bgColor: 'bg-blue-100 dark:bg-blue-900/30',
            textColor: 'text-blue-800 dark:text-blue-400'
          };
        } else {
          return {
            name: '会员充值',
            icon: <CreditCard className="w-4 h-4 text-green-400" />,
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-800 dark:text-green-400'
          };
        }
      case 'ai_usage':
        return {
          name: '运行付费AI应用',
          icon: <Bot className="w-4 h-4 text-blue-400" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-400'
        };
      case 'purchase':
        return {
          name: '购买工作流',
          icon: <Wallet className="w-4 h-4 text-purple-400" />,
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-800 dark:text-purple-400'
        };
      case 'commission':
        return {
          name: '佣金收入',
          icon: <Star className="w-4 h-4 text-yellow-400" />,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-400'
        };
      default:
        return {
          name: description || '其他交易',
          icon: <History className="w-4 h-4 text-gray-400" />,
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-800 dark:text-gray-400'
        };
    }
  };

  // 微信绑定相关函数
  const handleWechatBinding = async () => {
    try {
      setWechatBinding(prev => ({ ...prev, isBinding: true }));
      
      // 获取微信OAuth授权URL
      const response = await api.auth.getOAuthUrl('wechat', `${window.location.origin}/oauth/callback`);
      
      if (response?.authUrl) {
        // 跳转到微信授权页面
        window.location.href = response.authUrl;
      } else {
        throw new Error('获取微信授权链接失败');
      }
    } catch (error) {
      console.error('微信绑定失败:', error);
      alert('微信绑定失败，请稍后重试');
    } finally {
      setWechatBinding(prev => ({ ...prev, isBinding: false }));
    }
  };

  const handleWechatUnbinding = async () => {
    if (!confirm('确定要解绑微信账号吗？解绑后将无法使用微信进行提现。')) {
      return;
    }
    
    try {
      setWechatBinding(prev => ({ ...prev, isUnbinding: true }));
      
      await api.auth.unbindOAuth('wechat');
      
      // 更新用户信息
      if (updateUser) {
        updateUser({ ...user!, wechat_openid: undefined });
      }
      alert('微信账号解绑成功');
    } catch (error) {
      console.error('微信解绑失败:', error);
      alert('微信解绑失败，请稍后重试');
    } finally {
      setWechatBinding(prev => ({ ...prev, isUnbinding: false }));
    }
  };

  // 格式化交易金额显示
  const formatTransactionAmount = (type: string, amount: number, paymentMethod?: string) => {
    const isPositive = ['recharge', 'commission'].includes(type);
    const prefix = isPositive ? '+' : '-';
    
    // 购买工作流和运行AI应用使用WH币
    if (['purchase', 'ai_usage'].includes(type)) {
      return `${prefix}${Math.abs(amount)} WH币`;
    }
    
    // 会员充值显示具体支付方式和金额
    if (type === 'recharge') {
      if (paymentMethod === 'wechat') {
        // 微信支付显示美元和人民币（假设汇率1:7）
        const usdAmount = Math.abs(amount);
        const cnyAmount = (usdAmount * 7).toFixed(2);
        return `+$${usdAmount.toFixed(2)} (¥${cnyAmount})`;
      } else if (paymentMethod === 'paypal') {
        return `+$${Math.abs(amount).toFixed(2)}`;
      }
    }
    
    // 其他情况默认显示美元
    return `${prefix}$${Math.abs(amount).toFixed(2)}`;
  };

  // 获取会员类型显示
  const getMembershipTypeDisplay = (description: string) => {
    if (description.includes('轻享版')) return '轻享版';
    if (description.includes('基础版')) return '基础版';
    if (description.includes('专业版')) return '专业版';
    if (description.includes('企业版')) return '企业版';
    return '';
  };

  // 获取支付方式显示
  const getPaymentMethodDisplay = (paymentMethod?: string, transactionType?: string) => {
    if (!paymentMethod) {
      // 根据交易类型推断支付方式
      if (transactionType === 'ai_usage' || transactionType === 'purchase') {
        return (
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span>WH币</span>
          </div>
        );
      }
      return (
        <span className="text-gray-400 dark:text-gray-500">未知</span>
      );
    }

    switch (paymentMethod.toLowerCase()) {
      case 'wechat':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">微</span>
            </div>
            <span>微信支付</span>
          </div>
        );
      case 'paypal':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span>PayPal</span>
          </div>
        );
      case 'wh_coins':
        return (
          <div className="flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            <span>WH币</span>
          </div>
        );
      case 'alipay':
        return (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">支</span>
            </div>
            <span>支付宝</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <span>{paymentMethod}</span>
          </div>
        );
    }
  };
  
  // 个人信息表单状态
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: '',
    website: '',
    avatar_url: user?.avatar_url || '',
    avatarFile: null as File | null,
    avatarFilename: '' as string,
  });
  const [isEditing, setIsEditing] = useState(false);

  // 侧边栏菜单
  const sidebarMenuItems: SidebarMenuItem[] = [
    { id: 'profile', label: '个人信息', icon: <User className="w-5 h-5" /> },
    { id: 'favorites', label: '我的收藏', icon: <Heart className="w-5 h-5" />, count: favoriteWorkflows.length },
    { id: 'purchases', label: '购买记录', icon: <Download className="w-5 h-5" />, count: purchaseRecords.length },
    { id: 'transactions', label: '交易记录', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'wechat', label: '微信绑定', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'settings', label: '账户设置', icon: <Settings className="w-5 h-5" /> },
  ];

  // 当用户信息变化时更新表单
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: '',
        website: '',
        avatar_url: user.avatar_url || '',
        avatarFile: null,
        avatarFilename: '',
      });
    }
  }, [user]);

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !isAuthenticated || !token) {
        setTransactions([]);
        setFavoriteWorkflows([]);
        setPurchaseRecords([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // 获取用户数据
        setFavoriteWorkflows([]);
        
        try {
          // 获取交易记录
          const txPage = await api.user.getUserTransactions({ page: 1, pageSize: 20 });
          setTransactions(txPage.items as any);
        } catch (e) {
          console.error('获取交易记录失败:', e);
          setTransactions([]);
        }
        
        try {
          // 获取购买记录
          const purchasePage = await api.user.getUserPurchases({ page: 1, pageSize: 20 });
          setPurchaseRecords(purchasePage.items);
        } catch (e) {
          console.error('获取购买记录失败:', e);
          setPurchaseRecords([]);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, isAuthenticated, token]);

  // 处理个人信息更新
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      let updateData = { ...profileForm };
      
      // 移除不需要发送到服务器的字段
      const { avatarFile, avatarFilename, ...updateDataToSend } = updateData;
      
      // 如果有头像文件名，说明用户上传了新头像，需要单独传递
      const profileUpdateData = avatarFilename 
        ? { ...updateDataToSend, avatar_filename: avatarFilename }
        : updateDataToSend;
      
      const updatedUser = await api.auth.updateProfile(profileUpdateData as any);
      updateUser(updatedUser);
      
      // 更新表单状态
      setProfileForm({
        ...profileForm,
        avatar_url: updatedUser.avatar_url || '',
        avatarFile: null,
        avatarFilename: '',
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理工作流下载
  const handleDownload = async (workflowId: number, workflowTitle: string) => {
    try {
      setLoading(true);
      const response = await api.cozeWorkflow.downloadCozeWorkflow(workflowId);
      
      if (response.success && response.download_url) {
        // 创建一个临时的下载链接
        const link = document.createElement('a');
        link.href = response.download_url;
        link.download = response.filename || `${workflowTitle}.json`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('下载成功:', response.message);
      } else {
        console.error('下载失败:', response.message);
        alert('下载失败: ' + response.message);
      }
    } catch (error: any) {
      console.error('下载出错:', error);
      const errorMessage = error.response?.data?.message || error.message || '下载失败，请稍后重试';
      alert('下载出错: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      // 上传头像预览
      const result = await api.upload.uploadAvatarPreview(file);
      
      // 更新表单状态，显示预览
      setProfileForm({ 
        ...profileForm, 
        avatar_url: result.url,
        avatarFile: file,
        avatarFilename: result.filename
      });
    } catch (error) {
      console.error('Failed to upload avatar preview:', error);
      // 如果上传失败，仍然显示本地预览
      const previewUrl = URL.createObjectURL(file);
      setProfileForm({ 
        ...profileForm, 
        avatar_url: previewUrl,
        avatarFile: file,
        avatarFilename: ''
      });
    }
  };

  // 渲染个人信息页面
  const renderProfileTab = () => (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">个人信息</h2>
        <Button
          variant={isEditing ? 'outline' : 'primary'}
          onClick={() => {
            if (isEditing) {
              // 取消编辑时恢复原始数据
              if (profileForm.avatar_url && profileForm.avatar_url.startsWith('blob:')) {
                URL.revokeObjectURL(profileForm.avatar_url);
              }
              setProfileForm({
                username: user?.username || '',
                email: user?.email || '',
                bio: user?.bio || '',
                location: '',
                website: '',
                avatar_url: user?.avatar_url || '',
                avatarFile: null,
                avatarFilename: '',
              });
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? (
            <>
              取消
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              编辑
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleProfileUpdate}>
        <div className="space-y-6">
          {/* 头像 */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={profileForm.avatar_url || user?.avatar_url || '/default-avatar.png'}
                alt={user?.username}
                className="w-24 h-24 rounded-full object-cover"
              />
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{user?.username}</h3>
              <p className="text-gray-500 dark:text-gray-400">{user?.role === 'creator' ? '创作者' : '用户'}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                注册时间：{user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : ''}
              </p>
            </div>
          </div>

          {/* 会员状态 */}
          <div>
            <MembershipStatus userId={user?.id} />
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                用户名
              </label>
              <Input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 dark:bg-gray-600' : ''}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱
              </label>
              <Input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 dark:bg-gray-600' : ''}
              />
            </div>
          </div>

          {/* 个人简介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              个人简介
            </label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className={clsx(
                'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                !isEditing && 'bg-gray-50 dark:bg-gray-600'
              )}
              placeholder="介绍一下自己..."
            />
          </div>

          {/* 其他信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                所在地区
              </label>
              <Input
                type="text"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 dark:bg-gray-600' : ''}
                placeholder="如：北京市"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                个人网站
              </label>
              <Input
                type="url"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                disabled={!isEditing}
                className={!isEditing ? 'bg-gray-50 dark:bg-gray-600' : ''}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* 保存按钮 */}
          {isEditing && (
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                保存更改
              </Button>
            </div>
          )}
        </div>
      </form>
    </Card>
  );

  // 渲染收藏页面
  const renderFavoritesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">我的收藏</h2>
        <span className="text-gray-500 dark:text-gray-400">{favoriteWorkflows.length} 个工作流</span>
      </div>

      {favoriteWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onView={(id) => window.location.href = `/coze-workflow/${id}`}
              onDownload={(id) => console.log('Download:', id)}
              onFavorite={(id) => console.log('Unfavorite:', id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无收藏</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">收藏感兴趣的工作流，方便随时查看</p>
          <Button onClick={() => window.location.href = '/'}>
            去发现工作流
          </Button>
        </Card>
      )}
    </div>
  );

  // 渲染购买记录页面
  const renderPurchasesTab = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">购买记录</h2>
        <span className="text-gray-500 dark:text-gray-400">{purchaseRecords.length} 个工作流</span>
      </div>

      {purchaseRecords.length > 0 ? (
        <div className="space-y-4">
          {purchaseRecords.map((record) => (
            <Card key={record.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* 工作流封面 */}
                <div className="flex-shrink-0">
                  {record.workflow_preview_images && record.workflow_preview_images.length > 0 ? (
                    <img
                      src={record.workflow_preview_images[0]}
                      alt={record.workflow_title}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* 工作流信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {record.workflow_title}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full flex-shrink-0">
                      已购买
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {record.workflow_description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span>分类: {record.category_name}</span>
                    <span>价格: {record.workflow_price}WH币</span>
                    <span>购买时间: {new Date(record.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => window.location.href = `/coze-workflow/${record.workflow_id}`}
                  >
                    查看详情
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(record.workflow_id, record.workflow_title)}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下载
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Download className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无购买记录</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">购买的工作流会显示在这里</p>
          <Button onClick={() => window.location.href = '/'}>
            去购买工作流
          </Button>
        </Card>
      )}
    </div>
  );

  // 渲染交易记录页面
  const renderTransactionsTab = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">交易记录</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          当前WH币余额: <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.wh_coins || 0} WH币</span>
        </div>
      </div>

      {transactions.length > 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    交易时间
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    交易类型
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    金额
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    支付方式
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    详情
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    余额
                  </th>
                 
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction, index) => {
                  const typeInfo = getTransactionTypeInfo(
                    (transaction as any).type || 'purchase',
                    (transaction as any).description || '',
                    (transaction as any).payment_method
                  );
                  const membershipType = getMembershipTypeDisplay((transaction as any).description || '');
                  
                  // 计算交易后余额（模拟计算，实际应该从后端获取）
                  const calculateBalanceAfterTransaction = (currentIndex: number) => {
                    const currentBalance = user?.wh_coins || 0;
                    let balance = currentBalance;
                    
                    // 从当前交易往前计算余额变化
                    for (let i = 0; i <= currentIndex; i++) {
                      const tx = transactions[i] as any;
                      const txType = tx.type || 'purchase';
                      const txAmount = tx.amount || 0;
                      
                      if (['recharge', 'commission'].includes(txType)) {
                        balance -= txAmount; // 倒推，充值前余额更少
                      } else {
                        balance += txAmount; // 倒推，消费前余额更多
                      }
                    }
                    
                    return Math.max(0, balance);
                  };
                  
                  const balanceAfter = calculateBalanceAfterTransaction(index);
                  
                  return (
                    <tr key={transaction.id}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {new Date(transaction.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${typeInfo.bgColor}`}>
                            <span className="w-3 h-3">{typeInfo.icon}</span>
                          </span>
                          <div>
                            <div className={`text-sm font-medium ${typeInfo.textColor}`}>
                              {typeInfo.name}
                            </div>
                            {membershipType && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {membershipType}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={clsx(
                          ['recharge', 'commission'].includes((transaction as any).type || 'purchase') 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        )}>
                          {formatTransactionAmount(
                            (transaction as any).type || 'purchase',
                            transaction.amount,
                            (transaction as any).payment_method
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getPaymentMethodDisplay((transaction as any).payment_method, (transaction as any).type)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="max-w-48 truncate" title={(transaction as any).workflow_title || (transaction as any).description || '无详情'}>
                          {(transaction as any).workflow_title || (transaction as any).description || '无详情'}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {balanceAfter} WH币
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={clsx(
                          'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                          transaction.status === 'completed' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
                          transaction.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
                          transaction.status === 'failed' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
                          transaction.status === 'refunded' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                        )}>
                          {transaction.status === 'completed' && '已完成'}
                          {transaction.status === 'pending' && '处理中'}
                          {transaction.status === 'failed' && '失败'}
                          {transaction.status === 'refunded' && '已退款'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">暂无交易记录</h3>
          <p className="text-gray-500 dark:text-gray-400">您的交易记录会显示在这里</p>
        </Card>
      )}
    </div>
  );

  // 渲染微信绑定页面
  const renderWechatTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">微信账号绑定</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">绑定状态</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.wechat_openid ? '已绑定微信账号' : '未绑定微信账号'}
              </p>
              {user?.wechat_openid && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  OpenID: {user.wechat_openid.substring(0, 8)}***
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'w-3 h-3 rounded-full',
                user?.wechat_openid ? 'bg-green-500' : 'bg-gray-300'
              )} />
              <span className={clsx(
                'text-sm font-medium',
                user?.wechat_openid ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                {user?.wechat_openid ? '已绑定' : '未绑定'}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            {user?.wechat_openid ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  绑定微信账号后，您可以：
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 ml-4">
                  <li>• 使用微信进行快速登录</li>
                  <li>• 通过微信接收提现转账</li>
                  <li>• 享受更便捷的支付体验</li>
                </ul>
                <Button 
                  variant="outline" 
                  onClick={handleWechatUnbinding}
                  disabled={wechatBinding.isUnbinding}
                  className="mt-4"
                >
                  {wechatBinding.isUnbinding ? '解绑中...' : '解绑微信'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  绑定微信账号后，您可以：
                </p>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 ml-4">
                  <li>• 使用微信进行快速登录</li>
                  <li>• 通过微信接收提现转账</li>
                  <li>• 享受更便捷的支付体验</li>
                </ul>
                <Button 
                  onClick={handleWechatBinding}
                  disabled={wechatBinding.isBinding}
                  className="mt-4"
                >
                  {wechatBinding.isBinding ? '跳转中...' : '绑定微信账号'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">注意事项</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>• 每个微信账号只能绑定一个平台账户</p>
          <p>• 绑定后的微信账号将用于身份验证和资金转账</p>
          <p>• 如需更换绑定的微信账号，请先解绑当前账号</p>
          <p>• 解绑微信账号不会影响您的平台账户和余额</p>
        </div>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">账户安全</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">修改密码</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">定期更新密码以保护账户安全</p>
            </div>
            <Button variant="outline">修改密码</Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">两步验证</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">为账户添加额外的安全保护</p>
            </div>
            <Button variant="outline">启用</Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">通知设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">邮件通知</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">接收重要更新和通知</p>
            </div>
            <input type="checkbox" className="toggle bg-gray-200 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">推送通知</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">接收浏览器推送通知</p>
            </div>
            <input type="checkbox" className="toggle bg-gray-200 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">隐私设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">公开个人资料</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">允许其他用户查看您的个人资料</p>
            </div>
            <input type="checkbox" className="toggle bg-gray-200 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">显示购买记录</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">在个人资料中显示购买的工作流</p>
            </div>
            <input type="checkbox" className="toggle bg-gray-200 dark:bg-gray-600 checked:bg-blue-600 dark:checked:bg-blue-500" />
          </div>
        </div>
      </Card>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('auth.loginRequired')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('auth.loginToAccessProfile')}</p>
          <Button onClick={() => window.location.href = '/login'}>
            {t('auth.goLogin')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 侧边栏 */}
          <div className="lg:w-48 flex-shrink-0">
            <Card className="p-3">
              <nav className="space-y-1">
                {sidebarMenuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={clsx(
                      'w-full flex items-center justify-between px-2 py-2 rounded-md text-sm font-medium transition-colors',
                      activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* 主内容区 */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'favorites' && renderFavoritesTab()}
            {activeTab === 'purchases' && renderPurchasesTab()}
            {activeTab === 'transactions' && renderTransactionsTab()}
            {activeTab === 'wechat' && renderWechatTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;