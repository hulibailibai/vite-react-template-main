import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { redirectByRole } from '../utils/navigation';

interface OAuthCallbackPageProps {
  provider: 'github' | 'google' | 'wechat';
}

export const OAuthCallbackPage: React.FC<OAuthCallbackPageProps> = ({ provider }) => {
  const { oauthLogin } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'retrying'>('loading');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [hasExecuted, setHasExecuted] = useState(false);

  useEffect(() => {
    // 防止重复执行
    if (hasExecuted) {
      return;
    }
    
    const handleCallback = async () => {
      setHasExecuted(true);
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('用户取消了授权或授权失败');
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('未收到授权码，请重试');
          return;
        }

        // 从localStorage获取角色选择（如果有）
        const selectedRole = localStorage.getItem('oauth_selected_role') || 'user';
        localStorage.removeItem('oauth_selected_role');

        // 监听重试过程
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('OAuth登录尝试')) {
            const match = message.match(/OAuth登录尝试 (\d+)\/(\d+)/);
            if (match) {
              const current = parseInt(match[1]);
              const total = parseInt(match[2]);
              setRetryCount(current - 1);
              if (current > 1) {
                setStatus('retrying');
                setMessage(`连接失败，正在重试 (${current - 1}/${total - 1})...`);
              }
            }
          } else if (message.includes('等待') && message.includes('秒后重试')) {
            setMessage('等待 3 秒后重试...');
          }
          originalConsoleLog(...args);
        };

        try {
          const response = await oauthLogin(provider, code, selectedRole);
          setStatus('success');
          setMessage('登录成功！正在跳转...');
          
          // 延迟跳转到对应角色页面
          setTimeout(() => {
            if (response && response.user) {
              // 对于微信授权，如果是从创作者页面发起的，直接跳转到创作者页面
              if (provider === 'wechat') {
                const state = urlParams.get('state');
                if (state === 'withdraw' || response.user.role === 'creator') {
                  window.location.href = '/creator';
                  return;
                }
              }
              redirectByRole(response.user);
            } else {
              window.location.href = '/';
            }
          }, 2000);
        } catch (error) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'OAuth认证失败');
        } finally {
          // 恢复原始的console.log
          console.log = originalConsoleLog;
        }
      } catch (error) {
        setStatus('error');
        setMessage('处理授权回调时发生错误');
        console.error('OAuth callback error:', error);
      }
    };

    handleCallback();
  }, [provider, oauthLogin, hasExecuted]);

  const getProviderName = () => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'google':
        return 'Google';
      case 'wechat':
        return '微信';
      default:
        return provider;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">WF</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getProviderName()} 授权
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            正在处理您的授权信息...
          </p>
        </div>

        <Card className="p-8">
          <div className="text-center">
            {(status === 'loading' || status === 'retrying') && (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    {status === 'loading' ? '正在验证授权信息...' : message}
                  </p>
                  {status === 'retrying' && (
                    <div className="mt-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        系统将自动重试，请稍候...
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(retryCount / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">登录成功！</h3>
                  <p className="text-gray-600 dark:text-gray-300">{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">授权失败</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
                  <div className="space-y-2">
                    <a
                      href="/register"
                      className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      重新注册
                    </a>
                    <a
                      href="/login"
                      className="inline-block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      返回登录
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// GitHub回调页面
export const GitHubCallbackPage: React.FC = () => {
  return <OAuthCallbackPage provider="github" />;
};

// Google回调页面
export const GoogleCallbackPage: React.FC = () => {
  return <OAuthCallbackPage provider="google" />;
};

// 微信回调页面
export const WechatCallbackPage: React.FC = () => {
  return <OAuthCallbackPage provider="wechat" />;
};

export default OAuthCallbackPage;