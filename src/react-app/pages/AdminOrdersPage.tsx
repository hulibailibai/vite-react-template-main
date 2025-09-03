import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAlert } from '../contexts/AlertContext';

// 订单接口
interface Order {
  id: number;
  user_id: number;
  out_trade_no: string;
  transaction_id?: string;
  order_type: string;
  membership_type: string;
  membership_period: string;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  paid_at?: string;
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    email: string;
    avatar_url?: string;
    current_membership_type?: string;
    current_membership_start_date?: string;
    current_membership_end_date?: string;
  };
}

// 分页信息接口
interface Pagination {
  current: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 订单详情模态框属性
interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

// 支付状态配置
const paymentStatusConfig = {
  pending: {
    label: '待支付',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="w-4 h-4" />
  },
  paid: {
    label: '已支付',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />
  },
  failed: {
    label: '支付失败',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-4 h-4" />
  },
  cancelled: {
    label: '已取消',
    color: 'bg-gray-100 text-gray-800',
    icon: <XCircle className="w-4 h-4" />
  },
  refunded: {
    label: '已退款',
    color: 'bg-purple-100 text-purple-800',
    icon: <RefreshCw className="w-4 h-4" />
  }
};

// 会员类型配置
const membershipTypeConfig = {
  basic: { label: '基础会员', color: 'bg-blue-100 text-blue-800' },
  premium: { label: '高级会员', color: 'bg-purple-100 text-purple-800' },
  enterprise: { label: '企业版', color: 'bg-yellow-100 text-yellow-800' }
};

// 订单详情模态框组件
const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const { showError, showSuccess } = useAlert();

