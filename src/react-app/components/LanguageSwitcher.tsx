import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

// 语言选项
const LANGUAGE_OPTIONS = [
  {
    code: 'en' as Language,
    name: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'zh' as Language,
    name: '中文',
    flag: '🇨🇳',
  },
];

// 语言切换器组件
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 获取当前语言选项
  const currentLanguage = LANGUAGE_OPTIONS.find(option => option.code === language) || LANGUAGE_OPTIONS[0];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理语言切换
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <div className={clsx('relative', className)} ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-4 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-200 group w-full"
        aria-label="Change language"
      >
        <div className="group-hover:scale-110 transition-transform duration-200">
          <Globe className="w-5 h-5" />
        </div>
        <span className="flex-1 text-left">{currentLanguage.name}</span>
        <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-1 z-50">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              onClick={() => handleLanguageChange(option.code)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors',
                language === option.code
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-300 hover:bg-gray-700'
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{option.flag}</span>
                <span>{option.name}</span>
              </div>
              {language === option.code && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;