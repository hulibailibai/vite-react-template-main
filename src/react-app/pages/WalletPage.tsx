import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMembershipStatus } from '../hooks/useMembershipStatus';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useSearchParams } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';
import { 
  Crown, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Coins,
  Gift,
  History,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { membershipInfo, loading, error } = useMembershipStatus();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();

  // 检查支付成功参数
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      showAlert('会员开通成功！欢迎来到您的专属钱包页面', 'success');
      // 清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, showAlert]);

  // 会员类型配置
  const membershipConfig = {
    free: {
      name: '免费用户',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      bgGradient: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
      icon: <Crown className="w-6 h-6" />,
      description: '基础功能',
      features: ['基础功能使用', '有限次数调用', '社区支持']
    },
    basic: {
      name: '基础会员',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      bgGradient: 'from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20',
      icon: <Crown className="w-6 h-6" />,
      description: '更多功能权限',
      features: ['无限次数调用', '优先客服支持', '高级功能使用']
    },
    premium: {
      name: '高级会员',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      bgGradient: 'from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20',
      icon: <Crown className="w-6 h-6" />,
      description: '全部功能权限',
      features: ['所有高级功能', '专属客服支持', 'API访问权限', '数据导出功能']
    },
    enterprise: {
      name: '企业版',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      bgGradient: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20',
      icon: <Crown className="w-6 h-6" />,
      description: '企业级服务',
      features: ['企业级功能', '专属技术支持', '定制化服务', '团队管理']
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('auth.loginRequired')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('auth.loginToViewWallet')}</p>
          <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
            {t('auth.loginNow')}
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">{t('wallet.loadFailed')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            {t('wallet.reload')}
          </Button>
        </Card>
      </div>
    );
  }

  const membershipType = membershipInfo?.membership_type || 'free';
  const config = membershipConfig[membershipType as keyof typeof membershipConfig];
  const remainingDays = membershipInfo?.membership_end_date ? calculateRemainingDays(membershipInfo.membership_end_date) : null;
  const isExpired = remainingDays !== null && remainingDays < 0;
  const isExpiringSoon = remainingDays !== null && remainingDays <= 7 && remainingDays > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('wallet.title')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('wallet.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 会员状态卡片 */}
          <div className="lg:col-span-2">
            <Card className={`p-6 bg-gradient-to-br ${config.bgGradient} border-0 shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {config.icon}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('wallet.membershipStatus')}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{config.description}</p>
                  </div>
                </div>
                <Badge className={config.color}>
                  {config.name}
                </Badge>
              </div>

              {/* 会员详情 */}
              {membershipInfo && membershipType !== 'free' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t('wallet.startTime')}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {membershipInfo.membership_start_date ? formatDate(membershipInfo.membership_start_date) : t('wallet.notSet')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t('wallet.endTime')}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {membershipInfo.membership_end_date ? formatDate(membershipInfo.membership_end_date) : t('wallet.notSet')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {remainingDays !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          {t('wallet.remainingDays')}
                        </span>
                        <div className="flex items-center space-x-1">
                          {isExpired ? (
                            <>
                              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                              <span className="text-red-600 dark:text-red-400 font-medium">{t('wallet.expired')}</span>
                            </>
                          ) : isExpiringSoon ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                              <span className="text-yellow-600 dark:text-yellow-400 font-medium">{remainingDays} {t('wallet.days')}</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                              <span className="text-green-600 dark:text-green-400 font-medium">{remainingDays} {t('wallet.days')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        {t('wallet.autoRenew')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {membershipInfo.membership_auto_renew ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400">{t('wallet.enabled')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-400">{t('wallet.disabled')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 会员特权 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('wallet.membershipBenefits')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3">
                {membershipType === 'free' ? (
                  <Button 
                    onClick={() => navigate('/membership')}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t('wallet.activateMembership')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => navigate('/membership')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {t('wallet.upgradeMembership')}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/membership')}
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {t('wallet.manageRenewal')}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* WH币余额 */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('wallet.whCoinsBalance')}</h3>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-2">🪙</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {membershipInfo?.wh_coins?.toLocaleString() || 0}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{t('wallet.whCoinsDescription')}</p>
                
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => navigate('/recharge')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('wallet.rechargeCoins')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 dark:border-gray-600"
                    onClick={() => navigate('/transaction-history')}
                  >
                    <History className="w-4 h-4 mr-2" />
                    {t('wallet.transactionHistory')}
                  </Button>
                </div>
              </div>
            </Card>

            {/* 快速操作 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('wallet.quickActions')}</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 dark:border-gray-600"
                  onClick={() => navigate('/invite')}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {t('wallet.inviteFriends')}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-gray-300 dark:border-gray-600"
                  onClick={() => navigate('/profile')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('wallet.accountSettings')}
                </Button>
              </div>
            </Card>

            {/* 状态提示 */}
            {isExpired && (
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <h4 className="font-medium text-red-800 dark:text-red-300">{t('wallet.membershipExpired')}</h4>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {t('wallet.membershipExpiredDesc')}
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => navigate('/membership')}
                >
                  {t('wallet.renewNow')}
                </Button>
              </Card>
            )}

            {isExpiringSoon && (
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">{t('wallet.expiringSoon')}</h4>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  {t('wallet.expiringSoonDesc').replace('{days}', remainingDays?.toString() || '0')}
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => navigate('/membership')}
                >
                  {t('wallet.renewNow')}
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;