  useEffect(() => {
    if (order) {
      setNewStatus(order.payment_status);
    }
  }, [order]);

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!order || newStatus === order.payment_status) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
       if (!token) {
         throw new Error('未找到认证token');
       }

       const response = await fetch(`/api/admin/orders/${order.id}/status`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({ status: newStatus })
       });
       
       if (!response.ok) {
         throw new Error('更新订单状态失败');
       }
       
       const result = await response.json();
       
       if (result.success) {
        onUpdate();
        onClose();
        showSuccess('订单状态更新成功');
      } else {
        showError('更新订单状态失败');
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      showError('更新订单状态失败');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const statusConfig = paymentStatusConfig[order.payment_status];
  const membershipConfig = membershipTypeConfig[order.membership_type as keyof typeof membershipTypeConfig];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="订单详情">
      <div className="space-y-6">
        {/* 订单基本信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">订单信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">订单ID:</span>
              <span className="ml-2 font-mono">{order.id}</span>
            </div>
            <div>
              <span className="text-gray-600">订单号:</span>
              <span className="ml-2 font-mono">{order.out_trade_no}</span>
            </div>
            <div>
              <span className="text-gray-600">交易号:</span>
              <span className="ml-2 font-mono">{order.transaction_id || '未设置'}</span>
            </div>
            <div>
              <span className="text-gray-600">订单类型:</span>
              <span className="ml-2">{order.order_type}</span>
            </div>
            <div>
              <span className="text-gray-600">金额:</span>
              <span className="ml-2 font-medium">¥{order.amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">货币:</span>
              <span className="ml-2">{order.currency}</span>
            </div>
            <div>
              <span className="text-gray-600">创建时间:</span>
              <span className="ml-2">{new Date(order.created_at).toLocaleString('zh-CN')}</span>
            </div>
            <div>
              <span className="text-gray-600">支付时间:</span>
              <span className="ml-2">{order.paid_at ? new Date(order.paid_at).toLocaleString('zh-CN') : '未支付'}</span>
            </div>
          </div>
        </div>

        {/* 会员信息 */}
        {order.order_type === 'membership' && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">会员信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">会员类型:</span>
                <Badge className={membershipConfig?.color || 'bg-gray-100 text-gray-800'}>
                  {membershipConfig?.label || order.membership_type}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">会员周期:</span>
                <span className="ml-2">{order.membership_period === 'month' ? '月度' : order.membership_period === 'year' ? '年度' : order.membership_period}</span>
              </div>
            </div>
          </div>
        )}

        {/* 用户信息 */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">用户信息</h3>
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {order.user.avatar_url ? (
                <img src={order.user.avatar_url} alt={order.user.username} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-medium">{order.user.username}</div>
              <div className="text-sm text-gray-600">{order.user.email}</div>
            </div>
          </div>
          
          {order.user.current_membership_type && (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-600">当前会员:</span>
                <span className="ml-2">{order.user.current_membership_type}</span>
              </div>
              <div>
                <span className="text-gray-600">会员期限:</span>
                <span className="ml-2">
                  {order.user.current_membership_start_date && order.user.current_membership_end_date
                    ? `${new Date(order.user.current_membership_start_date).toLocaleDateString('zh-CN')} - ${new Date(order.user.current_membership_end_date).toLocaleDateString('zh-CN')}`
                    : '未设置'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 状态更新 */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">状态管理</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">当前状态:</span>
              <Badge className={statusConfig.color}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                更新状态
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="failed">支付失败</option>
                <option value="cancelled">已取消</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button 
            onClick={handleUpdateStatus}
            loading={loading}
            disabled={newStatus === order.payment_status}
          >
            更新状态
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 管理员订单页面组件
export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const { showError } = useAlert();
  
  // 筛选状态
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    orderType: 'all'
  });
  
  // 模态框状态
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 加载订单列表
  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.orderType !== 'all' && { orderType: filters.orderType }),
        ...(filters.search && { search: filters.search })
      });
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`/api/admin/orders?${params}`, {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       if (!response.ok) {
         throw new Error('获取订单列表失败');
       }
       
       const result = await response.json();
       
       if (result.success) {
         setOrders(result.data.orders);
         setPagination(result.data.pagination);
      } else {
          console.error('获取订单列表失败:', result.message);
          showError('获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      showError('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadOrders();
  }, []);

  // 筛选变化时重新加载
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders(1);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters]);

  // 查看订单详情
  const handleViewOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('未找到认证token');
      }

      const response = await fetch(`/api/admin/orders/${orderId}`, {
         headers: {
           'Authorization': `Bearer ${token}`
         }
       });
       
       if (!response.ok) {
         throw new Error('获取订单详情失败');
       }
       
       const result = await response.json();
       
       if (result.success) {
         setSelectedOrder(result.data);
        setIsDetailModalOpen(true);
      } else {
        showError('获取订单详情失败');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      showError('获取订单详情失败');
    }
  };

  // 格式化金额
  const formatAmount = (amount: number, currency: string) => {
    return `${currency === 'CNY' ? '¥' : '$'}${amount.toFixed(2)}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <Button onClick={() => loadOrders(pagination.current)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索订单号、用户名或邮箱..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="pending">待支付</option>
              <option value="paid">已支付</option>
              <option value="failed">支付失败</option>
              <option value="cancelled">已取消</option>
              <option value="refunded">已退款</option>
            </select>
            <select
              value={filters.orderType}
              onChange={(e) => setFilters({ ...filters, orderType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="membership">会员订单</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 订单列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会员类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const statusConfig = paymentStatusConfig[order.payment_status];
                const membershipConfig = membershipTypeConfig[order.membership_type as keyof typeof membershipTypeConfig];
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                        <div className="text-sm text-gray-500 font-mono">{order.out_trade_no}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          {order.user.avatar_url ? (
                            <img src={order.user.avatar_url} alt={order.user.username} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.user.username}</div>
                          <div className="text-sm text-gray-500">{order.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.order_type === 'membership' ? (
                        <div>
                          <Badge className={membershipConfig?.color || 'bg-gray-100 text-gray-800'}>
                            {membershipConfig?.label || order.membership_type}
                          </Badge>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.membership_period === 'month' ? '月度' : order.membership_period === 'year' ? '年度' : order.membership_period}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{order.order_type}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAmount(order.amount, order.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusConfig.color}>
                        {statusConfig.icon}
                        <span className="ml-1">{statusConfig.label}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                显示 {((pagination.current - 1) * pagination.pageSize) + 1} 到 {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条记录
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadOrders(Math.max(1, pagination.current - 1))}
                  disabled={pagination.current === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadOrders(Math.min(pagination.totalPages, pagination.current + 1))}
                  disabled={pagination.current === pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 订单详情模态框 */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onUpdate={() => {
          loadOrders(pagination.current);
        }}
      />
    </div>
  );
};

export default AdminOrdersPage;