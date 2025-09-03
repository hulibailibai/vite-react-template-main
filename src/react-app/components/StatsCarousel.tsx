import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NumberFlip from './NumberFlip';
import { HomeStats } from '../types';

interface StatsCarouselProps {}

type CarouselItem = {
  id: string;
  type: 'stats' | 'ad';
  content: React.ReactNode;
};

const StatsCarousel: React.FC<StatsCarouselProps> = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatedStats, setAnimatedStats] = useState<HomeStats>({
    onlineUsers: 15234,
    creators: 2156,
    usage: 89432,
  });

  // 生成随机递增值（1-5之间）
  const getRandomIncrement = () => Math.floor(Math.random() * 5) + 1;

  // 动态递增统计数据
  const incrementStats = useCallback(() => {
    setAnimatedStats(prevStats => ({
      onlineUsers: prevStats.onlineUsers + getRandomIncrement(),
      creators: prevStats.creators, // 保持不变
      usage: prevStats.usage, // 保持不变
    }));
  }, []);

  // 轮播项目
  const carouselItems: CarouselItem[] = [
    {
      id: 'users',
      type: 'stats',
      content: (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/80">用户:</span>
          <NumberFlip 
            value={animatedStats.onlineUsers}
            className="text-sm font-bold text-white"
            duration={600}
          />
        </div>
      )
    },
    {
      id: 'creators',
      type: 'stats',
      content: (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/80">创作者:</span>
          <span className="text-sm font-bold text-white">
            {animatedStats.creators.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      id: 'usage',
      type: 'stats',
      content: (
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white/80">使用量:</span>
          <span className="text-sm font-bold text-white">
            {animatedStats.usage.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      id: 'ad',
      type: 'ad',
      content: (
        <div className="text-center">
          <span className="text-xs font-medium text-white">
            {t('nav.limitedOffer')}
          </span>
        </div>
      )
    }
  ];

  // 自动轮播
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % carouselItems.length
      );
    }, 10000); // 10秒切换一次

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // 统计数据递增定时器
  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      incrementStats();
    }, 3000);

    const interval = setInterval(() => {
      incrementStats();
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [incrementStats]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      (prevIndex + 1) % carouselItems.length
    );
  };

  return (
    <div className="flex items-center justify-center h-full px-2">
      {/* 左箭头 */}
      <button
        onClick={goToPrevious}
        className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
        aria-label="Previous"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {/* 内容区域 */}
      <div className="flex-1 text-center mx-2">
        {carouselItems[currentIndex]?.content}
      </div>
      
      {/* 右箭头 */}
      <button
        onClick={goToNext}
        className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors duration-200"
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StatsCarousel;