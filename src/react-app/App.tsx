// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';
import { MainLayout } from './components/NewNavigation';
import { AdminLayout } from './components/AdminLayout';
import HomePage from './pages/HomePage';
import { WorkflowDetailPage } from './pages/coze_WorkflowDetailPage';
import { CozeWorkflowRunPage } from './pages/CozeWorkflowRunPage';
import CategoryPage from './pages/CategoryPage';
// import SearchPage from './pages/SearchPage'; // 已移除workflows表依赖
import ProfilePage from './pages/ProfilePage';
import CreatorPage from './pages/CreatorPage';
import CreatorUploadPage from './pages/CreatorUploadPage';
import CreatorWorkflowEditPage from './pages/CreatorWorkflowEditPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { GitHubCallbackPage, GoogleCallbackPage, WechatCallbackPage } from './pages/OAuthCallbackPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCozeWorkflowPage } from './pages/AdminCozeWorkflowPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminCreatorsPage } from './pages/AdminCreatorsPage';
import { AdminCreatorApplicationsPage } from './pages/AdminCreatorApplicationsPage';
import { AdminCreatorEarningsPage } from './pages/AdminCreatorEarningsPage';
import { AdminCreatorLevelsPage } from './pages/AdminCreatorLevelsPage';
import AdminCommissionPage from './pages/admin/AdminCommissionPage';
import AdminCommissionProgressPage from './pages/admin/AdminCommissionProgressPage';
import AdminCommissionEditPage from './pages/admin/AdminCommissionEditPage';
import AdminInitialCommissionPage from './pages/admin/AdminInitialCommissionPage';
import AdminRealCommissionPage from './pages/admin/AdminRealCommissionPage';
import AdminTasksPage from './pages/AdminTasksPage';
import { AdminTaskCreatePage } from './pages/AdminTaskCreatePage';
import { AdminTaskSubmissionsPage } from './pages/AdminTaskSubmissionsPage';
import { AdminTaskDetailPage } from './pages/AdminTaskDetailPage';
import { AdminVideoTasksPage } from './pages/AdminVideoTasksPage';
import { AdminSharedServersPage } from './pages/AdminSharedServersPage';
// import TasksPage from './pages/TasksPage'; // 已移除，使用TaskHallPage替代
// import TaskDetailPage from './pages/TaskDetailPage'; // 已移除
import TaskHallPage from './pages/TaskHallPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import { AdvertiserPage } from './pages/AdvertiserPage';
import BecomeCreatorPage from './pages/BecomeCreatorPage';
import WorkflowsPage from './pages/coze_WorkflowsPage';
import MembershipPage from './pages/MembershipPage';
import PaymentPage from './pages/PaymentPage';
import WalletPage from './pages/WalletPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});



