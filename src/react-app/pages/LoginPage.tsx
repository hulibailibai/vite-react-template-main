import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { authApi } from '../services/api';
import { redirectByRole } from '../utils/navigation';

// Google图标组件
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// 登录页面组件
export const LoginPage: React.FC = () => {
  const { login, oauthLogin } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 处理OAuth回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const provider = window.location.pathname.includes('github') ? 'github' : 
                    window.location.pathname.includes('google') ? 'google' : null;
    
    if (code && provider) {
      handleOAuthCallback(provider as 'github' | 'google', code);
    }
  }, []);

  // 处理OAuth回调
  const handleOAuthCallback = async (provider: 'github' | 'google', code: string) => {
    try {
      setOauthLoading(true);
      const response = await oauthLogin(provider, code, 'user');
      // 根据用户角色跳转到对应页面
      if (response && response.user) {
        redirectByRole(response.user);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'OAuth登录失败，请重试' });
    } finally {
      setOauthLoading(false);
    }
  };

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除对应字段的错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = t('login.error.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('login.error.email');
    }

    if (!formData.password) {
      newErrors.password = t('login.error.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('login.error.password');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await login(formData.email, formData.password);
      // 根据用户角色跳转到对应页面
      if (response && response.user) {
        // 添加短暂延迟确保状态更新完成
        setTimeout(() => {
          redirectByRole(response.user);
        }, 100);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : '登录失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 处理OAuth登录
  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    try {
      setOauthLoading(true);
      const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
      const { authUrl } = await authApi.getOAuthUrl(provider, redirectUri);
      window.location.href = authUrl;
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : '获取授权链接失败' });
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">WF</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('login.title')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('login.subtitle')}
          </p>
        </div>

        {/* 登录表单 */}
        <Card className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 通用错误信息 */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="请输入您的邮箱地址"
                  className={clsx(
                    'pl-10',
                    errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  )}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入您的密码"
                  className={clsx(
                    'pl-10 pr-10',
                    errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  )}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  记住我
                </label>
              </div>
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? '登录中...' : '登录'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          {/* 分割线 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">或者</span>
              </div>
            </div>
          </div>

          {/* OAuth登录 */}
          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading}
              className="w-full"
            >
              <Github className="w-5 h-5 mr-2" />
              使用 GitHub 登录
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleOAuthLogin('google')}
              disabled={oauthLoading}
              className="w-full"
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              使用 Google 登录
            </Button>

            {oauthLoading && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">正在跳转到授权页面...</p>
              </div>
            )}
          </div>
        </Card>

        {/* 注册链接 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            还没有账户？{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              立即注册
            </a>
          </p>
        </div>

        {/* 服务条款 */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的{' '}
            <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              服务条款
            </a>{' '}
            和{' '}
            <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              隐私政策
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;