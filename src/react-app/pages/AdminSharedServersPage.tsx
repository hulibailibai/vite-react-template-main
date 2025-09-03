import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Server,
  Globe,
  Users,
  Activity,
  MapPin,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';

import { useAlert } from '../contexts/AlertContext';
import { adminApi } from '../services/api';

// 服务器接口
interface ServerInfo {
  id: number;
  name: string;
  url: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  server_type: 'shared' | 'dedicated' | 'cloud';
  location?: string;
  max_users: number;
  current_users: number;
  cpu_cores?: number;
  memory_gb?: number;
  storage_gb?: number;
  bandwidth_mbps?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

// 服务器编辑模态框接口
interface ServerEditModalProps {
  server: ServerInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: Partial<ServerInfo>) => void;
  isCreating?: boolean;
}

// 服务器编辑模态框组件
const ServerEditModal: React.FC<ServerEditModalProps> = ({ server, isOpen, onClose, onSave, isCreating = false }) => {
  const [formData, setFormData] = useState<Partial<ServerInfo>>({
    name: '',
    url: '',
    description: '',
    status: 'active',
    server_type: 'shared',
    location: '',
    max_users: 100,
    current_users: 0,
    cpu_cores: 4,
    memory_gb: 8,
    storage_gb: 500,
    bandwidth_mbps: 1000
  });
  const [loading, setLoading] = useState(false);
  const { showError } = useAlert();

  useEffect(() => {
    if (server && !isCreating) {
      setFormData(server);
    } else if (isCreating) {
      setFormData({
        name: '',
        url: '',
        description: '',
        status: 'active',
        server_type: 'shared',
        location: '',
        max_users: 100,
        current_users: 0,
        cpu_cores: 4,
        memory_gb: 8,
        storage_gb: 500,
        bandwidth_mbps: 1000
      });
    }
  }, [server, isCreating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      showError('请填写服务器名称和网址');
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save server:', error);
      showError(isCreating ? '创建服务器失败' : '更新服务器失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServerInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isCreating ? '添加服务器' : '编辑服务器'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务器名称 *
            </label>
            <Input
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入服务器名称"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务器网址 *
            </label>
            <Input
              value={formData.url || ''}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://server.example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            服务器描述
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="请输入服务器描述"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务器状态
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.status || 'active'}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <option value="active">运行中</option>
              <option value="inactive">已停用</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务器类型
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.server_type || 'shared'}
              onChange={(e) => handleInputChange('server_type', e.target.value)}
            >
              <option value="shared">共享服务器</option>
              <option value="dedicated">专用服务器</option>
              <option value="cloud">云服务器</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              服务器位置
            </label>
            <Input
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="北京"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最大用户数
            </label>
            <Input
              type="number"
              value={formData.max_users || 0}
              onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CPU核心数
            </label>
            <Input
              type="number"
              value={formData.cpu_cores || 0}
              onChange={(e) => handleInputChange('cpu_cores', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              内存(GB)
            </label>
            <Input
              type="number"
              value={formData.memory_gb || 0}
              onChange={(e) => handleInputChange('memory_gb', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              存储(GB)
            </label>
            <Input
              type="number"
              value={formData.storage_gb || 0}
              onChange={(e) => handleInputChange('storage_gb', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : (isCreating ? '创建' : '保存')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// 主页面组件
export const AdminSharedServersPage: React.FC = () => {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchServers();
  };
  // const { user } = useAuth();
  const { showSuccess, showError } = useAlert();

  // 获取服务器列表
  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getServers({
        page: currentPage,
        pageSize: pageSize,
        search: searchTerm,
        server_type: 'shared'
      });
      setServers(response.items);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('获取服务器列表失败:', error);
      showError('获取服务器列表失败');
      // 如果API调用失败，使用模拟数据作为后备
      const mockServers: ServerInfo[] = [
        {
          id: 1,
          name: '共享服务器-01',
          url: 'https://server01.example.com',
          description: '主要共享服务器，提供基础计算服务',
          status: 'active',
          server_type: 'shared',
          location: '北京',
          max_users: 100,
          current_users: 45,
          cpu_cores: 8,
          memory_gb: 16,
          storage_gb: 500,
          bandwidth_mbps: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: '共享服务器-02',
          url: 'https://server02.example.com',
          description: '备用共享服务器，负载均衡使用',
          status: 'active',
          server_type: 'shared',
          location: '上海',
          max_users: 100,
          current_users: 32,
          cpu_cores: 8,
          memory_gb: 16,
          storage_gb: 500,
          bandwidth_mbps: 1000,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        },
        {
          id: 3,
          name: '共享服务器-03',
          url: 'https://server03.example.com',
          description: '测试环境服务器',
          status: 'maintenance',
          server_type: 'shared',
          location: '深圳',
          max_users: 50,
          current_users: 0,
          cpu_cores: 4,
          memory_gb: 8,
          storage_gb: 250,
          bandwidth_mbps: 500,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z'
        }
      ];
      setServers(mockServers);
      setTotalCount(mockServers.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  // 过滤服务器
  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (server.location && server.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 获取状态徽章
  const getStatusBadge = (status: ServerInfo['status']) => {
    const statusConfig = {
      active: { label: '运行中', variant: 'success' as const },
      inactive: { label: '已停用', variant: 'secondary' as const },
      maintenance: { label: '维护中', variant: 'warning' as const }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 处理创建服务器
  const handleCreateServer = () => {
    setSelectedServer(null);
    setIsCreating(true);
    setIsEditModalOpen(true);
  };

  // 处理编辑服务器
  const handleEditServer = (server: ServerInfo) => {
    setSelectedServer(server);
    setIsCreating(false);
    setIsEditModalOpen(true);
  };

  // 处理保存服务器
  const handleSaveServer = async (serverData: Partial<ServerInfo>) => {
    try {
      if (isCreating) {
        // 创建新服务器
        await adminApi.createServer({
          name: serverData.name!,
          url: serverData.url!,
          description: serverData.description,
          status: serverData.status!,
          server_type: serverData.server_type!,
          location: serverData.location,
          max_users: serverData.max_users!,
          cpu_cores: serverData.cpu_cores,
          memory_gb: serverData.memory_gb,
          storage_gb: serverData.storage_gb,
          bandwidth_mbps: serverData.bandwidth_mbps
        });
        showSuccess('服务器创建成功');
      } else {
        // 更新现有服务器
        await adminApi.updateServer(selectedServer!.id, serverData);
        showSuccess('服务器更新成功');
      }
      await fetchServers();
    } catch (error) {
      throw error;
    }
  };

  // 处理删除服务器
  const handleDeleteServer = async (server: ServerInfo) => {
    if (!confirm(`确定要删除服务器 "${server.name}" 吗？`)) {
      return;
    }

    try {
      await adminApi.deleteServer(server.id);
      showSuccess('服务器删除成功');
      await fetchServers();
    } catch (error) {
      console.error('Failed to delete server:', error);
      showError('删除服务器失败');
    }
  };

  return (
    <div>
      {/* 页面操作 */}
      <div className="flex justify-end mb-6">
        <Button onClick={handleCreateServer}>
          <Plus className="w-4 h-4 mr-2" />
          添加服务器
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索服务器名称、网址或位置..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 服务器列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* 服务器基本信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {server.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(server.status)}
                        <Badge variant="outline">{server.server_type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditServer(server)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteServer(server)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 服务器网址 */}
                <div className="flex items-center space-x-2 mb-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a
                    href={server.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm truncate"
                  >
                    {server.url}
                  </a>
                </div>

                {/* 服务器描述 */}
                {server.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {server.description}
                  </p>
                )}

                {/* 服务器统计信息 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {server.current_users}/{server.max_users} 用户
                    </span>
                  </div>
                  {server.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {server.location}
                      </span>
                    </div>
                  )}
                </div>

                {/* 硬件配置 */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {server.cpu_cores && (
                    <div className="flex items-center space-x-1">
                      <Cpu className="w-3 h-3" />
                      <span>{server.cpu_cores} 核</span>
                    </div>
                  )}
                  {server.memory_gb && (
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3" />
                      <span>{server.memory_gb}GB</span>
                    </div>
                  )}
                  {server.storage_gb && (
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{server.storage_gb}GB</span>
                    </div>
                  )}
                  {server.bandwidth_mbps && (
                    <div className="flex items-center space-x-1">
                      <Wifi className="w-3 h-3" />
                      <span>{server.bandwidth_mbps}Mbps</span>
                    </div>
                  )}
                </div>

                {/* 使用率进度条 */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>使用率</span>
                    <span>{Math.round((server.current_users / server.max_users) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all',
                        (server.current_users / server.max_users) > 0.8
                          ? 'bg-red-500'
                          : (server.current_users / server.max_users) > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{
                        width: `${Math.min((server.current_users / server.max_users) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && filteredServers.length === 0 && (
        <Card className="text-center py-12">
          <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? '未找到匹配的服务器' : '暂无服务器'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? '请尝试其他搜索条件' : '点击上方按钮添加第一个服务器'}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateServer}>
              <Plus className="w-4 h-4 mr-2" />
              添加服务器
            </Button>
          )}
        </Card>
      )}

      {/* 分页组件 */}
      {!loading && filteredServers.length > 0 && totalCount > pageSize && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 编辑模态框 */}
      <ServerEditModal
        server={selectedServer}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedServer(null);
          setIsCreating(false);
        }}
        onSave={handleSaveServer}
        isCreating={isCreating}
      />
    </div>
  );
};

export default AdminSharedServersPage;