// 创作者等级管理
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';
import { User, CreatorLevel as CreatorLevelType } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';

// 创作者等级接口定义（扩展类型定义）
interface CreatorLevel extends CreatorLevelType {
  level: number;
  min_earnings: number;
  color: string;
  icon: string;
}

// 等级编辑模态框组件
interface LevelEditModalProps {
  level: CreatorLevel | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isCreate?: boolean;
}

const LevelEditModal: React.FC<LevelEditModalProps> = ({
  level,
  isOpen,
  onClose,
  onUpdate,
  isCreate = false
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatorLevel>>({
    name: '',
    level: 1,
    min_earnings: 0,
    min_works: 0,
    min_rating: 0,
    commission_rate: 0.1,
    benefits: [],
    color: '#3B82F6',
    icon: '⭐',
    description: ''
  });
  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => {
    if (level && !isCreate) {
      setFormData({
        ...level,
        benefits: level.benefits || []
      });
    } else if (isCreate) {
      setFormData({
        name: '',
        level: 1,
        min_earnings: 0,
        min_works: 0,
        min_rating: 0,
        commission_rate: 0.1,
        benefits: [],
        color: '#3B82F6',
        icon: '⭐',
        description: ''
      });
    }
  }, [level, isCreate, isOpen]);

  const handleInputChange = (field: keyof CreatorLevel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...(prev.benefits || []), benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: (prev.benefits || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      showAlert('请填写等级名称', 'error');
      return;
    }

    if (!formData.description?.trim()) {
      showAlert('请填写等级描述', 'error');
      return;
    }

    if ((formData.level || 0) < 1) {
      showAlert('等级数值必须大于0', 'error');
      return;
    }

    if ((formData.commission_rate || 0) < 0 || (formData.commission_rate || 0) > 1) {
      showAlert('佣金比例必须在0-1之间', 'error');
      return;
    }

    const confirmed = await showConfirm(
      isCreate ? '创建等级' : '更新等级',
      `确定要${isCreate ? '创建' : '更新'}等级 "${formData.name}" 吗？`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      if (isCreate) {
        await adminApi.createCreatorLevel({
          name: formData.name || '',
          description: formData.description || '',
          min_works: formData.min_works || 0,
          min_rating: formData.min_rating || 0,
          commission_rate: formData.commission_rate || 0,
          benefits: formData.benefits || [],
          color: formData.color || '#3B82F6',
          icon: formData.icon || '⭐'
        });
        showAlert('等级创建成功', 'success');
      } else {
        await adminApi.updateCreatorLevel(Number(level!.id), {
          name: formData.name || '',
          description: formData.description || '',
          min_works: formData.min_works || 0,
          min_rating: formData.min_rating || 0,
          commission_rate: formData.commission_rate || 0,
          benefits: formData.benefits || [],
          color: formData.color || '#3B82F6',
          icon: formData.icon || '⭐'
        });
        showAlert('等级更新成功', 'success');
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error('操作等级失败:', error);
      showAlert(`${isCreate ? '创建' : '更新'}等级失败，请重试`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!level) return;

    const confirmed = await showConfirm(
      '删除等级',
      `确定要删除等级 "${level.name}" 吗？此操作不可撤销。`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.deleteCreatorLevel(Number(level.id));
      showAlert('等级删除成功', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('删除等级失败:', error);
      showAlert('删除等级失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isCreate ? '创建等级' : `编辑等级 - ${level?.name}`} 
      size="lg"
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              等级名称 *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入等级名称"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              等级数值 *
            </label>
            <input
              type="number"
              min="1"
              value={formData.level || 1}
              onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* 升级条件 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">升级条件</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最低收益 (¥)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.min_earnings || 0}
                onChange={(e) => handleInputChange('min_earnings', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最低作品数
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_works || 0}
                onChange={(e) => handleInputChange('min_works', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最低评分
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.min_rating || 0}
                onChange={(e) => handleInputChange('min_rating', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 等级权益 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">等级权益</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              佣金比例 (0-1)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={formData.commission_rate || 0.1}
              onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || 0.1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              特殊权益
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="输入权益描述"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
              />
              <Button onClick={handleAddBenefit} size="sm">
                添加
              </Button>
            </div>
            
            {formData.benefits && formData.benefits.length > 0 && (
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-2">
                    <span className="text-sm text-gray-900 dark:text-white">{benefit}</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveBenefit(index)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 外观设置 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">外观设置</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                等级图标
              </label>
              <input
                type="text"
                value={formData.icon || ''}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                placeholder="输入emoji或图标"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                等级颜色
              </label>
              <input
                type="color"
                value={formData.color || '#3B82F6'}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 等级描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            等级描述 *
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="请输入等级描述"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {!isCreate && (
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
              >
                删除等级
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? '处理中...' : (isCreate ? '创建等级' : '更新等级')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// 创作者等级分配模态框组件
interface CreatorLevelAssignModalProps {
  creator: User | null;
  levels: CreatorLevel[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CreatorLevelAssignModal: React.FC<CreatorLevelAssignModalProps> = ({
  creator,
  levels,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [loading, setLoading] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | ''>('');

  useEffect(() => {
    if (creator && isOpen) {
      setSelectedLevelId(creator.creator_level_id || '');
    }
  }, [creator, isOpen]);

  if (!creator) return null;

  const handleAssign = async () => {
    if (!selectedLevelId) {
      showAlert('请选择等级', 'error');
      return;
    }

    const selectedLevel = levels.find(l => l.id === selectedLevelId);
    const confirmed = await showConfirm(
      '分配等级',
      `确定要将创作者 "${creator.username}" 的等级设置为 "${selectedLevel?.name}" 吗？`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      await adminApi.assignCreatorLevel(creator.id, String(selectedLevelId));
      showAlert('等级分配成功', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('分配等级失败:', error);
      showAlert('分配等级失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = () => {
    return levels.find(l => l.id === creator.creator_level_id);
  };

  const getEligibleLevels = () => {
    return levels.filter(level => {
      return (
        (creator.total_earnings || 0) >= level.min_earnings &&
        (creator.workflow_count || 0) >= level.min_works &&
        (creator.average_rating || 0) >= level.min_rating
      );
    }).sort((a, b) => b.level - a.level);
  };

  const currentLevel = getCurrentLevel();
  const eligibleLevels = getEligibleLevels();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`等级分配 - ${creator.username}`} size="md">
      <div className="space-y-6">
        {/* 创作者信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">创作者信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                总收益
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {formatCurrency(creator.total_earnings || 0)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                作品数量
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {creator.workflow_count || 0}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                平均评分
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {(creator.average_rating || 0).toFixed(1)} / 5.0
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                当前等级
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {currentLevel ? (
                  <span className="inline-flex items-center space-x-1">
                    <span>{currentLevel.icon}</span>
                    <span>{currentLevel.name}</span>
                  </span>
                ) : (
                  '未分配'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 等级选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            选择等级
          </label>
          <select
            value={selectedLevelId}
            onChange={(e) => setSelectedLevelId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">请选择等级</option>
            {levels.map(level => {
              const isEligible = eligibleLevels.some(el => el.id === level.id);
              return (
                <option key={level.id} value={level.id}>
                  {level.icon} {level.name} (等级 {level.level})
                  {!isEligible && ' - 不符合条件'}
                </option>
              );
            })}
          </select>
        </div>

        {/* 符合条件的等级提示 */}
        {eligibleLevels.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              符合条件的等级:
            </h4>
            <div className="space-y-1">
              {eligibleLevels.map(level => (
                <div key={level.id} className="text-sm text-green-700 dark:text-green-300">
                  {level.icon} {level.name} (等级 {level.level})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={loading || !selectedLevelId}
          >
            {loading ? '分配中...' : '分配等级'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 管理员创作者等级管理页面
export const AdminCreatorLevelsPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isAdmin } = usePermission();
  const { showError } = useAlert();

  const [levels, setLevels] = useState<CreatorLevel[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'levels' | 'assignments'>('levels');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<CreatorLevel | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<User | null>(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // 分页大小常量
  const pageSize = 10;

  // 缓存管理员权限检查结果
  const isAdminUser = React.useMemo(() => isAdmin(), [user, isAuthenticated]);

  // 权限验证
  useEffect(() => {
    // 等待认证状态加载完成
    if (isLoading) return;
    
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    if (!isAdminUser) {
      window.location.href = '/';
      return;
    }
  }, [isAuthenticated, isLoading, isAdminUser]);

  // 加载等级数据
  const loadLevels = async () => {
    try {
      setLoading(true);
      // TODO: 实现获取创作者等级的API
      const response = await adminApi.getCreatorLevels();
      setLevels(response || []);
    } catch (error) {
      console.error('Failed to load levels:', error);
      showError('加载等级数据失败，请重试');
      // 模拟数据
      setLevels([
        {
          id: 1,
          name: '新手创作者',
          level: 1,
          min_earnings: 0,
          min_works: 0,
          min_rating: 0,
          commission_rate: 0.1,
          benefits: ['基础创作权限', '社区支持'],
          color: '#6B7280',
          icon: '🌱',
          description: '刚开始创作的新手创作者',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: '进阶创作者',
          level: 2,
          min_earnings: 1000,
          min_works: 5,
          min_rating: 3.5,
          commission_rate: 0.15,
          benefits: ['优先审核', '专属标识', '高级工具'],
          color: '#3B82F6',
          icon: '⭐',
          description: '有一定经验和作品的创作者',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: '专业创作者',
          level: 3,
          min_earnings: 5000,
          min_works: 20,
          min_rating: 4.0,
          commission_rate: 0.2,
          benefits: ['专属客服', '营销支持', '数据分析', '优先推荐'],
          color: '#10B981',
          icon: '💎',
          description: '专业水准的资深创作者',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 4,
          name: '顶级创作者',
          level: 4,
          min_earnings: 20000,
          min_works: 50,
          min_rating: 4.5,
          commission_rate: 0.3,
          benefits: ['独家合作', '定制服务', '品牌推广', '收益分成', '专属活动'],
          color: '#F59E0B',
          icon: '👑',
          description: '平台顶级创作者，享受最高待遇',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 加载创作者数据
  const loadCreators = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        pageSize,
        role: 'creator',
        status: 'active'
      };
      
      const response = await adminApi.getAllUsers(params);
      setCreators(response.items);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to load creators:', error);
      showError('加载创作者数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和依赖更新时重新加载
  useEffect(() => {
    if (isAuthenticated && isAdminUser) {
      if (activeTab === 'levels') {
        loadLevels();
      } else {
        loadCreators();
      }
    }
  }, [activeTab, currentPage, isAuthenticated, isAdminUser]);

  // 切换标签页时重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // 处理创建等级
  const handleCreateLevel = () => {
    setSelectedLevel(null);
    setIsCreateMode(true);
    setIsLevelModalOpen(true);
  };

  // 处理编辑等级
  const handleEditLevel = (level: CreatorLevel) => {
    setSelectedLevel(level);
    setIsCreateMode(false);
    setIsLevelModalOpen(true);
  };

  // 处理分配等级
  const handleAssignLevel = (creator: User) => {
    setSelectedCreator(creator);
    setIsAssignModalOpen(true);
  };

  // 处理模态框关闭
  const handleLevelModalClose = () => {
    setIsLevelModalOpen(false);
    setSelectedLevel(null);
    setIsCreateMode(false);
  };

  const handleAssignModalClose = () => {
    setIsAssignModalOpen(false);
    setSelectedCreator(null);
  };

  // 处理数据更新
  const handleDataUpdate = () => {
    if (activeTab === 'levels') {
      loadLevels();
    } else {
      loadCreators();
    }
  };

  // 获取等级徽章
  const getLevelBadge = (level: CreatorLevel) => {
    return (
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
        style={{ backgroundColor: level.color }}
      >
        <span className="mr-1">{level.icon}</span>
        {level.name}
      </span>
    );
  };

  // 获取创作者等级信息
  const getCreatorLevel = (creator: User) => {
    const level = levels.find(l => l.id === creator.creator_level_id);
    return level ? getLevelBadge(level) : (
      <Badge variant="secondary">未分配</Badge>
    );
  };

  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 如果未认证或无权限，不渲染内容（会被重定向）
  if (!isAuthenticated || !isAdminUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">等级管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              管理创作者等级体系和权益分配
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">等级数量</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  {levels.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">总创作者</p>
                <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                  {creators.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚡</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">已分配等级</p>
                <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                  {creators.filter(c => c.creator_level_id).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🎯</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-200">未分配等级</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {creators.filter(c => !c.creator_level_id).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('levels')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'levels'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              等级设置
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              等级分配
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'levels' ? (
            // 等级设置标签页
            <div className="space-y-4">
              {/* 操作栏 */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  共 {levels.length} 个等级
                </div>
                <div className="flex space-x-3">
                  <Button onClick={loadLevels} disabled={loading}>
                    {loading ? '加载中...' : '刷新数据'}
                  </Button>
                  <Button variant="primary" onClick={handleCreateLevel}>
                    创建等级
                  </Button>
                </div>
              </div>

              {/* 等级列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
                  </div>
                ) : levels.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                    暂无等级数据
                  </div>
                ) : (
                  levels.sort((a, b) => a.level - b.level).map((level) => (
                    <div key={level.id} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{level.icon}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {level.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              等级 {level.level}
                            </p>
                          </div>
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: level.color }}
                        ></div>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {level.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">最低收益:</span>
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrency(level.min_earnings)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">最低作品:</span>
                          <span className="text-gray-900 dark:text-white">
                            {level.min_works} 个
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">最低评分:</span>
                          <span className="text-gray-900 dark:text-white">
                            {level.min_rating.toFixed(1)} / 5.0
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">佣金比例:</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {(level.commission_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {level.benefits && level.benefits.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            特殊权益:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {level.benefits.slice(0, 3).map((benefit, index) => (
                              <span key={index} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 rounded">
                                {benefit}
                              </span>
                            ))}
                            {level.benefits.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs text-gray-700 dark:text-gray-300 rounded">
                                +{level.benefits.length - 3} 更多
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLevel(level)}
                        >
                          编辑等级
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // 等级分配标签页
            <div className="space-y-4">
              {/* 操作栏 */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  共 {totalCount} 位创作者
                </div>
                <Button onClick={loadCreators} disabled={loading}>
                  {loading ? '加载中...' : '刷新数据'}
                </Button>
              </div>

              {/* 创作者列表 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        创作者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        当前等级
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        总收益
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        作品数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        平均评分
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-500 dark:text-gray-400">加载中...</span>
                          </div>
                        </td>
                      </tr>
                    ) : creators.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          暂无创作者数据
                        </td>
                      </tr>
                    ) : (
                      creators.map((creator) => (
                        <tr key={creator.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {creator.avatar_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={creator.avatar_url}
                                    alt={creator.username}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      {creator.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {creator.username}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {creator.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getCreatorLevel(creator)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(creator.total_earnings || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {creator.workflow_count || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {(creator.average_rating || 0).toFixed(1)} / 5.0
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignLevel(creator)}
                            >
                              分配等级
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {!loading && creators.length > 0 && (
                <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 到{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalCount)}
                        </span>{' '}
                        条，共 <span className="font-medium">{totalCount}</span> 条记录
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="rounded-l-md"
                        >
                          上一页
                        </Button>
                        
                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'primary' : 'outline'}
                              onClick={() => setCurrentPage(pageNum)}
                              className="-ml-px"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="rounded-r-md -ml-px"
                        >
                          下一页
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 等级编辑模态框 */}
      <LevelEditModal
        level={selectedLevel}
        isOpen={isLevelModalOpen}
        onClose={handleLevelModalClose}
        onUpdate={handleDataUpdate}
        isCreate={isCreateMode}
      />

      {/* 等级分配模态框 */}
      <CreatorLevelAssignModal
        creator={selectedCreator}
        levels={levels}
        isOpen={isAssignModalOpen}
        onClose={handleAssignModalClose}
        onUpdate={handleDataUpdate}
      />
    </div>
  );
};