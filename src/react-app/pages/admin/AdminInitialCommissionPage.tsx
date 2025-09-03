
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
  CheckCircle, 
  Target,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';

// 初始佣金用户接口
interface InitialCommissionUser {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  plan_name: string;
  fixed_amount: number;
  payout_cycle: number; // 发放周期（天数）
  next_payout_date: string;
  total_received: number;
  payout_count: number;
  is_active: boolean;
  loading?: boolean; // 加载状态
  // 新增发放进度相关字段
  total_payouts?: number; // 总发放次数
  completed_payouts?: number; // 已完成发放次数
  total_paid_amount?: number; // 已发放总金额
  pending_amount?: number; // 待发放金额
}

// 佣金计划接口
interface CommissionPlan {
  id: number;
  name: string;
  fixed_amount: number;
  payout_cycle: number; // 发放周期（天数）
  description: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  // 新增字段
  target_users?: string[]; // 目标用户ID列表，空数组表示所有用户
  trigger_type: 'manual' | 'workflow_threshold'; // 触发类型：手动或工作流阈值
  workflow_threshold?: number; // Coze工作流数量阈值
  auto_trigger: boolean; // 是否自动触发
}

// 用户选择接口
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

// 佣金计划模态框属性
interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: CommissionPlan;
  onSave: (plan: Omit<CommissionPlan, 'id' | 'created_at' | 'user_count'>) => void;
  availableUsers: User[]; // 添加可用用户列表
}

