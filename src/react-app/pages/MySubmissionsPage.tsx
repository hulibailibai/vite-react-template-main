import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Textarea } from '../components/ui/Textarea';
import { Label } from '../components/ui/Label';
import { Calendar, DollarSign, Edit, Trash2, Eye } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface TaskSubmission {
  id: number;
  task_id: number;
  task_title: string;
  content: string;
  attachments: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_feedback: string;
  reward_amount: number;
  created_at: string;
  updated_at: string;
}

interface SubmissionsResponse {
  items: TaskSubmission[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface TaskStats {
  total_participated: number;
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  total_earnings: number;
}

const MySubmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [_searchTerm, _setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ content: '', attachments: [] as string[] });
  const [updating, setUpdating] = useState(false);
  const pageSize = 10;

  // 获取提交记录
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        pageSize: pageSize,
        ...(statusFilter && { status: statusFilter })
      };
      
      const response = await api.task.getMySubmissions(params);
      const data = response as SubmissionsResponse;
      
      setSubmissions(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('获取提交记录失败:', error);
      toast.error('获取提交记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await api.task.getTaskStats();
      setStats(response as TaskStats);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      fetchStats();
    }
  }, [currentPage, statusFilter, user]);

  // 筛选处理
  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  // 查看详情
  const handleViewDetail = async (submission: TaskSubmission) => {
    try {
      const response = await api.task.getMySubmissionDetail(submission.id);
      setSelectedSubmission(response.data as TaskSubmission);
      setShowDetailModal(true);
    } catch (error) {
      console.error('获取提交详情失败:', error);
      toast.error('获取提交详情失败');
    }
  };

  // 编辑提交
  const handleEditSubmission = (submission: TaskSubmission) => {
    setSelectedSubmission(submission);
    setEditForm({
      content: submission.content,
      attachments: submission.attachments || []
    });
    setShowEditModal(true);
  };

  // 更新提交
  const handleUpdateSubmission = async () => {
    if (!selectedSubmission || !editForm.content.trim()) {
      toast.error('请填写提交内容');
      return;
    }

    try {
      setUpdating(true);
      await api.task.updateMySubmission(selectedSubmission.id, {
        content: editForm.content,
        attachments: editForm.attachments
      });
      
      toast.success('提交更新成功');
      setShowEditModal(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error('更新提交失败:', error);
      toast.error(error.response?.data?.message || '更新提交失败');
    } finally {
      setUpdating(false);
    }
  };

  // 撤回提交
  const handleWithdrawSubmission = async (submissionId: number) => {
    if (!confirm('确定要撤回这个提交吗？撤回后将无法恢复。')) {
      return;
    }

    try {
      await api.task.withdrawMySubmission(submissionId);
      toast.success('提交撤回成功');
      fetchSubmissions();
      fetchStats();
    } catch (error: any) {
      console.error('撤回提交失败:', error);
      toast.error(error.response?.data?.message || '撤回提交失败');
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">审核中</Badge>;
      case 'approved':
        return <Badge variant="default">已通过</Badge>;
      case 'rejected':
        return <Badge variant="danger">已拒绝</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="mb-4">请先登录查看提交记录</p>
          <Link to="/login">
            <Button>立即登录</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的提交</h1>
        <p className="text-gray-600">查看和管理您的任务提交记录</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total_participated}</div>
              <p className="text-xs text-muted-foreground">总参与数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_submissions}</div>
              <p className="text-xs text-muted-foreground">审核中</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.approved_submissions}</div>
              <p className="text-xs text-muted-foreground">已通过</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.rejected_submissions}</div>
              <p className="text-xs text-muted-foreground">已拒绝</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">¥{stats.total_earnings}</div>
              <p className="text-xs text-muted-foreground">总收益</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">审核中</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 统计信息 */}
      <div className="mb-6 text-sm text-gray-600">
        共 {total} 条提交记录
      </div>

      {/* 提交列表 */}
      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">暂无提交记录</div>
          <Link to="/tasks">
            <Button>去参与任务</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      <Link 
                        to={`/tasks/${submission.task_id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {submission.task_title}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        提交时间：{formatDate(submission.created_at)}
                      </div>
                      {submission.updated_at !== submission.created_at && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          更新时间：{formatDate(submission.updated_at)}
                        </div>
                      )}
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        奖励：¥{submission.reward_amount}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">{submission.content}</p>
                </div>
                
                {submission.admin_feedback && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">管理员反馈：</div>
                    <p className="text-sm text-gray-600">{submission.admin_feedback}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetail(submission)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    查看详情
                  </Button>
                  
                  {submission.status === 'pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSubmission(submission)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleWithdrawSubmission(submission.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        撤回
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* 详情模态框 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>提交详情</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <Label>任务标题</Label>
                <p className="mt-1 text-sm">{selectedSubmission.task_title}</p>
              </div>
              
              <div>
                <Label>提交内容</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedSubmission.content}</p>
                </div>
              </div>
              
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <Label>附件</Label>
                  <div className="mt-1 space-y-1">
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {attachment}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label>状态</Label>
                <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
              </div>
              
              {selectedSubmission.admin_feedback && (
                <div>
                  <Label>管理员反馈</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedSubmission.admin_feedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑模态框 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑提交</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content">提交内容 *</Label>
              <Textarea
                id="edit-content"
                placeholder="请详细描述您的提交内容..."
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-attachments">附件链接（可选）</Label>
              <Input
                id="edit-attachments"
                placeholder="如有相关文件，请提供下载链接"
                value={editForm.attachments.join(', ')}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  attachments: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                disabled={updating}
              >
                取消
              </Button>
              <Button 
                onClick={handleUpdateSubmission}
                disabled={updating || !editForm.content.trim()}
              >
                {updating ? '更新中...' : '更新提交'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySubmissionsPage;