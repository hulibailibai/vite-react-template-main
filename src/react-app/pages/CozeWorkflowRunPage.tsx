import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  User,
  Bot,
  Heart,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RichTextEditor } from '../components/ui/RichTextEditor';

import { useAuth } from '../contexts/AuthContext';
// import { useLanguage } from '../contexts/LanguageContext';
import { walletApi, apiClient } from '../services/api';
import { toast } from 'react-hot-toast';

interface CozeWorkflow {
  id: number;
  title: string;
  description?: string;
  price?: number;
  is_member_free?: boolean;
  runtime_duration?: number;
  like_count?: number;
  favorite_count?: number;
  run_count?: number;
  conversation_count?: number;
  cover_image_url?: string;
  preview_images?: string[];
  coze_api?: string;
  creator?: {
    username: string;
    avatar_url?: string;
  };
}

// Coze工作流运行页面
export const CozeWorkflowRunPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { t } = useLanguage();
  const { user } = useAuth();
  
  const [workflow, setWorkflow] = useState<CozeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    outputUrl?: string;
  }>>([]);
  const [whBalance, setWhBalance] = useState<number>(0);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [posts, setPosts] = useState<Array<{
    id: number;
    content: string;
    user?: {
      username: string;
      avatar_url?: string;
    };
    created_at: string;
    like_count: number;
    reply_count: number;
  }>>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  // const [isFavorited, setIsFavorited] = useState(false);
  // const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [apiParameters, setApiParameters] = useState<{[key: string]: string}>({});
  const [testInputs, setTestInputs] = useState<{[key: string]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 解析API参数
  const parseApiParameters = (cozeApiCode: string) => {
    try {
      // 查找parameters对象
      const parametersMatch = cozeApiCode.match(/parameters\s*:\s*\{([^}]+)\}/);
      if (parametersMatch) {
        const parametersStr = parametersMatch[1];
        const params: {[key: string]: string} = {};
        
        // 提取参数键值对，排除api_token
        const paramMatches = parametersStr.match(/(\w+)\s*:\s*([^,}]+)/g);
        if (paramMatches) {
          paramMatches.forEach(match => {
            const [key, value] = match.split(':').map(s => s.trim());
            if (key !== 'api_token') {
              params[key] = value.replace(/["']/g, ''); // 移除引号
            }
          });
        }
        
        setApiParameters(params);
        
        // 初始化测试输入
        const initialInputs: {[key: string]: string} = {};
        Object.keys(params).forEach(key => {
          initialInputs[key] = params[key] || '';
        });
        setTestInputs(initialInputs);
      }
    } catch (error) {
      console.error('解析API参数失败:', error);
    }
  };

  // 检查用户状态（收藏和点赞）
  const checkUserStatus = async () => {
    if (!workflow || !user) return;
    
    try {
      const response = await apiClient.get(`/coze-workflows/${workflow.id}/status`) as any;
      if (response.success && response.data) {
        // setIsFavorited(response.data.favorited);
        setIsLiked(response.data.liked);
        // setFavoriteCount(workflow.favorite_count || 0);
        setLikeCount(workflow.like_count || 0);
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
      // setIsFavorited(false);
      setIsLiked(false);
    }
  };

  // 切换点赞状态
  const toggleLike = async () => {
    if (!workflow || !user) {
      toast.error('请先登录');
      return;
    }
    
    try {
      const response = await apiClient.post(`/coze-workflows/${workflow.id}/like`) as any;
      if (response.success && response.data) {
        const liked = response.data.liked;
        setIsLiked(liked);
        setLikeCount(prev => liked ? prev + 1 : prev - 1);
        toast.success(liked ? '点赞成功' : '已取消点赞');
      } else {
        toast.error('操作失败，请稍后再试');
      }
    } catch (error) {
      console.error('点赞操作失败:', error);
      toast.error('操作失败，请稍后再试');
    }
  };

  // 加载社区帖子
  const loadPosts = async () => {
    if (!workflow) return;
    
    try {
      setLoadingPosts(true);
      const response = await apiClient.get(`/coze-workflows/${workflow.id}/comments`) as any;
      setPosts(response.posts || []);
    } catch (error) {
      console.error('加载帖子失败:', error);
      toast.error('加载帖子失败');
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // 创建帖子
  const handleCreatePost = async () => {
    if (!postContent.trim() || !workflow || !user) return;
    
    try {
      setPostSubmitting(true);
      const response = await apiClient.post(`/coze-workflows/${workflow.id}/comments`, {
        content: postContent.trim()
      }) as any;
      
      setPosts(prev => [response.data, ...prev]);
      setPostContent('');
      setShowPostForm(false);
      toast.success('发布成功！');
    } catch (error) {
      console.error('发布帖子失败:', error);
      toast.error('发布失败，请重试');
    } finally {
      setPostSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (id) {
      loadWorkflowDetail();
    }
    if (user) {
      loadWHBalance();
    }
  }, [id, user]);

  useEffect(() => {
    if (workflow) {
      loadPosts();
      checkUserStatus();
    }
  }, [workflow]);

  // 加载WH币余额
  const loadWHBalance = async () => {
    if (!user) return;
    
    try {
      const balance = await walletApi.getBalance();
      setWhBalance(balance.wh_coins || 0);
    } catch (error) {
      console.error('加载WH币余额失败:', error);
    }
  };

  const loadWorkflowDetail = async () => {
    try {
      setLoading(true);
      console.log('开始加载工作流详情，ID:', id);
      const response = await apiClient.get(`/coze-workflows/${id}`) as any;
      console.log('API响应:', response);
      // 检查响应格式：可能是 {success: true, data: {...}} 或直接是工作流对象
      if ((response.success && response.data) || (response.id && response.title)) {
        const workflowData = response.data || response;
        console.log('工作流数据加载成功:', workflowData);
        setWorkflow(workflowData);
        // // setFavoriteCount(workflowData.favorite_count || 0);
        setLikeCount(workflowData.like_count || 0);
        
        // 解析API参数
        if (workflowData.coze_api) {
          parseApiParameters(workflowData.coze_api);
        }
      } else {
        console.error('工作流不存在或响应失败:', response);
        toast.error(response.message || 'Coze工作流不存在');
        alert('工作流不存在，即将跳转到工作流列表页面');
        navigate('/coze-workflows');
      }
    } catch (error) {
      console.error('加载Coze工作流详情失败:', error);
      toast.error('加载Coze工作流详情失败');
      alert('加载工作流详情失败，即将跳转到工作流列表页面');
      navigate('/coze-workflows');
    } finally {
      setLoading(false);
    }
  };

  // 注意：任务状态监控现在由后端 videoTaskMonitor 服务自动处理
  // 前端不再需要轮询查询任务进度



  const handleSendMessage = async () => {
    // 检查是否有动态参数或普通消息
    const hasParameters = Object.keys(apiParameters).length > 0;
    const hasRequiredInputs = hasParameters ? 
      Object.keys(apiParameters).every(key => testInputs[key]?.trim()) : 
      inputMessage.trim();
    
    if (!workflow || !hasRequiredInputs) {
      if (hasParameters) {
        toast.error('请填写所有必需的参数');
      } else {
        toast.error('请输入消息内容');
      }
      return;
    }
    
    if (!user) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }
    
    // 检查用户邮箱设置
    const notificationEmail = testInputs['notification_email'] || user?.email;
    if (hasParameters && !notificationEmail) {
      toast.error('请设置通知邮箱以接收视频生成结果');
      return;
    }
    
    if (!notificationEmail) {
      toast.error('通知邮箱为空，请检查用户邮箱或输入参数');
      return;
    }
    
    const requiredCoins = workflow.price || 0;
    if (requiredCoins > 0 && whBalance < requiredCoins) {
      toast.error(`WH币余额不足！需要${requiredCoins}WH币，当前余额：${whBalance}WH币`);
      return;
    }
    
    // 构建用户消息内容
    const messageContent = hasParameters ? 
      Object.entries(testInputs)
        .filter(([key, value]) => key !== 'notification_email' && value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n') :
      inputMessage;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: messageContent,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (!hasParameters) {
      setInputMessage('');
    }
    setRunning(true);
    
    try {
      // 直接调用Coze API，而不是通过后端
      if (!workflow.coze_api) {
        throw new Error('工作流缺少Coze API配置');
      }

      // 从API代码中提取Authorization token
      const authMatch = workflow.coze_api.match(/Authorization:\s*Bearer\s+([^\s\\]+)/);
      if (!authMatch) {
        throw new Error('无法从API代码中提取Authorization token');
      }
      const authToken = authMatch[1];

      // 构建请求参数
      const requestParams: {[key: string]: any} = {
        api_token: authToken // 添加api_token参数
      };

      // 添加用户输入的参数
      if (hasParameters) {
        Object.keys(testInputs).forEach(key => {
          if (key !== 'notification_email' && testInputs[key]?.trim()) {
            requestParams[key] = testInputs[key].trim();
          }
        });
      }

      // 解析API代码中的工作流ID
      let workflowId = '';
      
      // 尝试从URL中提取工作流ID（支持workflow和workflows两种格式）
      const workflowUrlMatch = workflow.coze_api.match(/\/v1\/(workflow|workflows)\/(\w+)\/run/);
      if (workflowUrlMatch) {
        workflowId = workflowUrlMatch[2];
      } else {
        // 尝试从JSON数据中提取workflow_id
        const workflowIdJsonMatch = workflow.coze_api.match(/workflow_id\s*:\s*(\d+)/);
        if (workflowIdJsonMatch) {
          workflowId = workflowIdJsonMatch[1];
        } else {
          throw new Error('无法从API代码中提取工作流ID，请检查API代码格式是否正确');
        }
      }
      
      if (!workflowId) {
        throw new Error('工作流ID为空，请检查API代码');
      }

      // 发送测试请求到Coze API
      const response = await fetch(`https://api.coze.cn/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: workflowId,
          parameters: requestParams,
          is_async: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(result.msg || '工作流运行失败');
      }
      
      // 扣除WH币（如果需要）
       if (requiredCoins > 0) {
         try {
           // 通过后端API扣除WH币
           await apiClient.post('/wallet/deduct', {
             amount: requiredCoins,
             description: `运行Coze工作流: ${workflow.title}`
           });
           setWhBalance(prev => prev - requiredCoins);
         } catch (deductError) {
           console.error('扣除WH币失败:', deductError);
           // 继续执行，不阻止工作流运行
         }
       }
      
      // 创建视频生成任务（测试成功后）
      if (result.execute_id && workflowId) {
        try {
          const taskData = {
            execute_id: result.execute_id,
            workflow_id: workflowId,
            token: authToken,
            notification_email: notificationEmail,
            title: workflow.title,
            coze_workflow_id: workflow.id,
            user_id: user.id,
            debug_url: result.debug_url || ''
          };
          
          // 详细的参数验证和调试信息
          console.log('=== 任务数据详细信息 ===');
          console.log('execute_id:', result.execute_id, '类型:', typeof result.execute_id, '是否为空:', !result.execute_id);
          console.log('workflow_id:', workflowId, '类型:', typeof workflowId, '是否为空:', !workflowId);
          console.log('token:', authToken, '类型:', typeof authToken, '是否为空:', !authToken);
          console.log('notification_email:', notificationEmail, '类型:', typeof notificationEmail, '是否为空:', !notificationEmail);
          console.log('user_id:', user.id, '类型:', typeof user.id, '是否为空:', !user.id);
          console.log('title:', workflow.title, '类型:', typeof workflow.title);
          console.log('coze_workflow_id:', workflow.id, '类型:', typeof workflow.id);
          console.log('debug_url:', result.debug_url, '类型:', typeof result.debug_url);
          console.log('完整taskData:', JSON.stringify(taskData, null, 2));
          
          // 验证必要参数
          const requiredParams = ['execute_id', 'workflow_id', 'token', 'notification_email', 'user_id'];
          const missingParams = requiredParams.filter(param => !taskData[param as keyof typeof taskData]);
          
          if (missingParams.length > 0) {
            console.error('缺少必要参数:', missingParams);
            toast.error(`缺少必要参数: ${missingParams.join(', ')}`);
            return;
          }
          
          console.log('开始保存任务到数据库...');
          const saveResponse = await apiClient.post('/video-generation-tasks', taskData);
          console.log('任务保存成功，响应:', saveResponse);
          toast.success('任务已成功保存到数据库');
        } catch (saveError: any) {
          console.error('=== 保存任务失败详细信息 ===');
          console.error('错误对象:', saveError);
          console.error('错误消息:', saveError.message);
          console.error('错误响应:', saveError.response?.data);
          console.error('错误状态码:', saveError.response?.status);
          
          const errorMessage = saveError.response?.data?.message || saveError.message || '未知错误';
          toast.error(`保存任务失败: ${errorMessage}`);
          // 继续执行，不阻止工作流运行
        }
      } else {
        console.warn('跳过任务保存 - execute_id:', result.data?.execute_id, 'workflowId:', workflowId);
      }
      
      const assistantMessageId = (Date.now() + 1).toString();
      const successMessage = `🚀 工作流启动成功！\n\n📧 任务已提交到后台处理队列\n\n✅ 处理完成后将发送邮件通知到: ${notificationEmail}\n\n💡 您可以关闭此页面，结果将通过邮件发送给您`;
      
      const assistantMessage = {
        id: assistantMessageId,
        type: 'assistant' as const,
        content: successMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setRunning(false);
      
      // 任务状态监控现在由后端 videoTaskMonitor 服务自动处理
      // 用户将通过邮件接收处理结果
    } catch (error) {
      console.error('运行Coze工作流失败:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant' as const,
        content: `❌ 运行失败：${(error as Error).message}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setRunning(false);
      toast.error('Coze工作流运行失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Coze工作流不存在</h1>
          <Button onClick={() => navigate('/coze-workflows')}>返回工作流列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/coze-workflow/${workflow.id}`)}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {workflow.preview_images && workflow.preview_images.length > 0 && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <img
                  src={workflow.preview_images[0]}
                  alt={workflow.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{workflow.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Coze工作流运行</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                WH币余额: <span className="font-semibold">{whBalance}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧聊天区域 */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                {workflow.preview_images && workflow.preview_images.length > 0 && (
                   <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 mb-3 mx-auto">
                     <img
                       src={workflow.preview_images[0]}
                       alt={workflow.title}
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         (e.target as HTMLImageElement).style.display = 'none';
                       }}
                     />
                   </div>
                 )}
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {workflow.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {workflow.description || '输入消息开始与Coze工作流交互'}
                </p>
                {workflow.price && workflow.price > 0 && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    每次运行消耗 {workflow.price} WH币
                  </div>
                )}
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  'flex items-start space-x-3',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={clsx(
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.type === 'assistant' && message.outputUrl && (
                    <div className="mt-3">
                      <Button
                        onClick={() => window.open(message.outputUrl, '_blank')}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>查看结果</span>
                      </Button>
                    </div>
                  )}
                  
                  <p className={clsx(
                    'text-xs mt-1',
                    message.type === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  )}>
                    {message.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {running && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区域 */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {user && workflow && (workflow.price || 0) > 0 && whBalance < (workflow.price || 0) && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  WH币余额不足！需要{workflow.price || 0}WH币才能运行，当前余额：{whBalance}WH币
                </p>
              </div>
            )}
            
            {/* 动态参数输入区域 */}
            {Object.keys(apiParameters).length > 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">
                    🔧 测试参数 ({Object.keys(apiParameters).length} 个参数)
                  </label>
                </div>
                
                {Object.keys(apiParameters).length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {Object.keys(apiParameters).map((paramKey) => (
                      <div key={paramKey}>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {paramKey}
                        </label>
                        <input
                          type="text"
                          value={testInputs[paramKey] || ''}
                          onChange={(e) => setTestInputs(prev => ({
                            ...prev,
                            [paramKey]: e.target.value
                          }))}
                          placeholder={`请输入${paramKey}的值...`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    未检测到API参数，或参数解析失败
                  </div>
                )}
                
                {/* 通知邮箱输入框 */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    📧 通知邮箱
                  </label>
                  <input
                    type="email"
                    value={testInputs['notification_email'] || user?.email || ''}
                    onChange={(e) => setTestInputs(prev => ({
                      ...prev,
                      notification_email: e.target.value
                    }))}
                    placeholder="请输入接收视频生成任务消息的邮箱"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">用于接收视频生成任务的消息通知，默认为当前用户邮箱</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end space-x-3 mb-4">
                <Button
                  variant="ghost"
                  className="p-2 flex-shrink-0"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        toast.success(`已选择文件: ${file.name}`);
                      }
                    };
                    input.click();
                  }}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  
                  <Button
                    variant="ghost"
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-end space-x-3">
              <Button
                onClick={handleSendMessage}
                disabled={running || (Object.keys(apiParameters).length === 0 && !inputMessage.trim()) || (!!user && workflow && (workflow.price || 0) > 0 && whBalance < (workflow.price || 0))}
                className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-2xl flex-shrink-0"
              >
                {running ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              内容由AI生成，无法保证真实性，仅供参考。
            </p>
          </div>
        </div>

        {/* 右侧信息栏 */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {(workflow.price || 0) > 0 ? `当前工作流单次运行消耗${workflow.price}WH币` : '当前工作流免费使用'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <button 
                onClick={toggleLike}
                className={`flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md transition-colors ${
                  isLiked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-lg font-medium text-gray-900 dark:text-white">{likeCount}</span>
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div className="flex items-center">
                <span className="text-lg text-gray-500 dark:text-gray-400">{workflow?.run_count ? (workflow.run_count >= 1000000 ? `${(workflow.run_count / 1000000).toFixed(1)}M` : workflow.run_count >= 1000 ? `${(workflow.run_count / 1000).toFixed(1)}K` : workflow.run_count.toString()) : '0'}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 relative -top-1">使用</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div className="flex items-center">
                <span className="text-lg text-gray-500 dark:text-gray-400">{workflow?.conversation_count ? (workflow.conversation_count >= 1000000 ? `${(workflow.conversation_count / 1000000).toFixed(1)}M` : workflow.conversation_count >= 1000 ? `${(workflow.conversation_count / 1000).toFixed(1)}K` : workflow.conversation_count.toString()) : '0'}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 relative -top-1">对话</span>
              </div>
            </div>
            
            {workflow?.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {workflow.description}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 bg-white dark:bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">社区</h3>
              <Button 
                onClick={() => setShowPostForm(true)}
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <span className="mr-1">✨</span>
                发帖
              </Button>
            </div>
            
            <Modal
              isOpen={showPostForm}
              onClose={() => {
                setShowPostForm(false);
                setPostContent('');
              }}
              title="发布新帖子"
            >
              <div className="p-4">
                <RichTextEditor
                  value={postContent}
                  onChange={setPostContent}
                  placeholder="分享你的想法..."
                  className="w-full"
                  onImageUpload={async (file) => {
                    toast.success(`已选择图片: ${file.name}`);
                    return URL.createObjectURL(file);
                  }}
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowPostForm(false);
                      setPostContent('');
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || postSubmitting}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {postSubmitting ? '发布中...' : '发布'}
                  </Button>
                </div>
              </div>
            </Modal>
            
            <div className="flex-1 overflow-y-auto">
              {loadingPosts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>还没有帖子，来发布第一个吧！</p>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        {post.user?.avatar_url ? (
                          <img
                            src={post.user.avatar_url}
                            alt={post.user.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-white font-bold">
                            {post.user?.username?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {post.user?.username || '匿名用户'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('zh-CN')}
                          </span>
                          <MessageCircle className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{post.reply_count || 0}</span>
                          <Heart className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{post.like_count || 0}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};