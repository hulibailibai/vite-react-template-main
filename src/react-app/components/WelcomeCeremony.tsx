import React, { useState, useEffect } from 'react';
import { CheckCircle, Gift, TrendingUp } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

interface WelcomeCeremonyProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'new_user' | 'first_login';
}

export const WelcomeCeremony: React.FC<WelcomeCeremonyProps> = ({
  isOpen,
  onClose,
  userType = 'new_user'
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 自动播放欢迎动画
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = async () => {
    try {
      // 标记用户已看过欢迎仪式
      await authApi.updateUserSettings({
        welcome_shown: true
      });
    } catch (error) {
      console.error('Failed to update welcome status:', error);
    }
    
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExplore = () => {
    handleClose();
    window.location.href = '/coze-workflows';
  };

  const handleGetStarted = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const welcomeTitle = userType === 'new_user' 
    ? '🎉 欢迎加入工作流分享平台！' 
    : '👋 欢迎回来！';

  const welcomeMessage = userType === 'new_user'
    ? `欢迎您，${user?.username}！感谢您加入我们的平台。`
    : `欢迎回来，${user?.username}！很高兴再次见到您。`;



  const features = [
    {
      icon: <Gift className="w-6 h-6 text-purple-600" />,
      title: '发现精品工作流',
      description: '浏览数千个高质量的工作流模板，提升工作效率'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      title: '个性化推荐',
      description: '基于您的兴趣和需求，为您推荐最合适的工作流'
    }
  ];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* 生态框弹窗 */}
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 弹窗头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{welcomeTitle}</h2>
                <p className="text-blue-100 text-sm">{welcomeMessage}</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 弹窗内容区域 */}
        <div className="p-6">
          {/* 欢迎内容区域 */}
          <div className="mb-6">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3 transform transition-all duration-700 ${
                currentStep >= 1 ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                探索平台特色功能
              </h3>
            </div>
            {/* 功能亮点 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg bg-gray-50 border border-gray-200 transform transition-all duration-500 delay-${index * 100} ${
                    currentStep >= 1 ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      {feature.title}
                    </h5>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center space-x-3 mt-6">
              <Button
                variant="outline"
                className="px-6 py-2 text-sm"
                onClick={handleExplore}
              >
                浏览工作流
              </Button>
              <Button
                variant="primary"
                className="px-6 py-2 text-sm"
                onClick={handleGetStarted}
              >
                开始使用
              </Button>
            </div>

            {/* 底部提示 */}
            <p className="text-xs text-gray-500 text-center mt-4">
              您可以随时在个人设置中查看平台使用指南
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCeremony;