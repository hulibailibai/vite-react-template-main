import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// 会员信息接口
interface MembershipInfo {
  membership_type: string;
  membership_start_date: string | null;
  membership_end_date: string | null;
  membership_auto_renew: boolean;
  is_active: boolean;
  wh_coins: number;
}

// 自定义hook用于获取会员状态
export const useMembershipStatus = () => {
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
  }, [isAuthenticated, token, user]);

  // 检查用户是否为有效会员
  const isValidMember = () => {
    if (!membershipInfo) return false;
    
    // 如果是免费用户，返回false
    if (membershipInfo.membership_type === 'free') return false;
    
    // 检查会员是否有效
    if (membershipInfo.membership_end_date) {
      const endDate = new Date(membershipInfo.membership_end_date);
      const now = new Date();
      return endDate > now;
    }
    
    return false;
  };

  return {
    membershipInfo,
    loading,
    error,
    isValidMember: isValidMember(),
    isMember: membershipInfo?.membership_type !== 'free'
  };
};