// 佣金计划配置模态框
const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, plan, onSave, availableUsers }) => {
  const [formData, setFormData] = useState({
    name: '',
    fixed_amount: 100,
    payout_cycle: 7,
    description: '',
    is_active: true,
    target_users: [] as string[],
    trigger_type: 'manual' as 'manual' | 'workflow_threshold',
    workflow_threshold: 5,
    auto_trigger: false
  });
  
  // 使用从父组件传递的真实用户数据
  
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        fixed_amount: plan.fixed_amount,
        payout_cycle: plan.payout_cycle,
        description: plan.description,
        is_active: plan.is_active,
        target_users: plan.target_users || [],
        trigger_type: plan.trigger_type || 'manual',
        workflow_threshold: plan.workflow_threshold || 5,
        auto_trigger: plan.auto_trigger || false
      });
    } else {
      setFormData({
        name: '',
        fixed_amount: 100,
        payout_cycle: 7,
        description: '',
        is_active: true,
        target_users: [],
        trigger_type: 'manual',
        workflow_threshold: 5,
        auto_trigger: false
      });
    }
    setUserSearchTerm('');
    setShowUserSelector(false);
  }, [plan, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      target_users: prev.target_users.includes(userId)
        ? prev.target_users.filter(id => id !== userId)
        : [...prev.target_users, userId]
    }));
  };

  const filteredUsers = availableUsers.filter(user =>
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const selectedUsers = availableUsers.filter(user => formData.target_users.includes(user.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plan ? '编辑佣金计划' : '创建佣金计划'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            计划名称
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="例如：新手创作者激励计划"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              固定金额 (¥)
            </label>
            <Input
              type="number"
              value={formData.fixed_amount}
              onChange={(e) => setFormData({...formData, fixed_amount: parseFloat(e.target.value) || 0})}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              发放周期 (天)
            </label>
            <Input
              type="number"
              value={formData.payout_cycle}
              onChange={(e) => setFormData({...formData, payout_cycle: parseInt(e.target.value) || 1})}
              min="1"
              max="365"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            计划描述
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            rows={3}
            placeholder="描述这个佣金计划的用途和目标..."
          />
        </div>

        {/* 触发类型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            触发类型
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="trigger_type"
                value="manual"
                checked={formData.trigger_type === 'manual'}
                onChange={(e) => setFormData({...formData, trigger_type: e.target.value as 'manual' | 'workflow_threshold'})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">手动发放</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="trigger_type"
                value="workflow_threshold"
                checked={formData.trigger_type === 'workflow_threshold'}
                onChange={(e) => setFormData({...formData, trigger_type: e.target.value as 'manual' | 'workflow_threshold'})}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">基于Coze工作流数量阈值自动触发</span>
            </label>
          </div>
        </div>

        {/* 工作流阈值配置 */}
        {formData.trigger_type === 'workflow_threshold' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              工作流数量阈值
            </label>
            <Input
              type="number"
              value={formData.workflow_threshold}
              onChange={(e) => setFormData({...formData, workflow_threshold: parseInt(e.target.value) || 1})}
              min="1"
              max="100"
              placeholder="当用户发布的Coze工作流达到此数量时触发佣金发放"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              当创作者发布的Coze工作流数量达到 {formData.workflow_threshold} 个时，自动触发佣金发放
            </p>
          </div>
        )}

        {/* 目标用户选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            目标用户 ({formData.target_users.length === 0 ? '所有用户' : `已选择 ${formData.target_users.length} 个用户`})
          </label>
          
          {/* 已选择的用户 */}
          {selectedUsers.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <span
                    key={user.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {user.username}
                    <button
                      type="button"
                      onClick={() => handleUserToggle(user.id)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUserSelector(!showUserSelector)}
            className="w-full"
          >
            {showUserSelector ? '收起用户选择器' : '选择特定用户'}
          </Button>
          
          {showUserSelector && (
            <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
              <Input
                type="text"
                placeholder="搜索用户名或邮箱..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="mb-3"
              />
              
              <div className="max-h-40 overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                  <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.target_users.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    未找到匹配的用户
                  </p>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, target_users: availableUsers.map(u => u.id)})}
                  >
                    全选
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({...formData, target_users: []})}
                  >
                    清空
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            不选择任何用户时，计划将应用于所有符合条件的创作者
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
            启用此计划
          </label>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">计划预览</h4>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>• 每 {formData.payout_cycle} 天发放 ¥{formData.fixed_amount}</div>
            <div>• 触发方式: {formData.trigger_type === 'manual' ? '手动发放' : `工作流达到${formData.workflow_threshold}个时自动触发`}</div>
            <div>• 目标用户: {formData.target_users.length === 0 ? '所有符合条件的创作者' : `${formData.target_users.length}个指定用户`}</div>
            <div>• 月度预估成本: ¥{((30 / formData.payout_cycle) * formData.fixed_amount).toFixed(2)} / 用户</div>
            <div>• 年度预估成本: ¥{((365 / formData.payout_cycle) * formData.fixed_amount).toFixed(2)} / 用户</div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">
            {plan ? '更新计划' : '创建计划'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// 主组件
const AdminInitialCommissionPage: React.FC = () => {
  const { showAlert } = useAlert();

  // 状态管理
  const [users, setUsers] = useState<InitialCommissionUser[]>([]);
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]); // 添加可用用户状态
  const [loading, setLoading] = useState(true);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState<string>('all'); // 暂时注释，未来可能使用
  const [currentPage, setCurrentPage] = useState(1);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<CommissionPlan | undefined>();
  // 批量发放相关状态（暂时保留，未来可能使用）
  // const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  // const [selectedPlan, setSelectedPlan] = useState<CommissionPlan | null>(null);

  const itemsPerPage = 10;

  // 获取真实用户数据
  const fetchUsersData = async () => {
    try {
      setLoading(true);
      
      // 获取用户佣金配置数据及发放进度（包含用户基本信息、佣金配置和发放进度）
      const response = await adminApi.getUserInitialCommissionWithPayouts({
        page: 1,
        pageSize: 1000, // 获取所有用户配置
        search: searchTerm,
        status: 'all' // statusFilter === 'all' ? undefined : statusFilter // 暂时使用固定值
      });
      
      // 调试：打印API响应数据
      console.log('API响应数据:', response);
      if (response.items && response.items.length > 0) {
        console.log('第一个用户数据:', response.items[0]);
      }
      
      // 将API返回的数据转换为InitialCommissionUser格式
      const commissionUsers: InitialCommissionUser[] = response.items.map(config => ({
        id: config.user_id || config.id,
        username: config.username || config.user?.username || '',
        email: config.email || config.user?.email || '',
        role: config.role || config.user?.role || 'creator',
        status: config.status || config.user?.status || 'active',
        created_at: config.created_at || config.user?.created_at || new Date().toISOString(),
        plan_name: config.plan_name || '默认计划',
        // 佣金相关字段 - 从关联的initial_commission_plans表获取真实数据
        fixed_amount: config.fixed_amount || 0,
        payout_cycle: config.payout_cycle || 7,
        next_payout_date: config.next_payout_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        total_received: config.total_received || 0,
        payout_count: config.payout_count || 0,
        // 修复：使用正确的字段名 commission_status，并正确转换布尔值
        is_active: Boolean(config.commission_status),
        // 新增发放进度相关字段 - 从新API获取的数据
        total_payouts: config.total_payouts || 0,
        completed_payouts: config.completed_payouts || 0,
        total_paid_amount: config.total_paid_amount || 0,
        pending_amount: config.pending_amount || 0
      }));
      
      setUsers(commissionUsers);
      
      // 同时获取所有用户数据（用于计划创建时的用户选择）
      try {
        const allUsersResponse = await adminApi.getAllUsers({
          page: 1,
          pageSize: 1000,
          role: 'creator'
        });
        
        const availableUsersData: User[] = allUsersResponse.items.map(user => ({
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        }));
        setAvailableUsers(availableUsersData);
      } catch (userError) {
        console.error('获取可用用户列表失败:', userError);
      }
      
    } catch (error) {
      console.error('获取用户佣金配置数据失败:', error);
      showAlert({ message: '获取用户佣金配置数据失败，请重试', type: 'error' });
      
      // 如果佣金配置API失败，尝试获取基本用户数据作为后备
      try {
        const fallbackResponse = await adminApi.getAllUsers({
          page: 1,
          pageSize: 1000,
          role: 'creator'
        });
        
        const fallbackUsers: InitialCommissionUser[] = fallbackResponse.items.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          created_at: user.created_at,
          plan_name: '未配置',
          fixed_amount: 0,
          payout_cycle: 7,
          next_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          total_received: 0,
          payout_count: 0,
          is_active: false
        }));
        
        setUsers(fallbackUsers);
        
        const availableUsersData: User[] = fallbackResponse.items.map(user => ({
          id: user.id.toString(),
          username: user.username,
          email: user.email,
          role: user.role
        }));
        setAvailableUsers(availableUsersData);
        
      } catch (fallbackError) {
        console.error('获取后备用户数据也失败:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 获取佣金计划数据
  const fetchPlansData = async () => {
    try {
      setLoading(true);
      
      // 从数据库获取佣金计划数据
      const response = await adminApi.getInitialCommissionPlans({
        page: 1,
        pageSize: 100 // 获取所有计划
      });
      
      // 将API返回的数据转换为CommissionPlan格式
      const commissionPlans: CommissionPlan[] = response.items.map(plan => ({
        id: plan.id,
        name: plan.name,
        fixed_amount: plan.fixed_amount,
        payout_cycle: plan.payout_cycle,
        description: plan.description || '',
        is_active: Boolean(plan.is_active), // 将数字1转换为布尔值true
        created_at: plan.created_at,
        user_count: plan.user_count || 0, // 使用API返回的用户数量统计
        target_users: [], // 这个需要从关联表获取
        trigger_type: plan.trigger_type || 'manual',
        workflow_threshold: plan.workflow_threshold,
        auto_trigger: Boolean(plan.auto_trigger) // 将数字0转换为布尔值false
      }));
      
      setPlans(commissionPlans);
      
    } catch (error) {
      console.error('获取佣金计划数据失败:', error);
      showAlert({ message: '获取佣金计划数据失败，请重试', type: 'error' });
      
      // 如果API调用失败，设置空数组
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refreshData = async () => {
    await fetchUsersData();
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchPlansData();
      await fetchUsersData();
    };
    loadData();
  }, []);

  // 筛选和分页
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'all' ||
      (selectedPlanFilter === 'active' && user.is_active) ||
      (selectedPlanFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesPlan;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 统计数据
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    // 使用新的total_paid_amount字段计算累计发放金额
    totalPaid: users.reduce((sum, u) => sum + (u.total_paid_amount || 0), 0),
    monthlyEstimate: users.filter(u => u.is_active).reduce((sum, u) => sum + (30 / u.payout_cycle) * u.fixed_amount, 0)
  };

  // 处理函数
  const handlePlanSave = async (planData: Omit<CommissionPlan, 'id' | 'created_at' | 'user_count'>) => {
    try {
      setLoading(true);
      
      const apiData = {
        name: planData.name,
        description: planData.description,
        trigger_type: planData.trigger_type,
        amount_type: 'fixed', // 固定金额类型
        amount_value: planData.fixed_amount,
        workflow_threshold: planData.workflow_threshold,
        auto_trigger: planData.auto_trigger,
        status: planData.is_active ? 'active' : 'inactive'
      };
      
      if (editingPlan) {
        // 编辑现有计划
        await adminApi.updateInitialCommissionPlan(editingPlan.id, apiData);
        showAlert({ message: '佣金计划更新成功', type: 'success' });
      } else {
        // 创建新计划
        await adminApi.createInitialCommissionPlan(apiData);
        showAlert({ message: '佣金计划创建成功', type: 'success' });
      }
      
      // 重新获取计划数据
      await fetchPlansData();
      
    } catch (error) {
      console.error('保存佣金计划失败:', error);
      showAlert({ message: '保存佣金计划失败，请重试', type: 'error' });
    } finally {
      setLoading(false);
    }
    setEditingPlan(undefined);
  };

  const handleToggleUserStatus = async (userId: number) => {
    console.log('=== 开始处理用户状态切换 ===');
    console.log('用户ID:', userId);
    
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        console.error('未找到用户:', userId);
        return;
      }
      
      const newStatus = !user.is_active;
      console.log('当前用户信息:', {
        id: user.id,
        username: user.username,
        email: user.email,
        current_status: user.is_active,
        new_status: newStatus
      });
      
      // 设置加载状态 - 更新特定用户的加载状态
      console.log('设置用户加载状态为 true');
      setUsers(users.map(u => u.id === userId ? { ...u, loading: true } : u));
      
      // 调用后端API更新用户佣金状态
      console.log('准备调用后端API:', {
        userId,
        newStatus,
        apiUrl: `PUT /api/admin/initial-commission/users/${userId}/status`
      });
      
      console.log('发送请求前的时间戳:', new Date().toISOString());
      const response = await adminApi.updateUserCommissionStatus(userId, newStatus);
      console.log('收到响应的时间戳:', new Date().toISOString());
      
      console.log('后端响应详情:', {
        response,
        responseType: typeof response,
        hasSuccess: 'success' in response,
        hasUser: 'user' in response,
        hasMessage: 'message' in response
      });
      
      // ApiClient 已经解包了响应，response 直接是后端返回的 data 部分: {message: string, user: {...}}
      // 检查响应是否包含用户信息（表示成功）
      if (response && response.user) {
        console.log('响应成功，处理用户状态更新');
        // 更新本地状态 - 直接使用解包后的数据
        const userInfo = response.user as any;
        const isActive = userInfo?.is_active === 1 || userInfo?.is_active === true;
        console.log('解析后的用户状态:', {
          response,
          userInfo,
          parsedIsActive: isActive
        });
        
        // 如果启用用户，获取符合条件的计划信息
        let planInfo = '';
        if (newStatus) {
          try {
            console.log('用户被启用，获取符合条件的计划信息');
            const eligiblePlans = await adminApi.getUserEligibleCommissionPlans(userId);
            console.log('获取到的符合条件计划:', eligiblePlans);
            
            if (eligiblePlans.plans && eligiblePlans.plans.length > 0) {
              const planNames = eligiblePlans.plans.map(plan => plan.name).join(', ');
              planInfo = ` (已分配计划: ${planNames})`;
              console.log('计划信息:', planInfo);
            } else {
              planInfo = ' (未找到符合条件的计划)';
              console.log('未找到符合条件的计划');
            }
          } catch (planError) {
            console.error('获取计划信息失败:', planError);
            planInfo = ' (计划信息获取失败)';
          }
        }
        
        setUsers(users.map(u => u.id === userId ? { 
          ...u, 
          is_active: isActive,
          loading: false 
        } : u));
        
        console.log('本地状态更新完成，显示成功提示');
        showAlert({ 
          message: `用户佣金状态已${newStatus ? '启用' : '禁用'}${planInfo}`, 
          type: 'success' 
        });
        
        // 重新获取用户数据和佣金计划数据以确保界面与后端数据同步
        console.log('重新获取用户数据和佣金计划数据以确保同步');
        await Promise.all([
          fetchUsersData(),
          fetchPlansData() // 同时刷新佣金计划数据，更新参与用户数量
        ]);
      } else {
        console.error('后端返回失败响应:', response);
        const errorMessage = response?.message || '更新失败';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('=== 捕获到错误 ===');
      console.error('错误类型:', error?.constructor?.name);
      console.error('错误消息:', error instanceof Error ? error.message : String(error));
      console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace');
      
      // 如果是网络错误，记录更多详情
      if (error instanceof Error) {
        console.error('详细错误信息:', {
          name: error.name,
          message: error.message,
          // cause: error.cause, // TypeScript 兼容性问题，暂时注释
          // @ts-ignore - 检查是否有网络相关属性
          code: error.code,
          // @ts-ignore
          errno: error.errno,
          // @ts-ignore
          syscall: error.syscall
        });
      }
      
      // 移除加载状态并显示错误
      console.log('移除用户加载状态，显示错误提示');
      setUsers(users.map(u => u.id === userId ? { ...u, loading: false } : u));
      
      const errorMessage = error instanceof Error ? error.message : '更新用户状态失败，请重试';
      console.log('显示错误消息:', errorMessage);
      showAlert({ message: errorMessage, type: 'error' });
    }
    
    console.log('=== 用户状态切换处理结束 ===');
  };

  const handleDeletePlan = async (planId: number) => {
    if (confirm('确定要删除这个佣金计划吗？')) {
      try {
        setLoading(true);
        await adminApi.deleteInitialCommissionPlan(planId);
        showAlert({ message: '佣金计划删除成功', type: 'success' });
        
        // 重新获取计划数据
        await fetchPlansData();
        
      } catch (error) {
        console.error('删除佣金计划失败:', error);
        showAlert({ message: '删除佣金计划失败，请重试', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };



  const getNextPayoutColor = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'text-red-600 font-medium';
    if (days <= 3) return 'text-yellow-600 font-medium';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">初始佣金管理</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">虚假佣金发放系统，用于吸引创作者</p>
        </div>
        <Button onClick={() => { setEditingPlan(undefined); setIsPlanModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          创建计划
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">总参与用户</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">活跃用户</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">累计发放</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">¥{stats.totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">月度预估</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">¥{stats.monthlyEstimate.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 佣金计划管理 */}
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">佣金计划</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative overflow-hidden rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 ${
                 plan.is_active 
                   ? 'border-blue-200 dark:border-blue-700' 
                   : 'border-gray-200 dark:border-gray-600'
               }`}
            >
              {/* 状态指示条 */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                 plan.is_active ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
               }`} />
              
              <div className="p-5">
                {/* 头部区域 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                         plan.is_active 
                           ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                           : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                       }`}>
                        {plan.is_active ? '● 启用中' : '○ 已禁用'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {plan.trigger_type === 'manual' ? '手动触发' : '自动触发'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* 描述 */}
                {plan.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* 核心信息卡片 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                       <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                         ¥{plan.fixed_amount}
                       </div>
                       <div className="text-xs text-gray-500 dark:text-gray-400">固定金额</div>
                     </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {plan.payout_cycle}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">发放周期(天)</div>
                    </div>
                  </div>
                </div>

                {/* 详细信息 */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Target className="h-3.5 w-3.5 mr-1.5" />
                      触发条件
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {plan.trigger_type === 'manual' ? '手动发放' : `工作流≥${plan.workflow_threshold}个`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      目标范围
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {plan.target_users && plan.target_users.length > 0 
                        ? `${plan.target_users.length}个指定用户` 
                        : '全部用户'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      参与用户
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {plan.user_count}人
                    </span>
                  </div>
                </div>

                {/* 底部操作提示 */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    月度预估: ¥{((30 / plan.payout_cycle) * plan.fixed_amount * plan.user_count).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 用户列表 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">参与用户</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">全部用户</option>
              <option value="active">活跃用户</option>
              <option value="inactive">非活跃用户</option>
            </select>
          </div>
        </div>

        {/* 用户表格 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  佣金计划
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  发放进度
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  下次发放
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  累计收益
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      ¥{user.fixed_amount} / {user.payout_cycle}天
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.plan_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.completed_payouts || 0} / {user.total_payouts || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      已发放 ¥{(user.total_paid_amount || 0).toFixed(2)}
                    </div>
                    {(user.pending_amount || 0) > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        待发放 ¥{user.pending_amount!.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${getNextPayoutColor(user.next_payout_date)}`}>
                      {new Date(user.next_payout_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.ceil((new Date(user.next_payout_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 天后
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ¥{(user.total_paid_amount || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserStatus(user.id)}
                      disabled={user.loading}
                      className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {user.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          处理中...
                        </>
                      ) : user.is_active ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          禁用
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          启用
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* 佣金计划模态框 */}
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        plan={editingPlan}
        onSave={handlePlanSave}
        availableUsers={availableUsers}
      />
    </div>
  );
};

export default AdminInitialCommissionPage;