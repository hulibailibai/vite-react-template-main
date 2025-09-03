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
  Star,
  ThumbsUp,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RichTextEditor } from '../components/ui/RichTextEditor';

import { AIApp } from '../types';
import { AIAppService } from '../services/aiAppService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { walletApi, apiClient } from '../services/api';
import { toast } from 'react-hot-toast';



// AI应用详情页面
export const AIAppDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [app, setApp] = useState<AIApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    outputUrl?: string; // 添加输出链接字段
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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 检查用户状态（收藏和点赞）
  const checkUserStatus = async () => {
    if (!app || !user) return;
    
    try {
      const response = await apiClient.get(`/ai-apps/${app.id}/user-status`) as any;
      if (response.success && response.data) {
        setIsFavorited(response.data.favorited);
        setIsLiked(response.data.liked);
        setFavoriteCount(app.favorite_count || 0);
        setLikeCount(app.like_count || 0);
      }
    } catch (error) {
      console.error('检查用户状态失败:', error);
      setIsFavorited(false);
      setIsLiked(false);
    }
  };

  // 切换收藏状态
  const toggleFavorite = async () => {
    if (!app || !user) {
      toast.error('请先登录');
      return;
    }
    
    // 乐观更新UI
    const newFavoriteState = !isFavorited;
    setIsFavorited(newFavoriteState);
    setFavoriteCount(prev => newFavoriteState ? prev + 1 : prev - 1);
    
    try {
      const response = await apiClient.post(`/ai-apps/${app.id}/favorite`) as any;
      if (response.success && response.data) {
        // 根据API返回的状态更新UI
        setIsFavorited(response.data.favorited);
        setFavoriteCount(prev => {
          const currentCount = newFavoriteState ? prev - 1 : prev + 1; // 先回滚乐观更新
          return response.data.favorited ? currentCount + 1 : currentCount - 1; // 再应用真实状态
        });
        toast.success(response.data.favorited ? '收藏成功' : '已取消收藏');
      } else {
        // 如果API调用失败，回滚UI状态
        setIsFavorited(!newFavoriteState);
        setFavoriteCount(prev => newFavoriteState ? prev - 1 : prev + 1);
        toast.error('操作失败，请稍后再试');
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      // 回滚UI状态
      setIsFavorited(!newFavoriteState);
      setFavoriteCount(prev => newFavoriteState ? prev - 1 : prev + 1);
      toast.error('操作失败，请稍后再试');
    }
  };

  // 切换点赞状态
  const toggleLike = async () => {
    if (!app || !user) {
      toast.error('请先登录');
      return;
    }
    
    try {
      const response = await AIAppService.likeAIApp(app.id);
      if (response.success && response.data && 'liked' in response.data) {
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
    if (!app) return;
    
    try {
      setLoadingPosts(true);
      const response = await apiClient.get(`/ai-apps/${app.id}/posts`) as any;
      // API 返回的数据结构是 { success: true, data: { posts: [...], pagination: {...} } }
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
    if (!postContent.trim() || !app || !user) return;
    
    try {
      setPostSubmitting(true);
      const response = await apiClient.post(`/ai-apps/${app.id}/posts`, {
        content: postContent.trim()
      }) as any;
      
      // 添加新帖子到列表顶部
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (id) {
      loadAIAppDetail();
    }
    if (user) {
      loadWHBalance();
    }
  }, [id, user]);

  useEffect(() => {
    if (app) {
      loadPosts();
      checkUserStatus();
    }
  }, [app]);

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

  const loadAIAppDetail = async () => {
    try {
      setLoading(true);
      const response = await AIAppService.getAIAppDetail(parseInt(id!));
      if (response.success && response.data) {
        setApp(response.data);
        setFavoriteCount(response.data.favorite_count || 0);
        setLikeCount(response.data.like_count || 0);
        // 输入数据初始化已移除，现在使用消息系统
      } else {
        toast.error(response.message || 'AI应用不存在');
        navigate('/ai-apps');
      }
    } catch (error) {
      console.error('加载AI应用详情失败:', error);
      toast.error('加载AI应用详情失败');
      navigate('/ai-apps');
    } finally {
      setLoading(false);
    }
  };

  // 使用Coze API查询执行进度
  const queryCozeExecutionProgress = async (workflowId: string, executeId: string, messageId: string, maxWaitMinutes: number) => {
    const maxAttempts = Math.max(16, maxWaitMinutes * 6); // 每10秒查询一次，最少16次
    let attempts = 0;
    
    const checkProgress = async (): Promise<void> => {
      try {
        attempts++;
        console.log(`Progress check attempt ${attempts}/${maxAttempts}`);
        
        const response = await fetch(`https://api.coze.cn/v1/coze-workflows/${workflowId}/run_histories/${executeId}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer pat_vynpqBQHiJ46DnbDcmts4kfLgbpyfYOM94NYNmS8TYBRHaxZEVSCl4i2cgsCJs5V',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`进度查询失败: ${response.status} ${response.statusText}`);
        }
        
        const progressData = await response.json();
        console.log('Progress data:', progressData);
        
        // 检查API响应格式和执行状态
        let executeStatus = null;
        let statusData = null;
        
        // 根据实际API响应结构获取执行状态
        if (progressData.data && Array.isArray(progressData.data) && progressData.data.length > 0) {
          statusData = progressData.data[0];
          executeStatus = statusData.execute_status;
        } else if (progressData.execute_status) {
          executeStatus = progressData.execute_status;
          statusData = progressData;
        } else if (progressData.status) {
          executeStatus = progressData.status;
          statusData = progressData;
        }
        
        console.log('Extracted execute_status:', executeStatus);
        
        // 检查执行状态
        if (executeStatus === 'Completed' || executeStatus === 'Success' || executeStatus === 'completed' || executeStatus === 'success') {
          // 执行完成，提取输出链接
          let outputUrl = '';
          let resultMessage = 'AI应用运行完成！';
          
          try {
            // 尝试从output字段中提取链接
            if (statusData && statusData.output) {
              const outputData = JSON.parse(statusData.output);
              if (outputData.Output) {
                const innerOutput = JSON.parse(outputData.Output);
                if (innerOutput.output) {
                  // 提取链接，去除反斜杠转义
                  outputUrl = innerOutput.output.replace(/\\/g, '').trim();
                  if (outputUrl.startsWith('`') && outputUrl.endsWith('`')) {
                    outputUrl = outputUrl.slice(1, -1); // 去除反引号
                  }
                }
              }
            }
            
            if (outputUrl) {
              resultMessage = `🎉 AI应用运行完成！\n\n📎 结果链接：\n${outputUrl}\n\n💡 点击下方按钮查看生成的内容`;
            } else {
              resultMessage = `🎉 AI应用运行完成！\n\n执行结果：\n${JSON.stringify(progressData, null, 2)}`;
            }
          } catch (error) {
            console.error('Failed to parse output:', error);
            resultMessage = `🎉 AI应用运行完成！\n\n执行结果：\n${JSON.stringify(progressData, null, 2)}`;
          }
          
          // 更新消息内容
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: resultMessage,
                outputUrl: outputUrl || undefined // 保存输出链接
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.success('AI应用运行完成！');
          return;
        } else if (executeStatus === 'Failed' || executeStatus === 'Error' || executeStatus === 'failed' || executeStatus === 'error') {
          // 执行失败
          const errorMessage = `❌ AI应用运行失败！\n\n错误信息：\n${JSON.stringify(progressData, null, 2)}`;
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: errorMessage
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.error('AI应用运行失败，请检查配置');
          return;
        } else if (executeStatus === 'Running' || executeStatus === 'Pending' || executeStatus === 'running' || executeStatus === 'pending') {
          // 仍在运行中
          const progressMessage = `🔄 AI应用运行中... (${attempts}/${maxAttempts})\n\n当前状态: ${executeStatus}\n\n正在处理中，请耐心等待...\n\n💡 预计运行时间：${maxWaitMinutes} 分钟`;
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: progressMessage
              };
            }
            return msg;
          }));
          
          // 如果还没有达到最大尝试次数，继续查询
          if (attempts < maxAttempts) {
            setTimeout(() => {
              checkProgress();
            }, 10000); // 10秒后再次查询
          } else {
            // 超时
            const timeoutMessage = `⏰ AI应用查询超时！\n\n已查询 ${attempts} 次，预计运行时间 ${maxWaitMinutes} 分钟已超过。\n\n最后状态：\n${JSON.stringify(progressData, null, 2)}\n\n💡 任务可能仍在后台处理中，请稍后刷新页面查看结果`;
            setMessages(prev => prev.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  content: timeoutMessage
                };
              }
              return msg;
            }));
            setRunning(false);
            toast.error(`查询超时，已等待 ${Math.round(maxWaitMinutes)} 分钟`);
          }
        } else {
          // 未知状态或无状态信息
          let unknownMessage = '';
          if (!executeStatus) {
            unknownMessage = `❓ 无法获取执行状态！\n\n响应数据：\n${JSON.stringify(progressData, null, 2)}`;
          } else {
            unknownMessage = `❓ AI应用状态未知！\n\n当前状态: ${executeStatus}\n\n状态信息：\n${JSON.stringify(progressData, null, 2)}`;
          }
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: unknownMessage
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.error('AI应用运行状态未知');
        }
      } catch (error) {
        console.error('Progress query failed:', error);
        
        if (attempts >= maxAttempts) {
          const errorMessage = `❌ 进度查询失败！\n\n错误信息: ${(error as Error).message}\n\n已尝试 ${attempts} 次查询`;
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: errorMessage
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.error('进度查询失败: ' + (error as Error).message);
        } else {
          // 查询失败，10秒后重试
          const retryMessage = `🔄 进度查询遇到错误，10秒后重试... (${attempts}/${maxAttempts})\n\n错误: ${(error as Error).message}`;
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: retryMessage
              };
            }
            return msg;
          }));
          setTimeout(() => {
            checkProgress();
          }, 10000);
        }
      }
    };
    
    // 开始第一次查询
    await checkProgress();
  };

  // 轮询查询任务状态（保留原有逻辑作为备用）
  const pollTaskStatus = async (runId: number, messageId: string, attemptCount: number = 1, maxAttempts?: number) => {
    try {
      // 计算最大尝试次数（基于运行时间预估，默认5分钟）
      const runtimeDuration = app?.runtime_duration || 5;
      const calculatedMaxAttempts = maxAttempts || Math.max(30, runtimeDuration * 6); // 每10秒查询一次
      
      const statusResponse = await AIAppService.getTaskStatus(runId);
      if (statusResponse.success && statusResponse.data) {
        const { status, output_data, error_message } = statusResponse.data;
        
        if (status === 'running') {
          // 更新进度提示消息
          let progressMessage = `AI应用正在运行中... (${attemptCount}/${calculatedMaxAttempts})\n\n`;
          progressMessage += `预计运行时间：${runtimeDuration} 分钟\n`;
          progressMessage += `当前状态：运行中\n`;
          
          // 显示查询间隔信息
          const nextInterval = attemptCount <= 5 ? 10 : 30;
          progressMessage += `查询间隔：${nextInterval}秒\n`;
          
          // 检查是否超时
          if (attemptCount > calculatedMaxAttempts) {
            progressMessage += `\n⚠️ 当前使用人数较多，请耐心等待...\n`;
            progressMessage += `已超过预估时间，但任务仍在处理中\n`;
            progressMessage += `💡 系统正在后台异步处理，无需频繁刷新`;
          } else {
            const remainingMinutes = Math.max(0, runtimeDuration - Math.floor(attemptCount / 6));
            progressMessage += `预计还需等待：约 ${remainingMinutes} 分钟\n`;
            progressMessage += `💡 后台正在异步处理，请耐心等待结果`;
          }
          
          // 更新消息内容
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: progressMessage
              };
            }
            return msg;
          }));
          
          // 优化轮询策略：减少查询频率，让后端异步处理发挥作用
          // 前5次查询间隔10秒，之后间隔30秒，减少服务器压力
          const nextIntervalMs = attemptCount <= 5 ? 10000 : 30000;
          setTimeout(() => {
            pollTaskStatus(runId, messageId, attemptCount + 1, calculatedMaxAttempts);
          }, nextIntervalMs);
        } else if (status === 'completed') {
          // 任务完成，更新消息内容
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: typeof output_data === 'string' ? output_data : JSON.stringify(output_data, null, 2)
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.success('AI应用运行完成！');
        } else if (status === 'failed') {
           // 任务失败
           const errorInfo = error_message || output_data || '未知错误';
           setMessages(prev => prev.map(msg => {
             if (msg.id === messageId) {
               return {
                 ...msg,
                 content: `❌ 任务执行失败\n\n错误信息：${errorInfo}`
               };
             }
             return msg;
           }));
           setRunning(false);
           toast.error('AI应用运行失败');
        } else {
          // 其他状态，显示原始数据
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: typeof output_data === 'string' ? output_data : JSON.stringify(output_data, null, 2)
              };
            }
            return msg;
          }));
          setRunning(false);
        }
      } else {
        // 查询失败，重试机制
        if (attemptCount < 3) {
          // 前3次失败时重试
          setTimeout(() => {
            pollTaskStatus(runId, messageId, attemptCount + 1, calculatedMaxAttempts);
          }, 5000); // 5秒后重试
          
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: `查询任务状态遇到问题，正在重试... (${attemptCount}/3)`
              };
            }
            return msg;
          }));
        } else {
          // 多次失败后停止轮询
          setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: '查询任务状态失败，请稍后重试或联系客服'
              };
            }
            return msg;
          }));
          setRunning(false);
          toast.error('查询任务状态失败');
        }
      }
    } catch (error) {
      console.error('查询任务状态失败:', error);
      
      // 错误重试机制
      if (attemptCount < 3) {
        setTimeout(() => {
          pollTaskStatus(runId, messageId, attemptCount + 1, maxAttempts);
        }, 5000);
        
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: `网络连接异常，正在重试... (${attemptCount}/3)`
            };
          }
          return msg;
        }));
      } else {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: '网络连接失败，请检查网络后重试'
            };
          }
          return msg;
        }));
        setRunning(false);
        toast.error('网络连接失败');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!app || !inputMessage.trim()) return;
    
    // 检查用户是否已登录
    if (!user) {
      toast.error(t('auth.loginToUseApp'));
      navigate('/login');
      return;
    }
    
    // 检查WH币余额（免费应用不需要消耗WH币）
    const requiredCoins = app.price || 0; // 根据应用价格确定消耗的WH币
    if (requiredCoins > 0 && whBalance < requiredCoins) {
      toast.error(`WH币余额不足！需要${requiredCoins}WH币，当前余额：${whBalance}WH币`);
      return;
    }
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setRunning(true);
    
    try {
      const response = await AIAppService.runAIApp(app.id, { content: inputMessage });
      if (response.success) {
        const assistantMessageId = (Date.now() + 1).toString();
        
        // 检查是否为running状态
        if (response.data?.status === 'running') {
          // 获取运行时间预估
          const runtimeDuration = app.runtime_duration || 5;
          
          // 显示任务提交消息和运行时间预估
          let initialMessage = `✅ 任务已成功提交！\n\n`;
          initialMessage += `📊 预计运行时间：${runtimeDuration} 分钟\n`;
          initialMessage += `⏳ 正在启动AI应用，请稍候...\n\n`;
          initialMessage += `🔄 系统采用Coze API直接查询模式：\n`;
          initialMessage += `• 直接调用Coze API获取实时状态\n`;
          initialMessage += `• 智能轮询策略，减少服务器压力\n`;
          initialMessage += `• 您可以在此页面查看实时进度，无需刷新页面`;
          
          const assistantMessage = {
            id: assistantMessageId,
            type: 'assistant' as const,
            content: initialMessage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // 显示运行时间预估的toast提示
          toast(`AI应用正在启动，预计需要 ${runtimeDuration} 分钟，请耐心等待...`, {
            duration: 5000,
            icon: 'ℹ️'
          });
          
          // 更新WH币余额（仅在非免费应用时扣除）
          if (response.data?.remaining_balance !== undefined) {
            setWhBalance(response.data.remaining_balance);
          } else if (requiredCoins > 0) {
            setWhBalance(prev => prev - requiredCoins);
          }
          
          // 提取workflow_id和execute_id，然后使用Coze API查询
          try {
            // 从result字段中提取debug_url和execute_id
            const resultData = response.data?.result;
            const debugUrl = resultData?.debug_url;
            const executeId = resultData?.execute_id;
            
            let workflowId = null;
            let extractedExecuteId = executeId;
            
            if (debugUrl) {
              // 从debug_url中提取workflow_id
              const workflowIdMatch = debugUrl.match(/workflow_id=([^&]+)/);
              if (workflowIdMatch) {
                workflowId = workflowIdMatch[1];
              }
              
              // 如果execute_id不存在，尝试从debug_url中提取
              if (!extractedExecuteId) {
                const executeIdMatch = debugUrl.match(/execute_id=([^&]+)/);
                if (executeIdMatch) {
                  extractedExecuteId = executeIdMatch[1];
                }
              }
            }
            
            console.log('Extracted workflow_id:', workflowId);
            console.log('Extracted execute_id:', extractedExecuteId);
            
            // 如果成功提取到参数，使用Coze API查询
            if (workflowId && extractedExecuteId) {
              setTimeout(() => {
                queryCozeExecutionProgress(workflowId, extractedExecuteId, assistantMessageId, runtimeDuration);
              }, 10000); // 10秒后开始查询
            } else {
              // 如果无法提取参数，回退到原有的数据库轮询方式
              console.warn('无法提取workflow_id或execute_id，回退到数据库轮询方式');
              if (response.data?.run_id) {
                setTimeout(() => {
                  pollTaskStatus(response.data!.run_id, assistantMessageId);
                }, 10000);
              }
            }
          } catch (error) {
            console.error('提取参数失败:', error);
            // 出错时回退到原有的数据库轮询方式
            if (response.data?.run_id) {
              setTimeout(() => {
                pollTaskStatus(response.data!.run_id, assistantMessageId);
              }, 10000);
            }
          }
        } else {
          // 非running状态，直接显示结果
          const assistantMessage = {
            id: assistantMessageId,
            type: 'assistant' as const,
            content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2),
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // 更新WH币余额（仅在非免费应用时扣除）
          if (response.data?.remaining_balance !== undefined) {
            setWhBalance(response.data.remaining_balance);
          } else if (requiredCoins > 0) {
            setWhBalance(prev => prev - requiredCoins);
          }
          
          setRunning(false);
        }
      } else {
        toast.error(response.message || 'AI应用运行失败');
        setRunning(false);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error('发送消息失败: ' + errorMessage);
      setRunning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };





  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">AI应用不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/ai-apps')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {/* AI应用头像 */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {app.app_avatar_url ? (
              <img
                src={app.app_avatar_url}
                alt={app.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">{app.title?.charAt(0) || 'A'}</span>
            )}
          </div>
          
          {/* AI应用信息 */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{app.title}</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{app.creator?.username || 'AI助手'}</span>
              <span>·</span>
              <span>发布于 {new Date(app.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">

          <button 
            onClick={toggleFavorite}
            className={`flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-md transition-colors ${
              isFavorited ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Star className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{favoriteCount}</span>
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex">
        {/* 左侧聊天区域 */}
        <div className="flex-1 flex flex-col">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          /* 欢迎界面 */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
              {app.app_avatar_url ? (
                <img
                  src={app.app_avatar_url}
                  alt={app.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Bot className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{app.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">{app.opening_message || app.description}</p>
            
            {/* 预设问题 */}
            {app.preset_questions && app.preset_questions.length > 0 && (
              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">你可以问我：</p>
                {app.preset_questions.slice(0, 3).map((question: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                  >
                    <span className="text-gray-700 dark:text-gray-300">{question}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 消息列表 */
          messages.map((message) => (
            <div key={message.id} className={clsx(
              'flex items-start space-x-3',
              message.type === 'user' ? 'justify-end' : 'justify-start'
            )}>
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {app.app_avatar_url ? (
                    <img
                      src={app.app_avatar_url}
                      alt={app.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
              
              <div className={clsx(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-2xl',
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* 如果消息包含输出链接，显示查看结果按钮 */}
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
          ))
        )}
        
        {/* 正在输入指示器 */}
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
        {/* WH币余额不足提示（仅在付费应用时显示） */}
        {user && app && app.price > 0 && whBalance < app.price && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              WH币余额不足！需要{app.price}WH币才能发送消息，当前余额：{whBalance}WH币
            </p>
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          {/* 附件按钮 */}
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
          
          {/* 输入框 */}
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
            
            {/* 表情按钮 */}
            <Button
              variant="ghost"
              className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1"
            >
              <Smile className="w-5 h-5" />
            </Button>
          </div>
          
          {/* 发送按钮 */}
          <Button
            onClick={handleSendMessage}
            disabled={running || !inputMessage.trim() || (!!user && app && app.price > 0 && whBalance < app.price)}
            className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-2xl flex-shrink-0"
          >
            {running ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        
            {/* 底部提示 */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              内容由AI生成，无法保证真实性，仅供参考。
            </p>
          </div>
        </div>

        {/* 右侧信息栏 */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          
          {/* AI应用信息 */}
          <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {/* WH币消耗提示 */}
            <div className="flex items-center space-x-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                {app.price > 0 ? `当前的ai应用单次运行消耗${app.price}WH币` : '当前的ai应用免费使用'}
              </span>
            </div>
            
            {/* 统计信息 */}
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
                <span className="text-lg text-gray-500 dark:text-gray-400">{app?.run_count ? (app.run_count >= 1000000 ? `${(app.run_count / 1000000).toFixed(1)}M` : app.run_count >= 1000 ? `${(app.run_count / 1000).toFixed(1)}K` : app.run_count.toString()) : '0'}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 relative -top-1">使用</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <div className="flex items-center">
                <span className="text-lg text-gray-500 dark:text-gray-400">{app?.conversation_count ? (app.conversation_count >= 1000000 ? `${(app.conversation_count / 1000000).toFixed(1)}M` : app.conversation_count >= 1000 ? `${(app.conversation_count / 1000).toFixed(1)}K` : app.conversation_count.toString()) : '0'}</span>
                <span className="text-sm text-gray-400 dark:text-gray-500 relative -top-1">对话</span>
              </div>
            </div>
            
            {/* 应用描述 */}
            {app?.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {app.description}
                </p>
              </div>
            )}
          </div>
          
          {/* 社区 */}
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
            
            {/* 发帖弹窗 */}
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
                    // 这里应该实现图片上传到服务器的逻辑
                    // 为了演示，我们先使用本地URL
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
            
            {/* 社区帖子列表 */}
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