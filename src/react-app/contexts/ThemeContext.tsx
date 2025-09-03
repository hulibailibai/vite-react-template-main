import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { useAuth } from './AuthContext';

// 主题类型
export type Theme = 'dark' | 'light';

// 主题上下文接口
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark'); // 默认使用深色主题
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // 从localStorage或服务器加载主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (user) {
          // 用户已登录，从服务器获取主题偏好
          const preferences = await authApi.getUserPreferences();
          const serverTheme = preferences.theme as Theme;
          if (serverTheme && (serverTheme === 'dark' || serverTheme === 'light')) {
            setThemeState(serverTheme);
            // 同步到localStorage
            localStorage.setItem('theme', serverTheme);
          }
        } else {
          // 用户未登录，从localStorage加载
          const savedTheme = localStorage.getItem('theme') as Theme;
          if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
            setThemeState(savedTheme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        // 如果服务器请求失败，回退到localStorage
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
          setThemeState(savedTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  // 应用主题到document并保存偏好
  useEffect(() => {
    if (isLoading) return; // 等待初始加载完成
    
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // 保存到localStorage
    localStorage.setItem('theme', theme);
    
    // 如果用户已登录，同时保存到服务器
    if (user) {
      authApi.updateUserPreference('theme', theme).catch(error => {
        console.error('Failed to save theme preference to server:', error);
      });
    }
  }, [theme, user, isLoading]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 使用主题的Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;