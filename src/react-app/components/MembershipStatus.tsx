import React, { useState, useEffect } from 'react';
import { Crown, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useAuth } from '../contexts/AuthContext';

// 会员信息接口
interface MembershipInfo {
  membership_type: string;
  membership_start_date: string | null;
  membership_end_date: string | null;
  membership_auto_renew: boolean;
  is_valid: boolean;
  wh_coins: number;
}

// 会员状态组件属性
interface MembershipStatusProps {
  userId?: number;
  className?: string;
}

// 会员类型配置
const membershipConfig = {
  free: {
    name: '免费用户',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    icon: <Crown className="w-4 h-4" />,
    description: '基础功能'
  },
  basic: {
    name: '基础会员',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <Crown className="w-4 h-4" />,
    description: '更多功能权限'
  },
  premium: {
    name: '高级会员',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <Crown className="w-4 h-4" />,
    description: '全部功能权限'
  },
  enterprise: {
    name: '企业版',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: <Crown className="w-4 h-4" />,
    description: '企业级服务'
  }
};

export const MembershipStatus: React.FC<MembershipStatusProps> = ({ userId, className = '' }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取会员信息
  useEffect(() => {
    const fetchMembershipInfo = async () => {
      // 如果用户未认证，直接返回
      if (!isAuthenticated || !token || !user) {
        setLoading(false);
        setError('用户未登录');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/membership', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('用户认证已过期，请重新登录');
          } else {
            throw new Error('获取会员信息失败');
          }
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          setMembershipInfo(result.data);
        } else {
          setError('获取会员信息失败');
        }
      } catch (err) {
        console.error('获取会员信息失败:', err);
        setError('获取会员信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMembershipInfo();
  }, [userId, isAuthenticated, token, user]);

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未设置';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 计算剩余天数
  const getRemainingDays = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    // 如果是用户未登录，显示友好提示
    if (error === '用户未登录') {
      return (
        <Card className={`p-4 ${className}`}>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">请登录查看会员信息</span>
          </div>
        </Card>
      );
    }
    
    // 其他错误显示红色提示
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center text-red-600 dark:text-red-400">
          <XCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  if (!membershipInfo) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="text-sm">无法获取会员信息</span>
        </div>
      </Card>
    );
  }

  const membershipType = membershipInfo.membership_type || 'free';
  const config = membershipConfig[membershipType as keyof typeof membershipConfig] || membershipConfig.free;
  const remainingDays = getRemainingDays(membershipInfo.membership_end_date);
  const isExpired = remainingDays !== null && remainingDays < 0;
  const isExpiringSoon = remainingDays !== null && remainingDays <= 7 && remainingDays > 0;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-3">
        {/* 会员类型标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {config.icon}
            <h3 className="font-medium text-gray-900 dark:text-gray-100">会员状态</h3>
          </div>
          <Badge className={config.color}>
            {config.name}
          </Badge>
        </div>

        {/* 会员描述 */}
        <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>

        {/* 会员详情 */}
        {membershipType !== 'free' && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">开始时间:</span>
              <span className="text-gray-900 dark:text-gray-100">{formatDate(membershipInfo.membership_start_date)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">到期时间:</span>
              <span className="text-gray-900 dark:text-gray-100">{formatDate(membershipInfo.membership_end_date)}</span>
            </div>

            {remainingDays !== null && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">剩余天数:</span>
                <div className="flex items-center space-x-1">
                  {isExpired ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      <span className="text-red-600 dark:text-red-400 font-medium">已过期</span>
                    </>
                  ) : isExpiringSoon ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">{remainingDays} 天</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400 font-medium">{remainingDays} 天</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">自动续费:</span>
              <div className="flex items-center space-x-1">
                {membershipInfo.membership_auto_renew ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">已开启</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">未开启</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">状态:</span>
              <div className="flex items-center space-x-1">
                {membershipInfo.is_valid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400 font-medium">有效</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400 font-medium">无效</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">WH币余额:</span>
              <div className="flex items-center space-x-1">
                <span className="text-2xl">🪙</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{membershipInfo.wh_coins?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* 升级提示 */}
        {membershipType === 'free' && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              升级会员享受更多功能权限
            </p>
          </div>
        )}

        {/* 过期提示 */}
        {isExpired && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">
              您的会员已过期，请及时续费以继续享受会员权益
            </p>
          </div>
        )}

        {/* 即将过期提示 */}
        {isExpiringSoon && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              您的会员即将在 {remainingDays} 天后过期，建议及时续费
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MembershipStatus;