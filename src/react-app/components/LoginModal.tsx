import React, { useState, useEffect } from 'react';
import { X, QrCode, XCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoTriggerWechat?: boolean;
}

type LoginMethod = 'wechat' | 'sms' | 'password';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, autoTriggerWechat = false }) => {
  const { } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('wechat');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrCodeLoading, setQrCodeLoading] = useState<boolean>(false);

  const [scanStatus, setScanStatus] = useState<'waiting' | 'scanned' | 'confirmed' | 'expired'>('waiting');

  // 生成微信登录二维码
  const generateWechatQRCode = async () => {
    setQrCodeLoading(true);
    setScanStatus('waiting');
    try {
      // 生成唯一的二维码ID
      const qrId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // 构建微信登录URL，包含state参数用于标识二维码
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/wechat/callback');
      const wechatLoginUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=wx3cb32b212d933aa0&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${qrId}#wechat_redirect`;
      
      // 调用后端API获取微信二维码ticket
      const response = await fetch('/api/auth/wechat/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene: qrId,
          redirectUrl: wechatLoginUrl
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // 使用微信官方二维码显示接口
        const qrCodeImageUrl = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${data.ticket}`;
        setQrCodeUrl(qrCodeImageUrl);
      } else {
        // 如果后端API不可用，回退到直接显示微信登录页面的二维码
        // 这里使用微信官方的二维码生成接口
        const qrCodeImageUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=wx3cb32b212d933aa0&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${qrId}&href=data:text/css;base64,LmltcG93ZXJCb3ggLnFyY29kZSB7d2lkdGg6IDIwMHB4O30KLmltcG93ZXJCb3ggLnRpdGxlIHtkaXNwbGF5OiBub25lO30KLmltcG93ZXJCb3ggLmluZm8ge3dpZHRoOiAyMDBweDt9Ci5zdGF0dXNfaWNvbiB7ZGlzcGxheTogbm9uZX0KLmltcG93ZXJCb3gge3dpZHRoOiAyMDBweDsgaGVpZ2h0OiAyMDBweDt9`;
        setQrCodeUrl(qrCodeImageUrl);
      }
      
      // 开始轮询检查扫码状态
      startQRCodePolling(qrId);
    } catch (error) {
      console.error('生成二维码失败:', error);
      // 错误处理：使用微信官方登录页面作为备选方案
      const qrId = 'qr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const redirectUri = encodeURIComponent('https://www.ai757.cn/auth/wechat/callback');
      const qrCodeImageUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=wx3cb32b212d933aa0&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${qrId}&href=data:text/css;base64,LmltcG93ZXJCb3ggLnFyY29kZSB7d2lkdGg6IDIwMHB4O30KLmltcG93ZXJCb3ggLnRpdGxlIHtkaXNwbGF5OiBub25lO30KLmltcG93ZXJCb3ggLmluZm8ge3dpZHRoOiAyMDBweDt9Ci5zdGF0dXNfaWNvbiB7ZGlzcGxheTogbm9uZX0KLmltcG93ZXJCb3gge3dpZHRoOiAyMDBweDsgaGVpZ2h0OiAyMDBweDt9`;
      setQrCodeUrl(qrCodeImageUrl);
      startQRCodePolling(qrId);
    } finally {
      setQrCodeLoading(false);
    }
  };

  // 轮询检查二维码扫描状态
  const startQRCodePolling = (qrId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // TODO: 调用后端API检查二维码状态
        // 这里暂时使用模拟逻辑
        const elapsed = Date.now() - parseInt(qrId.split('_')[1]);
        
        if (elapsed > 300000) { // 5分钟后过期
          setScanStatus('expired');
          clearInterval(pollInterval);
        }
        // 实际项目中，这里应该调用后端API检查扫码状态
        // const response = await fetch(`/api/auth/wechat/qr-status/${qrId}`);
        // const data = await response.json();
        // setScanStatus(data.status);
        
      } catch (error) {
        console.error('检查二维码状态失败:', error);
      }
    }, 2000); // 每2秒检查一次

    // 清理定时器
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000); // 5分钟后停止轮询
  };

  // 自动生成微信登录二维码
  useEffect(() => {
    if (isOpen && (autoTriggerWechat || loginMethod === 'wechat')) {
      generateWechatQRCode();
    }
  }, [isOpen, autoTriggerWechat, loginMethod]);

  if (!isOpen) return null;

  // 发送验证码
  const handleSendCode = () => {
    if (!phoneNumber.trim()) {
      alert('请输入手机号');
      return;
    }
    // TODO: 实现发送验证码逻辑
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 处理登录
  const handleLogin = () => {
    if (loginMethod === 'sms') {
      if (!phoneNumber.trim() || !verificationCode.trim()) {
        alert('请输入手机号和验证码');
        return;
      }
      // TODO: 实现验证码登录逻辑
    } else if (loginMethod === 'password') {
      if (!phoneNumber.trim() || !password.trim()) {
        alert('请输入手机号和密码');
        return;
      }
      // TODO: 实现密码登录逻辑
    }
    // TODO: 实现登录成功后的处理
    console.log('登录方式:', loginMethod, { phoneNumber, verificationCode, password });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 transition-opacity bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* 登录模态框 */}
      <div className="relative w-full max-w-3xl overflow-hidden text-left transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex min-h-[500px]">
            {/* 左侧品牌区域 */}
            <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 relative overflow-hidden">
              {/* 背景装饰 */}
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
              </div>
              
              {/* 品牌内容 */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full p-8 text-white">
                {/* Logo */}
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-3xl font-bold text-white">AI</span>
                </div>
                
                {/* 品牌名称 */}
                <h1 className="text-4xl font-bold mb-4 tracking-wide">
                  AI757
                </h1>
                
                {/* 品牌描述 */}
                <p className="text-lg text-white/90 text-center leading-relaxed max-w-sm">
                  智能创作平台
                </p>
                <p className="text-sm text-white/80 text-center mt-2 max-w-sm">
                  探索AI的无限可能，开启智能创作新时代
                </p>
              </div>
            </div>
            
            {/* 右侧登录区域 */}
            <div className="w-full md:w-3/5 p-8 flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
                {/* 移动端品牌标识 */}
                <div className="md:hidden text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">AI</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI757</h2>
                  <p className="text-gray-600 dark:text-gray-400">智能创作平台</p>
                </div>

                {/* 微信扫码登录标题 */}
                {loginMethod === 'wechat' && (
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">微信扫码登录</h3>
                  </div>
                )}

                {/* 验证码和密码登录的选项卡 */}
                {(loginMethod === 'sms' || loginMethod === 'password') && (
                  <div className="flex justify-center space-x-8 mb-8">
                    <button
                      onClick={() => setLoginMethod('sms')}
                      className={`pb-3 text-base font-medium transition-all duration-200 ${
                        loginMethod === 'sms'
                          ? 'text-gray-900 dark:text-white border-b-2 border-green-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      验证码登录
                    </button>
                    <button
                      onClick={() => setLoginMethod('password')}
                      className={`pb-3 text-base font-medium transition-all duration-200 ${
                        loginMethod === 'password'
                          ? 'text-gray-900 dark:text-white border-b-2 border-green-500'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      密码登录
                    </button>
                  </div>
                )}

                {/* 登录内容区域 */}
                <div className="space-y-4">
                  {loginMethod === 'wechat' && (
                    <div className="text-center">
                      {/* 微信二维码区域 */}
                      <div className="w-56 h-56 mx-auto mb-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                        {qrCodeLoading ? (
                          <div className="text-center">
                            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">生成二维码中...</p>
                          </div>
                        ) : qrCodeUrl ? (
                          <div className="text-center">
                            <div className="relative">
                              {qrCodeUrl.includes('showqrcode?ticket=') ? (
                                <img 
                                  src={qrCodeUrl} 
                                  alt="微信登录二维码" 
                                  className={`w-48 h-48 mx-auto mb-2 rounded-lg transition-opacity duration-300 ${
                                    scanStatus === 'expired' ? 'opacity-50' : 'opacity-100'
                                  }`}
                                />
                              ) : (
                                <iframe 
                                  src={qrCodeUrl}
                                  width="200"
                                  height="200"
                                  frameBorder="0"
                                  scrolling="no"
                                  className={`mx-auto mb-2 rounded-lg transition-opacity duration-300 ${
                                    scanStatus === 'expired' ? 'opacity-50' : 'opacity-100'
                                  }`}
                                  title="微信登录二维码"
                                />
                              )}
                              {scanStatus === 'expired' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                  <div className="text-center">
                                    <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                                    <p className="text-sm text-white">二维码已过期</p>
                                  </div>
                                </div>
                              )}
                              {scanStatus === 'scanned' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-80 rounded-lg">
                                  <div className="text-center">
                                    <CheckCircle className="w-12 h-12 text-white mx-auto mb-2" />
                                    <p className="text-sm text-white">扫描成功</p>
                                  </div>
                                </div>
                              )}
                            </div>
                           
                            {scanStatus === 'scanned' && (
                              <p className="text-sm text-green-600 dark:text-green-400">请在手机上确认登录</p>
                            )}
                            {scanStatus === 'confirmed' && (
                              <p className="text-sm text-green-600 dark:text-green-400">登录成功，正在跳转...</p>
                            )}
                            {scanStatus === 'expired' && (
                              <div className="mt-2">
                                <p className="text-sm text-red-600 dark:text-red-400 mb-2">二维码已过期</p>
                                <button 
                                  onClick={generateWechatQRCode}
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  点击刷新
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center cursor-pointer" onClick={generateWechatQRCode}>
                            <QrCode className="w-32 h-32 text-gray-800 dark:text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">点击生成二维码</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {loginMethod === 'sms' && (
                    <div className="space-y-4">
                      {/* 手机号输入 */}
                      <div className="relative w-full">
                        <div className="absolute left-0 top-0 h-full flex items-center px-3 bg-gray-50 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-500 rounded-l-lg z-10">
                          <span className="text-gray-600 dark:text-gray-300 text-base font-medium">+86</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="请输入手机号"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full h-12 text-base pl-16"
                          size="lg"
                        />
                      </div>
                      
                      {/* 验证码输入 */}
                      <div className="relative w-full">
                        <Input
                          type="text"
                          placeholder="请输入验证码"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full h-12 text-base pr-28"
                          size="lg"
                        />
                        <div className="absolute right-0 top-0 h-full flex items-center">
                          <div className="w-px h-8 bg-gray-300 dark:bg-gray-500 mx-2"></div>
                          <button
                            onClick={handleSendCode}
                            disabled={countdown > 0}
                            className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base whitespace-nowrap"
                          >
                            {countdown > 0 ? `${countdown}s` : '发送验证码'}
                          </button>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleLogin}
                        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium text-base rounded-full"
                      >
                        立即登录
                      </Button>
                    </div>
                  )}

                  {loginMethod === 'password' && (
                    <div className="space-y-4">
                      {/* 手机号输入 */}
                      <div className="relative w-full">
                        <div className="absolute left-0 top-0 h-full flex items-center px-3 bg-gray-50 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-500 rounded-l-lg z-10">
                          <span className="text-gray-600 dark:text-gray-300 text-base font-medium">+86</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="请输入手机号"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full h-12 text-base pl-16"
                          size="lg"
                        />
                      </div>
                      
                      {/* 密码输入 */}
                      <div className="w-full">
                        <Input
                          type="password"
                          placeholder="请输入密码"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-12 text-base pr-12"
                          size="lg"
                          showPasswordToggle={true}
                        />
                      </div>
                      
                      <Button
                        onClick={handleLogin}
                        className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium text-base rounded-full"
                      >
                        立即登录
                      </Button>
                    </div>
                  )}
                </div>

                {/* 底部提示和其他登录方式 */}
                <div className="mt-6 text-center space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    登录即代表同意 
                    <a href="#" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">用户协议</a> 和 
                    <a href="#" className="text-teal-600 hover:text-teal-700 dark:text-teal-400">隐私政策</a>
                  </p>
                  
                  {/* 其他登录方式 */}
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">其他登录方式</p>
                    <div className="flex justify-center space-x-6">
                      {loginMethod === 'wechat' ? (
                        // 微信登录时显示验证码和密码登录选项
                        <>
                          <button
                            onClick={() => setLoginMethod('sms')}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            验证码登录
                          </button>
                          <button
                            onClick={() => setLoginMethod('password')}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                          >
                            密码登录
                          </button>
                        </>
                      ) : (
                        // 验证码或密码登录时只显示微信登录
                        <button
                          onClick={() => setLoginMethod('wechat')}
                          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>微信登录</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};