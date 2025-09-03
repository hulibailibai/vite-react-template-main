import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { 
  Search, 
  User, 
  Menu, 
  X, 
  Home,
  Crown,
  Bell,
  Smartphone,
  Gift,
  Bot,
  Workflow,
  Users,
  LogOut,
  Sun,
  Moon,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMembershipStatus } from '../hooks/useMembershipStatus';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import StatsCarousel from './StatsCarousel';
import { LoginModal } from './LoginModal';

// 导航链接接口
interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
}

// 侧边栏组件
export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  // const { user } = useAuth(); // 暂时注释掉未使用的用户变量
  const [showQRCode, setShowQRCode] = useState(false);
  
  // 获取当前路径
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  
  const sideNavLinks: NavLink[] = [
    { label: t('nav.home'), href: '/', icon: <Home className="w-5 h-5" />, active: currentPath === '/' },
    { label: t('nav.coze'), href: '/coze-workflows', icon: <Workflow className="w-5 h-5" />, active: currentPath === '/coze-workflows' },
    { label: t('nav.taskHall'), href: '/task-hall', icon: <CheckSquare className="w-5 h-5" />, active: currentPath === '/task-hall' },
    { label: t('nav.creator'), href: '/creator', icon: <Users className="w-5 h-5" />, active: currentPath === '/creator' },
    { label: t('nav.profile'), href: '/profile', icon: <User className="w-5 h-5" />, active: currentPath === '/profile' },
  ];



  // 用户相关链接已移除，保留变量定义以备将来使用
  // const userLinks: NavLink[] = user ? [...] : [];

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* 侧边栏 */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900/95 backdrop-blur-sm shadow-lg transform transition-transform duration-300 z-50 flex flex-col',
        'md:fixed md:top-16 md:left-0 md:h-[calc(100vh-4rem)] md:translate-x-0 md:shadow-none md:border-r md:border-gray-200 dark:md:border-gray-700',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* 侧边栏头部 - 仅在移动端显示logo和关闭按钮 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WF</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t('brand.name')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* 导航内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 主导航 */}
          <div className="mb-6">
            <nav className="space-y-3">
              {sideNavLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center space-x-4 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 group',
                    link.active
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 border-r-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  )}
                  onClick={onClose}
                >
                  <div className={clsx(
                    'group-hover:scale-110 transition-transform duration-200',
                    link.active && 'text-blue-600 dark:text-blue-400'
                  )}>
                    {link.icon}
                  </div>
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>

          {/* 分隔线 */}
          <div className="mx-4 my-6 border-t border-gray-200 dark:border-gray-700"></div>
          
          {/* 通知、主题切换和语言切换 */}
          <div className="mb-6">
            <nav className="space-y-3">
              <button className="flex items-center space-x-4 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 group w-full">
                <div className="group-hover:scale-110 transition-transform duration-200">
                  <Bell className="w-5 h-5" />
                </div>
                <span>{t('nav.notifications')}</span>
              </button>
              
              {/* 主题切换按钮 */}
              <button 
                onClick={toggleTheme}
                className="flex items-center space-x-4 px-4 py-3 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 group w-full"
              >
                <div className="group-hover:scale-110 transition-transform duration-200">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </div>
                <span>{theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}</span>
              </button>
            </nav>
            <div className="mt-3">
               <LanguageSwitcher />
             </div>
          </div>
        </div>

        {/* 侧边栏底部 - 固定在最底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3 flex-shrink-0">
          {/* 微信小程序 */}
          <div className="relative">
            <div 
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-300 dark:text-gray-200 hover:text-blue-400 hover:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              onMouseEnter={() => setShowQRCode(true)}
              onMouseLeave={() => setShowQRCode(false)}
            >
              <Smartphone className="w-5 h-5" />
              <span>{t('nav.wechatMiniProgram')}</span>
            </div>
            
            {/* 二维码悬浮框 */}
            {showQRCode && (
              <div className="absolute left-full ml-2 top-0 bg-gray-800 dark:bg-gray-700 border border-gray-600 dark:border-gray-500 rounded-lg shadow-lg p-4 z-50 w-48">
                <div className="text-center">
                  <img 
                    src="/image/小程序码.png" 
                    alt="Iron Man贾维斯小程序码" 
                    className="w-32 h-32 mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-300 dark:text-gray-200 font-medium">{t('nav.miniProgramName')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-1">{t('nav.scanToExperience')}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* 邀请好友赚WH币 */}
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-3 cursor-pointer hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-sm">
            <div className="flex items-center space-x-2 text-white">
              <div className="bg-white bg-opacity-20 rounded-full p-1.5">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{t('nav.inviteFriends')}</div>
                <div className="text-xs opacity-90">{t('nav.inviteReward')}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// 顶部导航组件
export const TopNavigation: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isValidMember } = useMembershipStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDesktopUserDropdown, setShowDesktopUserDropdown] = useState(false);
  const [showMobileUserDropdown, setShowMobileUserDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // 处理点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setShowDesktopUserDropdown(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setShowMobileUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理退出登录
  const handleDesktopLogout = () => {
    logout();
    setShowDesktopUserDropdown(false);
    window.location.href = '/';
  };

  const handleMobileLogout = () => {
    logout();
    setShowMobileUserDropdown(false);
    window.location.href = '/';
  };

  return (
    <>
      {/* 桌面端导航栏 */}
      <nav className="hidden md:block bg-white dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-2 sm:px-4">
          <div className="flex items-center h-16 relative">
            {/* 左侧区域：汉堡菜单和Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* 汉堡菜单按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Logo和网站名称 */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WF</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('brand.name')}
                </span>
              </div>
            </div>
            
            {/* 中间区域：搜索栏 (绝对居中) */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-[120px] sm:max-w-[160px] md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl px-4">
              {/* 搜索栏 */}
              <div className="w-full">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('nav.search.placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 w-full"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </form>
              </div>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-3 flex-shrink-0 ml-auto">
              {/* 轮播区域 - 在小屏幕时隐藏 */}
              <div className="hidden lg:block">
                <StatsCarousel />
              </div>
              
              {/* 会员相关按钮 */}
              {user && (
                isValidMember ? (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/membership?tab=wallet'}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    {t('nav.myWallet')}
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => window.location.href = '/membership'}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium"
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    {t('nav.upgrade')}
                  </Button>
                )
              )}

              {/* 登录/用户信息 */}
              {user ? (
                <div className="relative" ref={desktopDropdownRef}>
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.username}
                      className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                      onClick={() => setShowDesktopUserDropdown(!showDesktopUserDropdown)}
                    />
                  </div>
                  
                  {/* 桌面端用户下拉菜单 */}
                  {showDesktopUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50">
                      <a
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowDesktopUserDropdown(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        {t('nav.profile')}
                      </a>
                      <hr className="my-1" />
                      <button
                        onClick={handleDesktopLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                >
                  {t('common.login')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 移动端导航栏 */}
      <nav className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            {/* 左侧汉堡菜单 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* 中间Logo和名称 */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WF</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {t('brand.name')}
              </span>
            </div>

            {/* 右侧登录 */}
            {user ? (
              <div className="relative" ref={mobileDropdownRef}>
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.username}
                  className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                  onClick={() => setShowMobileUserDropdown(!showMobileUserDropdown)}
                />
                
                {/* 移动端用户下拉菜单 */}
                {showMobileUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50">
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowMobileUserDropdown(false)}
                    >
                      <User className="w-4 h-4 mr-3" />
                      {t('nav.profile')}
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={handleMobileLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowLoginModal(true)}
                className="text-sm"
              >
                {t('nav.login')}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* 登录模态框 */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        autoTriggerWechat={true}
      />
    </>
  );
};

// 底部TabBar组件（移动端）
export const BottomTabBar: React.FC = () => {
  const { t } = useLanguage();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  const tabItems = [
    { label: t('nav.home'), href: '/', icon: <Home className="w-5 h-5" />, active: currentPath === '/' },
    { label: t('nav.aiApps'), href: '/ai-apps', icon: <Bot className="w-5 h-5" />, active: currentPath === '/ai-apps' },
    { label: t('任务大厅'), href: '/task-hall', icon: <CheckSquare className="w-5 h-5" />, active: currentPath === '/task-hall' },
    { label: t('nav.creator'), href: '/creator', icon: <Users className="w-5 h-5" />, active: currentPath === '/creator' },
    { label: t('nav.my'), href: '/profile', icon: <User className="w-5 h-5" />, active: currentPath === '/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-40">
      <div className="flex">
        {tabItems.map((item) => {
          return (
            <a
              key={item.href}
              href={item.href}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors',
                item.active
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
              )}
            >
              <div className={clsx(
                'mb-1',
                item.active ? 'text-blue-500 dark:text-blue-400 scale-110' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.icon}
              </div>
              <span className={clsx(
                'text-xs font-medium',
                item.active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// 主布局组件
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const handleMenuClick = () => {
    // 移动端：打开侧边栏
    // 桌面端：切换侧边栏显示状态
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <TopNavigation onMenuClick={handleMenuClick} />
      
      <div className="flex">
        {/* 桌面端侧边栏 */}
        {isDesktopSidebarOpen && (
          <div className="hidden md:block">
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>
        )}
        
        {/* 移动端侧边栏 */}
        <div className="md:hidden">
          <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
        </div>
        
        {/* 主内容区域 */}
        <main className={clsx(
          "flex-1 transition-all duration-300",
          isDesktopSidebarOpen ? "md:ml-64" : "md:ml-0"
        )}>
          <div className="pb-16 md:pb-0"> {/* 为移动端底部tabbar留出空间 */}
            {children}
          </div>
        </main>
      </div>
      
      {/* 移动端底部TabBar */}
      <BottomTabBar />
    </div>
  );
};

export default TopNavigation;