// 应用内容组件（需要在AuthProvider内部使用）
const AppContent: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
              {/* 前台页面 - 使用MainLayout */}
              <Route path="/" element={
                <HomePage />
              } />
             
              <Route path="/coze-workflows" element={
                <MainLayout>
                  <WorkflowsPage />
                  <Footer />
                </MainLayout>
              } />
              <Route path="/coze-workflow/:id" element={
                <MainLayout>
                  <WorkflowDetailPage />
                  <Footer />
                </MainLayout>
              } />
              <Route path="/coze-workflow/:id/run" element={
                <CozeWorkflowRunPage />
              } />
              <Route path="/category/:id" element={
                <MainLayout>
                  <CategoryPage />
                  <Footer />
                </MainLayout>
              } />
              {/* <Route path="/search" element={
                <MainLayout>
                  <SearchPage />
                  <Footer />
                </MainLayout>
              } /> */} {/* 已移除workflows表依赖 */}
              <Route path="/profile" element={
                <MainLayout>
                  <ProfilePage />
                  <Footer />
                </MainLayout>
              } />
              <Route path="/creator" element={
                <MainLayout>
                  <CreatorPage />
                  <Footer />
                </MainLayout>
              } />
              <Route path="/tasks" element={
                <MainLayout>
                  <TaskHallPage />
                  <Footer />
                </MainLayout>
              } />
              <Route path="/task-hall" element={
                <MainLayout>
                  <TaskHallPage />
                  <Footer />
                </MainLayout>
              } />
              {/* TaskDetailPage路由已移除 */}
              <Route path="/my-submissions" element={
                <ProtectedRoute>
                  <MainLayout>
                    <MySubmissionsPage />
                    <Footer />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/creator/upload" element={
                <ProtectedRoute requiredRole="creator">
                  <CreatorUploadPage />
                </ProtectedRoute>
              } />
              <Route path="/creator/edit-coze-workflow/:id" element={
                <ProtectedRoute requiredRole="creator">
                  <CreatorWorkflowEditPage />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/become-creator" element={<BecomeCreatorPage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <MainLayout>
                    <WalletPage />
                    <Footer />
                  </MainLayout>
                </ProtectedRoute>
              } />
              <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/auth/wechat/callback" element={<WechatCallbackPage />} />
              
              {/* 管理员页面 - 使用AdminLayout */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="仪表盘" description="">
                    <AdminDashboardPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="用户管理" description="管理平台用户信息和权限">
                    <AdminUsersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* 扣子工作流管理路由 */}
              <Route path="/admin/coze-workflows" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="扣子工作流列表" description="管理平台扣子工作流">
                    <AdminCozeWorkflowPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/coze-workflows/pending" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="待审核工作流" description="审核待发布的扣子工作流">
                    <AdminCozeWorkflowPage defaultStatus="pending" />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/coze-workflows/published" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="已发布工作流" description="管理已发布的扣子工作流">
                    <AdminCozeWorkflowPage defaultStatus="approved" />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/coze-workflows/archived" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="已下架工作流" description="管理已下架的扣子工作流">
                    <AdminCozeWorkflowPage defaultStatus="offline" />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              

              <Route path="/admin/orders" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="订单管理" description="管理平台订单信息">
                    <AdminOrdersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* 任务发放管理路由 */}
              <Route path="/admin/tasks" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminTasksPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tasks/create" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminTaskCreatePage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tasks/submissions" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminTaskSubmissionsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tasks/completed" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminTasksPage defaultStatus="completed" />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tasks/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminTaskDetailPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/video-tasks" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="视频生成任务" description="管理和监控视频生成任务">
                    <AdminVideoTasksPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* 初始佣金管理 - 虚假系统用于吸引创作者 */}
              <Route path="/admin/commission/initial" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminInitialCommissionPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* 真实佣金管理 - 智能算法系统 */}
              <Route path="/admin/commission" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="智能佣金管理" description="基于AI算法的实时佣金计算与自动发放系统">
                    <AdminRealCommissionPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* 原有佣金管理页面保持兼容 */}
              <Route path="/admin/commission/legacy" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="传统佣金发放" description="为用户发放初始佣金，管理用户收益">
                    <AdminCommissionPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/commission/progress" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="发放进度" description="查看佣金发放进度和状态">
                    <AdminCommissionProgressPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/commission/edit" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="金额修改" description="修改佣金发放计划和金额">
                    <AdminCommissionEditPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* 创作者管理路由 */}
              <Route path="/admin/creators" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="创作者列表" description="管理平台创作者信息">
                    <AdminCreatorsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/creator-applications" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="申请审核" description="审核创作者申请">
                    <AdminCreatorApplicationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* 添加兼容路由：/admin/creators/applications 重定向到 /admin/creator-applications */}
              <Route path="/admin/creators/applications" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="申请审核" description="审核创作者申请">
                    <AdminCreatorApplicationsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/creator-earnings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="收益管理" description="管理创作者收益和提现">
                    <AdminCreatorEarningsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* 添加兼容路由：/admin/creators/earnings 重定向到 /admin/creator-earnings */}
              <Route path="/admin/creators/earnings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="收益管理" description="管理创作者收益和提现">
                    <AdminCreatorEarningsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/creator-levels" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="等级管理" description="管理创作者等级体系">
                    <AdminCreatorLevelsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* 财务管理 - 提现管理 */}
              <Route path="/admin/finance/withdrawals" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="提现管理" description="管理用户提现申请">
                    <AdminCreatorEarningsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* 添加兼容路由：/admin/creators/levels 重定向到 /admin/creator-levels */}
              <Route path="/admin/creators/levels" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="等级管理" description="管理创作者等级体系">
                    <AdminCreatorLevelsPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* 服务器管理路由 */}
              <Route path="/admin/servers/shared" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout title="共享服务器" description="管理平台共享服务器">
                    <AdminSharedServersPage />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              
              {/* 广告商页面 - 需要advertiser权限 */}
              <Route path="/advertiser" element={
                <ProtectedRoute requiredRole="advertiser">
                  <MainLayout>
                    <AdvertiserPage />
                    <Footer />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
          

        </>
      );
    };
    
    // 主应用组件
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <AlertProvider>
              <AppContent />
            </AlertProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

// 404 页面组件
const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('404.title')}</h1>
        <p className="text-lg text-gray-600 mb-8">{t('404.message')}</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {t('404.backHome')}
        </a>
      </div>
    </div>
  );
};

// 页脚组件
const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">WF</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t('brand.name')}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('brand.tagline')}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                <span className="sr-only">GitHub</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              {t('footer.product')}
            </h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('nav.home')}</a></li>
              <li><a href="/discover" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('nav.discover')}</a></li>
              <li><a href="/trending" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('nav.trending')}</a></li>
              <li><a href="/featured" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('nav.featured')}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase mb-4">
              {t('footer.support')}
            </h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('footer.help')}</a></li>
              <li><a href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('footer.contact')}</a></li>
              <li><a href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('footer.privacy')}</a></li>
              <li><a href="/terms" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">{t('footer.terms')}</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default App;
