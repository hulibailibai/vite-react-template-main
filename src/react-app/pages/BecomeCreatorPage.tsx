import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CreatorApplication } from '../types';
import api from '../services/api';
import {
  DollarSign,
  Star,
  CheckCircle,
  Upload,
  Shield,
  Clock,
  Edit,
  X,
  Eye
} from 'lucide-react';

// 申请成为创作者页面
const BecomeCreatorPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { showError, showConfirm } = useAlert();
  const [formData, setFormData] = useState({
    country: '',
    linkedin: '',
    experience: '',
    portfolio: '',
    reason: '',
    skills: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [application, setApplication] = useState<CreatorApplication | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 获取用户的创作者申请状态
  const fetchApplication = async () => {
    try {
      const response = await api.creator.getApplication();
      if (response) {
        setApplication(response);
        setFormData({
          country: response.country,
          linkedin: response.linkedin || '',
          experience: response.experience,
          portfolio: response.portfolio || '',
          reason: response.reason,
          skills: response.skills
        });
      }
    } catch (error) {
      console.error('获取申请状态失败:', error);
    }
  };

  // 提交申请
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 构建提交数据
      const submitData = {
        ...formData
      };
      
      if (isEditing && application) {
        // 更新申请
        await api.creator.updateApplication(application.id, submitData);
        // 重新获取申请状态
        await fetchApplication();
        // 退出编辑模式，设置submitted状态以显示成功页面
        setIsEditing(false);
        setSubmitted(true);
      } else {
        // 新建申请
        const response = await api.creator.applyToBeCreator(submitData);
        // 创建新的申请对象
        const newApplication: CreatorApplication = {
          id: response.id,
          user_id: user?.id || 0,
          ...submitData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setApplication(newApplication);
        setSubmitted(true);
      }
    } catch (error) {
      console.error('申请失败:', error);
      showError(isEditing ? '申请更新失败，请稍后重试' : '申请提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 撤回申请
  const handleWithdraw = async () => {
    if (!application) return;
    
    const confirmed = await showConfirm('确定要撤回申请吗？撤回后需要重新提交。');
    if (!confirmed) return;

    try {
      await api.creator.withdrawApplication(application.id);
      setApplication(null);
      setFormData({
        country: '',
        linkedin: '',
        experience: '',
        portfolio: '',
        reason: '',
        skills: ''
      });
    } catch (error) {
      console.error('撤回申请失败:', error);
      showError('撤回申请失败，请稍后重试');
    }
  };

  // 组件挂载时获取申请状态
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchApplication();
    }
  }, [isAuthenticated, user]);

  // 如果未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-4">{t('becomeCreator.loginRequired')}</h2>
          <p className="text-gray-300 mb-6">{t('becomeCreator.loginRequired.desc')}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            {t('becomeCreator.loginButton')}
          </Button>
        </Card>
      </div>
    );
  }

  // 如果已经是创作者
  if (user?.role === 'creator') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('becomeCreator.alreadyCreator')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{t('becomeCreator.alreadyCreator.desc')}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/creator'}
            className="w-full"
          >
            {t('becomeCreator.goToCreatorCenter')}
          </Button>
        </Card>
      </div>
    );
  }

  // 如果有申请记录且状态为审核中
  if (application && application.status === 'pending' && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4 p-8">
          <div className="text-center mb-6">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">申请审核中</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              您的创作者申请正在审核中，我们会在3-5个工作日内完成审核。
            </p>
          </div>

          {/* 申请详情 */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">申请详情</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showDetails ? '隐藏详情' : '查看详情'}
              </Button>
            </div>
            
            {showDetails && (
              <div className="space-y-4 text-sm">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">国家/地区：</label>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{application.country}</span>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">LinkedIn：</label>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{application.linkedin || '未填写'}</span>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">专业技能：</label>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{application.skills}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">工作经验：</label>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{application.experience}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">作品集：</label>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{application.portfolio || '未填写'}</span>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">申请理由：</label>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{application.reason}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-300">提交时间：</label>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {application.created_at ? new Date(application.created_at).toLocaleString('zh-CN') : '未知'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              修改申请
            </Button>
            <Button 
              variant="outline" 
              onClick={handleWithdraw}
              className="flex-1 flex items-center justify-center gap-2 text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <X className="w-4 h-4" />
              撤回申请
            </Button>
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              返回首页
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 如果申请已提交
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {application ? '申请已更新' : '申请已提交'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {application ? '您的申请修改已提交，请等待管理员重新审核。' : '您的创作者申请已提交，我们会在3-5个工作日内完成审核。'}
          </p>
          <div className="space-y-3">
            {application ? (
              <Button 
                variant="primary" 
                onClick={() => {
                  setSubmitted(false);
                }}
                className="w-full"
              >
                返回申请状态
              </Button>
            ) : (
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                返回首页
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/profile'}
              className="w-full"
            >
              查看个人资料
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('becomeCreator.title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t('becomeCreator.subtitle')}
          </p>
        </div>

        {/* 创作者权益介绍 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('becomeCreator.benefits.upload.title')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('becomeCreator.benefits.upload.desc')}</p>
          </Card>
          <Card className="p-6 text-center">
            <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('becomeCreator.benefits.earn.title')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('becomeCreator.benefits.earn.desc')}</p>
          </Card>
          <Card className="p-6 text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('becomeCreator.benefits.reputation.title')}</h3>
            <p className="text-gray-600 dark:text-gray-300">{t('becomeCreator.benefits.reputation.desc')}</p>
          </Card>
        </div>

        {/* 申请表单 */}
        <Card className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {isEditing ? '修改创作者申请' : t('becomeCreator.form.title')}
          </h2>
          
          {isEditing && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                <strong>注意：</strong>修改申请后，审核状态将重置为"审核中"，需要重新等待管理员审核。
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 用户名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('becomeCreator.form.username')}
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                  placeholder={t('becomeCreator.form.username.placeholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">此信息来自您的账户，无法修改</p>
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('becomeCreator.form.email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed"
                  placeholder={t('becomeCreator.form.email.placeholder')}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">此信息来自您的账户，无法修改</p>
              </div>

              {/* 国家/地区 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('becomeCreator.form.country')} <span className="text-red-500">{t('becomeCreator.form.required')}</span>
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('becomeCreator.form.country.placeholder')}
                />
              </div>

              {/* LinkedIn档案 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('becomeCreator.form.linkedin')}
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('becomeCreator.form.linkedin.placeholder')}
                />
              </div>
            </div>

            {/* 专业技能 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('becomeCreator.form.skills')} <span className="text-red-500">{t('becomeCreator.form.required')}</span>
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('becomeCreator.form.skills.placeholder')}
              />
            </div>

            {/* 工作经验 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('becomeCreator.form.experience')} <span className="text-red-500">{t('becomeCreator.form.required')}</span>
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('becomeCreator.form.experience.placeholder')}
              />
            </div>

            {/* 作品集链接 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('becomeCreator.form.portfolio')}
              </label>
              <input
                type="url"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('becomeCreator.form.portfolio.placeholder')}
              />
            </div>

            {/* 申请理由 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('becomeCreator.form.reason')} <span className="text-red-500">{t('becomeCreator.form.required')}</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('becomeCreator.form.reason.placeholder')}
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-4">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    // 重置表单数据
                    if (application) {
                      setFormData({
                        country: application.country,
                        linkedin: application.linkedin || '',
                        experience: application.experience,
                        portfolio: application.portfolio || '',
                        reason: application.reason,
                        skills: application.skills
                      });
                    }
                  }}
                >
                  取消修改
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
              >
                {t('becomeCreator.form.back')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? '更新中...' : t('becomeCreator.form.submitting')}
                  </div>
                ) : (
                  isEditing ? '更新申请' : t('becomeCreator.form.submit')
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* 注意事项 */}
        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">{t('becomeCreator.notice.title')}</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>{t('becomeCreator.notice.item1')}</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>{t('becomeCreator.notice.item2')}</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>{t('becomeCreator.notice.item3')}</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <span>{t('becomeCreator.notice.item4')}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default BecomeCreatorPage;