import React, { useState } from 'react';
import { Table, Button, Space, Modal, message, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { creatorApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { zhCN } from 'date-fns/locale/zh-CN';

interface WorkItem {
  id: number;
  title: string;
  type: 'workflow' | 'ai_app';
  status: string;
  price: number;
  created_at: string;
  updated_at: string;
  view_count?: number;
  download_count?: number;
  like_count?: number;
  session_count?: number;
  tags?: string[];
  category?: string;
  cover_image?: string;
  app_avatar?: string;
  creator?: {
    username: string;
    avatar?: string;
  };
  is_featured?: boolean;
}

interface WorkListTableProps {
  works: WorkItem[];
  loading: boolean;
  onEdit: (work: WorkItem) => void;
  onRefresh: () => void;
}

const WorkListTable: React.FC<WorkListTableProps> = ({ works, loading, onEdit, onRefresh }) => {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedWork, setSelectedWork] = useState<WorkItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 处理删除
  const handleDelete = async () => {
    if (!selectedWork) return;
    
    setActionLoading(true);
    try {
      if (selectedWork.type === 'workflow') {
        await creatorApi.deleteWorkflow(selectedWork.id);
      } else {
        // AI App functionality removed as ai_apps table no longer exists
        message.error('AI应用功能已移除');
        return;
      }
      message.success('删除成功');
      setDeleteModalVisible(false);
      onRefresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理状态更新（上线/下线）
  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedWork) return;
    
    setActionLoading(true);
    try {
      if (selectedWork.type === 'workflow') {
        await creatorApi.updateWorkflowStatus(selectedWork.id, newStatus);
      } else {
        // AI App functionality removed as ai_apps table no longer exists
        message.error('AI应用功能已移除');
        return;
      }
      message.success(`${newStatus === 'published' ? '上线' : '下线'}成功`);
      setStatusModalVisible(false);
      onRefresh();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'draft': { color: 'default', text: '草稿' },
      'pending': { color: 'processing', text: '待审核' },
      'approved': { color: 'success', text: '已通过' },
      'published': { color: 'success', text: '已上线' },
      'rejected': { color: 'error', text: '已拒绝' },
      'offline': { color: 'warning', text: '已下线' },
      'suspended': { color: 'error', text: '已暂停' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return price === 0 ? '免费' : `¥${price}`;
  };

  // 格式化统计数据
  const formatStats = (work: WorkItem) => {
    const stats = [];
    if (work.view_count !== undefined) stats.push(`${work.view_count} 浏览`);
    if (work.download_count !== undefined) stats.push(`${work.download_count} 下载`);
    if (work.like_count !== undefined) stats.push(`${work.like_count} 点赞`);
    if (work.session_count !== undefined) stats.push(`${work.session_count} 会话`);
    return stats.join(' · ');
  };

  const columns = [
    {
      title: '作品',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (title: string, record: WorkItem) => (
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            {/* 封面图或头像 */}
            <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-600 bg-gray-700">
              {(record.cover_image || record.app_avatar) ? (
                <img 
                  src={record.type === 'ai_app' ? record.app_avatar : record.cover_image}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${(record.cover_image || record.app_avatar) ? 'hidden' : ''}`}>
                <span className="text-gray-300 font-bold text-lg">
                  {record.type === 'ai_app' ? 'AI' : 'WF'}
                </span>
              </div>
            </div>
            {/* 封面图状态指示器 */}
            {(record.cover_image || record.app_avatar) && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" title="已设置封面图"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-100 truncate">{title}</h4>
              {record.is_featured && (
                <Tag color="gold">精选</Tag>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {record.type === 'workflow' ? '工作流' : 'AI应用'}
              {record.category && ` · ${record.category}`}
            </p>
            {record.tags && record.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {record.tags.slice(0, 3).map((tag, index) => (
                  <Tag key={index} color="blue">{tag}</Tag>
                ))}
                {record.tags.length > 3 && (
                  <Tag color="blue">+{record.tags.length - 3}</Tag>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price: number) => (
        <span className="text-gray-200 font-medium">{formatPrice(price)}</span>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      width: 200,
      render: (_: any, record: WorkItem) => (
        <div className="text-sm text-gray-300">
          {formatStats(record)}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 120,
      render: (date: string) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <span className="text-sm text-gray-300">
            {formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN })}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: WorkItem) => {
        // const isPublished = record.status === 'published';
        const canPublish = ['approved', 'offline'].includes(record.status);
        const canOffline = record.status === 'published';
        
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                size="small"
                className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
              />
            </Tooltip>
            
            {canPublish && (
              <Tooltip title="上线">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedWork(record);
                    setStatusModalVisible(true);
                  }}
                  size="small"
                  className="text-green-400 hover:text-green-300 hover:bg-gray-700"
                />
              </Tooltip>
            )}
            
            {canOffline && (
              <Tooltip title="下线">
                <Button
                  type="text"
                  icon={<EyeInvisibleOutlined />}
                  onClick={() => {
                    setSelectedWork(record);
                    setStatusModalVisible(true);
                  }}
                  size="small"
                  className="text-orange-400 hover:text-orange-300 hover:bg-gray-700"
                />
              </Tooltip>
            )}
            
            <Tooltip title="删除">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => {
                  setSelectedWork(record);
                  setDeleteModalVisible(true);
                }}
                size="small"
                className="text-red-400 hover:text-red-300 hover:bg-gray-700"
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={works}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
        className="work-list-table"
        style={{
          backgroundColor: '#1f2937',
          borderRadius: '8px',
        }}
        components={{
          header: {
            cell: (props: any) => (
              <th {...props} style={{ backgroundColor: '#374151', color: '#f3f4f6', borderBottom: '1px solid #4b5563' }} />
            ),
          },
          body: {
            row: (props: any) => (
              <tr {...props} style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }} />
            ),
            cell: (props: any) => (
              <td {...props} style={{ backgroundColor: '#1f2937', borderBottom: '1px solid #374151' }} />
            ),
          },
        }}
      />

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={actionLoading}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除「{selectedWork?.title}」吗？</p>
        <p className="text-red-500 text-sm mt-2">此操作不可撤销，请谨慎操作。</p>
      </Modal>

      {/* 状态更新确认对话框 */}
      <Modal
        title={selectedWork?.status === 'published' ? '确认下线' : '确认上线'}
        open={statusModalVisible}
        onOk={() => {
          const newStatus = selectedWork?.status === 'published' ? 'offline' : 'published';
          handleStatusUpdate(newStatus);
        }}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={actionLoading}
        okText={selectedWork?.status === 'published' ? '确认下线' : '确认上线'}
        cancelText="取消"
      >
        <p>
          确定要{selectedWork?.status === 'published' ? '下线' : '上线'}「{selectedWork?.title}」吗？
        </p>
        {selectedWork?.status === 'published' && (
          <p className="text-orange-500 text-sm mt-2">下线后用户将无法访问此作品。</p>
        )}
      </Modal>
    </>
  );
};

export default WorkListTable;