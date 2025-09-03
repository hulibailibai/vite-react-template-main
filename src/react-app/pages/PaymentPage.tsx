import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Shield, CheckCircle, Lock, Star, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { tokenManager } from '../services/api';
import { useAlert } from '../contexts/AlertContext';
import QRCode from 'qrcode';
// 使用Web Crypto API替代Node.js crypto模块
// 这样可以避免复杂的polyfill问题
// 注意：在实际生产环境中，建议将签名生成逻辑移到后端服务器

// 支付方式类型
type PaymentMethod = 'wechat' | 'paypal';

// 订单信息接口
interface OrderInfo {
  id: string;
  name: string;
  price: number;
  period?: string;
  description?: string;
}

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useAlert();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [, setQrCodeUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [outTradeNo, setOutTradeNo] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 从URL参数获取订单信息
    const planId = searchParams.get('planId');
    const planName = searchParams.get('planName');
    const planPrice = searchParams.get('planPrice');
    const planPeriod = searchParams.get('planPeriod');
    const planDescription = searchParams.get('planDescription');

    if (planId && planName && planPrice) {
      setOrderInfo({
        id: planId,
        name: planName,
        price: parseFloat(planPrice),
        period: planPeriod || undefined,
        description: planDescription || undefined
      });
    }
  }, [searchParams]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // 生成二维码
  const generateQRCode = async (codeUrl: string) => {
    try {
      console.log('开始生成二维码:', codeUrl);
      console.log('Canvas元素:', qrCanvasRef.current);
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, codeUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        console.log('二维码生成成功');
      } else {
        console.error('Canvas元素未找到');
      }
    } catch (error) {
      console.error('生成二维码失败:', error);
    }
  };

  // 轮询支付状态
  const pollPaymentStatus = (tradeNo: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        // 调用后端API查询支付状态
        const token = tokenManager.getToken();
        const queryHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          queryHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/wechat/pay/query/${tradeNo}`, {
          headers: queryHeaders
        });
        
        if (response.ok) {
          const result = await response.json();
          const data = result.data;
          
          console.log('支付状态查询结果:', data);
          
          // 根据支付状态更新UI
          if (data.trade_state === 'SUCCESS') {
            setPaymentStatus('success');
            clearInterval(pollIntervalRef.current!);
            setTimeout(() => {
              navigate('/membership?tab=wallet&success=true');
            }, 2000);
          } else if (data.trade_state === 'CLOSED' || data.trade_state === 'PAYERROR') {
            setPaymentStatus('failed');
            clearInterval(pollIntervalRef.current!);
          }
        } else {
          console.error('查询支付状态失败:', response.statusText);
        }
      } catch (error) {
        console.error('轮询支付状态失败:', error);
      }
    }, 3000); // 每3秒查询一次
    
    // 5分钟后停止轮询
    setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        if (paymentStatus === 'pending') {
          setPaymentStatus('failed');
        }
      }
    }, 300000);
  };

  // 检测设备类型
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // 关闭二维码弹窗
  const closeQRCode = () => {
    setShowQRCode(false);
    setQrCodeUrl('');
    setPaymentStatus('pending');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  // 计算到期时间
  const calculateExpiryDate = (period?: string) => {
    const now = new Date();
    if (period === '月') {
      now.setMonth(now.getMonth() + 1);
    } else if (period === '年') {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.');
  };

  // 汇率转换函数 (USD to CNY)
  const convertUSDToCNY = (usdAmount: number): number => {
    // 当前汇率 1 USD = 7.2 CNY (可以根据实际情况调整)
    const exchangeRate = 7.2;
    return Math.round(usdAmount * exchangeRate * 100) / 100; // 保留两位小数
  };

  // 统一支付API调用
  const callPaymentAPI = async (orderInfo: OrderInfo, paymentMethod: PaymentMethod) => {
    // 将美元价格转换为人民币
    const cnyPrice = convertUSDToCNY(orderInfo.price);
    
    // 生成合适的描述信息
    const description = orderInfo.description || `${orderInfo.name}会员`;
    
    // 生成唯一的订单号
    const outTradeNo = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      out_trade_no: outTradeNo, // 传递唯一的订单号
      id: orderInfo.id,
      name: orderInfo.name,
      price: cnyPrice, // 使用转换后的人民币价格
      period: orderInfo.period,
      description: description,
      paymentMethod: paymentMethod,
      deviceType: isMobile() ? 'mobile' : 'pc'
    };
    
    console.log(`价格转换: $${orderInfo.price} USD → ¥${cnyPrice} CNY`);

    // 获取认证token
    const token = tokenManager.getToken();
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/wechat/pay/unified', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`支付API调用失败: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  };

  // 处理支付
  const handlePayment = async () => {
    if (!orderInfo) return;
    
    setIsProcessing(true);
    
    try {
      if (selectedPaymentMethod === 'wechat') {
        console.log('发起微信支付:', orderInfo);
        
        try {
          // 调用统一支付API
          const paymentResult = await callPaymentAPI(orderInfo, 'wechat');
          console.log('支付API响应:', paymentResult);
          
          // 检查支付结果
          const data = paymentResult.data;
          
          if (isMobile()) {
            // 移动端H5支付
            const h5Url = data?.h5_url;
            if (h5Url) {
              window.location.href = h5Url;
            } else {
              throw new Error('未获取到H5支付链接');
            }
          } else {
            // PC端Native支付
            const codeUrl = data?.code_url;
            const tradeNo = data?.out_trade_no || `ORDER_${Date.now()}`;
            
            if (codeUrl) {
              setQrCodeUrl(codeUrl);
              setOutTradeNo(tradeNo);
              setShowQRCode(true);
              
              // 等待DOM更新后生成二维码
              setTimeout(async () => {
                await generateQRCode(codeUrl);
              }, 100);
              
              // 开始轮询支付状态
              pollPaymentStatus(tradeNo);
            } else {
              throw new Error('未获取到Native支付二维码');
            }
          }
          
        } catch (apiError) {
          console.error('支付API调用失败:', apiError);
          showError(`支付调用失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`);
        }
        
      } else if (selectedPaymentMethod === 'paypal') {
        // PayPal支付逻辑
        try {
          const paymentResult = await callPaymentAPI(orderInfo, 'paypal');
          console.log('PayPal支付API响应:', paymentResult);
          
          const paypalUrl = paymentResult.data?.paypal_url;
          if (paypalUrl) {
            window.location.href = paypalUrl;
          } else {
            throw new Error('未获取到PayPal支付链接');
          }
        } catch (apiError) {
          console.error('PayPal支付API调用失败:', apiError);
          showError(`PayPal支付调用失败: ${apiError instanceof Error ? apiError.message : '未知错误'}`);
        }
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      showError(`支付失败: ${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!orderInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-xl mb-4">订单信息加载中...</p>
          <Button onClick={() => navigate('/membership')} className="bg-purple-600 hover:bg-purple-700">
            返回会员页面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 顶部导航 */}
      <div className="bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-purple-200 hover:text-white hover:bg-purple-800/30 border border-purple-500/30"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回
              </Button>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <h1 className="text-xl font-bold text-white">安全支付</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-purple-300">
              <Shield className="w-4 h-4" />
              <span className="text-sm">SSL加密保护</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 订单信息 */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">订单详情</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-lg font-semibold text-white mb-2">{orderInfo.name}</h3>
                {orderInfo.period && (
                  <p className="text-purple-300 text-sm mb-4">订阅周期：{orderInfo.period === '月' ? '包月服务' : '包年服务'}</p>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">原价格</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      ${orderInfo.price}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">实付金额</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                        ¥{(orderInfo.price * 7.2).toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">汇率: 1 USD = 7.2 CNY</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {orderInfo.period && (
                <div className="flex justify-between items-center py-4 border-b border-purple-500/20">
                  <span className="text-gray-300">服务期限</span>
                  <span className="text-white font-medium">至 {calculateExpiryDate(orderInfo.period)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center py-4 border-b border-purple-500/20">
                <span className="text-gray-300">订单编号</span>
                <span className="text-purple-300 font-mono text-sm">{orderInfo.id}</span>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-400/30">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-lg font-semibold">应付总额</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                        ¥{(orderInfo.price * 7.2).toFixed(2)}
                      </span>
                      <p className="text-sm text-gray-300 mt-1">约 ${orderInfo.price} USD</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 安全提示 */}
            <div className="mt-8 p-6 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/20">
              <div className="flex items-center space-x-3 text-green-400 mb-3">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">安全支付保障</span>
              </div>
              <ul className="text-green-300 text-sm space-y-1">
                <li>• SSL加密传输，保护您的支付信息</li>
                <li>• 银行级安全防护，资金安全有保障</li>
                <li>• 7×24小时客服支持，随时为您服务</li>
              </ul>
            </div>
          </div>

          {/* 支付方式选择 */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">选择支付方式</h2>
            </div>
            
            <div className="space-y-4 mb-8">
              {/* 微信支付 */}
              <div 
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                  selectedPaymentMethod === 'wechat'
                    ? 'border-green-400 bg-gradient-to-r from-green-900/30 to-emerald-900/30 shadow-lg shadow-green-500/20'
                    : 'border-purple-500/30 hover:border-green-400/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50'
                }`}
                onClick={() => setSelectedPaymentMethod('wechat')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">微信支付</h3>
                    <p className="text-green-300 text-sm">使用微信扫码支付，安全便捷</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-xs">推荐使用</span>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'wechat' && (
                    <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* PayPal支付 */}
              <div 
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 opacity-60 ${
                  selectedPaymentMethod === 'paypal'
                    ? 'border-blue-400 bg-gradient-to-r from-blue-900/30 to-indigo-900/30'
                    : 'border-purple-500/30 hover:border-blue-400/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50'
                }`}
                onClick={() => setSelectedPaymentMethod('paypal')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">PayPal支付</h3>
                    <p className="text-blue-300 text-sm">国际支付，支持多种货币</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-yellow-400 text-xs">即将上线</span>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'paypal' && (
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 支付按钮 */}
            <div className="space-y-4">
              <Button
                className={`w-full py-6 font-bold text-xl rounded-2xl transition-all duration-300 shadow-2xl ${
                  selectedPaymentMethod === 'wechat'
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white shadow-green-500/30'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 text-white shadow-blue-500/30'
                } ${isProcessing ? 'opacity-80 cursor-not-allowed' : 'hover:scale-105 hover:shadow-3xl'}`}
                onClick={handlePayment}
                disabled={isProcessing || selectedPaymentMethod === 'paypal'}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>处理支付中...</span>
                  </div>
                ) : selectedPaymentMethod === 'paypal' ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>PayPal 即将上线</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Lock className="w-5 h-5" />
                    <span>立即安全支付 ¥{(orderInfo.price * 7.2).toFixed(2)}</span>
                  </div>
                )}
              </Button>
              
              {/* 支付保障 */}
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>即时到账</span>
                </div>
                <div className="flex items-center space-x-2 text-purple-400">
                  <Shield className="w-4 h-4" />
                  <span>安全保障</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-400">
                  <Lock className="w-4 h-4" />
                  <span>加密传输</span>
                </div>
              </div>
            </div>
            
            {/* 支付说明 */}
            <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-purple-500/20">
              <p className="text-gray-300 text-sm text-center leading-relaxed">
                点击支付即表示您同意WorkflowHub的
                <span className="text-purple-400 underline cursor-pointer hover:text-purple-300 transition-colors">服务协议</span> 和 
                <span className="text-purple-400 underline cursor-pointer hover:text-purple-300 transition-colors">隐私政策</span>
                <br />
                <span className="text-gray-400 text-xs mt-2 block">我们承诺保护您的隐私，所有交易均采用银行级加密技术</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 二维码支付弹窗 */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <span>微信支付</span>
              </h3>
              <button
                onClick={closeQRCode}
                className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
                <canvas
                  ref={qrCanvasRef}
                  className="mx-auto"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <div className={`w-3 h-3 rounded-full ${paymentStatus === 'pending' ? 'bg-green-400 animate-pulse' : paymentStatus === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    {paymentStatus === 'pending' && '等待支付中...'}
                    {paymentStatus === 'success' && '支付成功！'}
                    {paymentStatus === 'failed' && '支付失败'}
                  </span>
                </div>
                
                <div className="text-gray-300 text-sm space-y-2">
                  <p>请使用微信扫描上方二维码完成支付</p>
                  <p className="text-xs text-gray-400">订单号：{outTradeNo}</p>
                </div>
                
                {paymentStatus === 'success' && (
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">支付成功</span>
                    </div>
                    <p className="text-green-300 text-sm">正在跳转到钱包页面...</p>
                  </div>
                )}
                
                {paymentStatus === 'failed' && (
                  <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 rounded-xl p-4 border border-red-500/20">
                    <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                      <X className="w-5 h-5" />
                      <span className="font-semibold">支付失败</span>
                    </div>
                    <p className="text-red-300 text-sm">请重新尝试支付</p>
                  </div>
                )}
                
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-400 pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>安全支付</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>加密传输</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;