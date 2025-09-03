import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertDialog } from '../components/ui/AlertDialog';
import { Upload, X, Plus, ArrowLeft, Loader2, Check } from 'lucide-react';
import clsx from 'clsx';
import * as api from '../services/api';

// 价格类型枚举
enum PriceType {
  FREE = 'free',
  MEMBER_FREE = 'member_free',
  PAID = 'paid'
}

// 表单数据接口
interface UploadFormData {
  type: 'workflow' | 'ai-app';
  title: string;
  description: string;
  country: string;
  customCountry: string;
  category: string;
  customCategory: string;
  tags: string[];
  customTags: string[];
  priceType: PriceType;
  price: number;
  coverImage: {
    file: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
  };
  previewVideo?: {
    file: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
  };
  mainFile: {
    file: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
  };
  cozeApiCode?: string;
  openingMessage?: string;
  presetQuestions: string[];
  runtimeDuration?: number; // AI应用运行时长（分钟），所有AI应用必填
}

const CreatorUploadPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [newPresetQuestion, setNewPresetQuestion] = useState('');
  const [showCustomTags, setShowCustomTags] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [availableTags, setAvailableTags] = useState<Array<{id: number, name: string}>>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [countries, setCountries] = useState<Array<{code: string, name: string}>>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [shouldShowRuntimeDuration, setShouldShowRuntimeDuration] = useState(false);
  
  // 根据类型确定总步数
  const totalSteps = searchParams.get('type') === 'aiapp' ? 5 : 4;
  
  // 表单数据
  const [formData, setFormData] = useState<UploadFormData>({
    type: searchParams.get('type') === 'aiapp' ? 'ai-app' : 'workflow',
    title: '',
    description: '',
    country: '',
    customCountry: '',
    category: '',
    customCategory: '',
    tags: [],
    customTags: [],
    priceType: PriceType.FREE,
    price: 0,
    coverImage: {
      file: null,
      uploading: false,
      progress: 0,
      error: null
    },
    previewVideo: {
      file: null,
      uploading: false,
      progress: 0,
      error: null
    },
    mainFile: {
      file: null,
      uploading: false,
      progress: 0,
      error: null
    },
    cozeApiCode: '',
    openingMessage: '',
    presetQuestions: [],
    runtimeDuration: undefined
  });

  // 检查是否需要显示运行时长输入框
  useEffect(() => {
    const isAIApp = formData.type === 'ai-app';
    setShouldShowRuntimeDuration(isAIApp);
  }, [formData.type]);

  // 提示框状态
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  // 获取国家数据
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch('/api/countries');
        if (response.ok) {
          const data = await response.json();
          console.log('Countries API response:', data);
          setCountries(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // 获取分类数据
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          console.log('Categories API response:', data);
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // 根据分类获取标签
  useEffect(() => {
    const fetchTags = async () => {
      if (!formData.category || formData.category === 'custom') {
        setAvailableTags([]);
        return;
      }

      try {
        setLoadingTags(true);
        const response = await fetch(`/api/tags?category_id=${formData.category}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Tags API response:', data);
          setAvailableTags(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }
    };

    fetchTags();
  }, [formData.category]);

  // 处理文件选择
  const handleMainFileSelect = (file: File) => {
    // 检查文件大小（1MB限制）
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      showAlert(
        '文件过大',
        '工作流文件大小不能超过1MB，请选择较小的文件或压缩后重试。',
        'error'
      );
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      mainFile: { file, uploading: false, progress: 0, error: null }
    }));
  };

  // 处理封面图片选择
  const handleCoverImageSelect = (file: File) => {
    // 检查文件大小（1MB限制）
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      showAlert(
        '文件过大',
        '封面图片大小不能超过1MB，请选择较小的文件或压缩后重试。',
        'error'
      );
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      coverImage: { file, uploading: false, progress: 0, error: null }
    }));
  };

  // 处理预览视频选择
  const handlePreviewVideoSelect = (file: File) => {
    // 检查文件大小（50MB限制）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      showAlert(
        '文件过大',
        '预览视频大小不能超过50MB，请选择较小的文件或压缩后重试。',
        'error'
      );
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      previewVideo: { file, uploading: false, progress: 0, error: null }
    }));
  };

  // 处理标签移除
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // 处理自定义标签添加
  const handleAddCustomTag = () => {
    const trimmedTag = newCustomTag.trim();
    if (trimmedTag && !formData.customTags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, trimmedTag]
      }));
      setNewCustomTag('');
    }
  };

  // 处理自定义标签移除
  const handleRemoveCustomTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tag)
    }));
  };

  // 处理预置问题添加
  const handleAddPresetQuestion = () => {
    const trimmedQuestion = newPresetQuestion.trim();
    if (trimmedQuestion && !formData.presetQuestions.includes(trimmedQuestion)) {
      setFormData(prev => ({
        ...prev,
        presetQuestions: [...prev.presetQuestions, trimmedQuestion]
      }));
      setNewPresetQuestion('');
    }
  };

  // 处理预置问题移除
  const handleRemovePresetQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      presetQuestions: prev.presetQuestions.filter((_, i) => i !== index)
    }));
  };

  // 显示提示框
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void) => {
    setAlert({ isOpen: true, title, message, type, onConfirm });
  };

  // 隐藏提示框
  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // 验证当前步骤的必填字段
  const validateCurrentStep = () => {
    const errors: string[] = [];

    switch (currentStep) {
      case 1: // 基本信息
        if (!formData.title.trim()) {
          errors.push('请输入作品标题');
        }
        if (!formData.description.trim()) {
          errors.push('请输入作品描述');
        }
        break;

      case 2: // 分类标签
        if (!formData.category) {
          errors.push('请选择作品分类');
        }
        break;

      case 3: // 价格设置
        if (formData.priceType === PriceType.PAID && formData.price <= 0) {
          errors.push('付费作品请设置正确的价格');
        }
        break;

      case 4: // 媒体文件上传/API配置
        if (!formData.coverImage.file) {
          errors.push('请上传封面图片');
        }
        if (formData.type === 'workflow') {
          if (!formData.mainFile.file) {
            errors.push('请上传工作流文件');
          }
        } else if (formData.type === 'ai-app') {
          if (!formData.cozeApiCode?.trim()) {
            errors.push('请输入Coze API代码');
          }
        }
        break;

      case 5: // AI配置 (仅AI应用)
        // 所有AI应用都必须填写运行时长
        if (formData.type === 'ai-app') {
          if (!formData.runtimeDuration || formData.runtimeDuration <= 0) {
            errors.push('请输入AI应用的预计运行时长');
          }
        }
        break;

      default:
        break;
    }

    if (errors.length > 0) {
      showAlert('请完善必填信息', errors.join('\n'), 'error');
      return false;
    }

    return true;
  };

  // 处理下一步点击
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  // 处理表单提交
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 表单验证
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push('请输入作品标题');
    }
    
    if (!formData.description.trim()) {
      errors.push('请输入作品描述');
    }
    
    if (!formData.category) {
      errors.push('请选择作品分类');
    }
    
    if (!formData.coverImage.file) {
      errors.push('请上传封面图片');
    }
    
    if (formData.type === 'workflow') {
      if (!formData.mainFile.file) {
        errors.push('请上传工作流文件');
      }
    } else if (formData.type === 'ai-app') {
      if (!formData.cozeApiCode?.trim()) {
        errors.push('请输入Coze API代码');
      }
      // 所有AI应用都必须填写运行时长
      if (!formData.runtimeDuration || formData.runtimeDuration <= 0) {
        errors.push('请输入AI应用的预计运行时长');
      }
    }
    
    if (errors.length > 0) {
      showAlert('表单验证失败', errors.join('\n'), 'error');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 上传文件并获取URL
      let fileUrl = '';
      let coverImageUrl = '';
      let previewVideoUrl = '';
      
      // 上传封面图片
       if (formData.coverImage.file) {
         const coverResult = await api.creatorUploadApi.uploadCoverImage(formData.coverImage.file);
         coverImageUrl = coverResult.url;
       }
       
       // 上传预览视频（如果有）
       if (formData.previewVideo?.file) {
         const videoResult = await api.creatorUploadApi.uploadPreviewVideo(formData.previewVideo.file);
         previewVideoUrl = videoResult.url;
       }
       
       if (formData.type === 'workflow') {
         // 上传工作流文件
         if (formData.mainFile.file) {
           const fileResult = await api.creatorUploadApi.uploadWorkflowFile(formData.mainFile.file);
           fileUrl = fileResult.url;
         }
         
         // 提交工作流
         await api.creatorUploadApi.submitWorkflow({
           title: formData.title,
           description: formData.description,
           category: formData.category,
           tags: [...formData.tags, ...formData.customTags],
           price: formData.priceType === 'paid' ? formData.price : 0,
           type: formData.type,
           isMemberFree: formData.priceType === 'member_free',
           fileUrl,
           coverImageUrl,
           previewVideoUrl,
           country: formData.country === 'custom' ? formData.customCountry : formData.country
         });
       } else {
         // 提交AI应用
         await api.creatorUploadApi.submitAIApp({
           title: formData.title,
           description: formData.description,
           category: formData.category,
           tags: [...formData.tags, ...formData.customTags],
           price: formData.priceType === 'paid' ? formData.price : 0,
           cozeApiCode: formData.cozeApiCode || '',
           openingMessage: formData.openingMessage,
           presetQuestions: formData.presetQuestions,
           quickCommands: [],
           appAvatarUrl: coverImageUrl,
           previewVideoUrl,
           country: formData.country === 'custom' ? formData.customCountry : formData.country,
           runtimeDuration: formData.runtimeDuration
         });
       }
      
      showAlert(
        '提交成功',
        '您的作品已成功提交，我们会在24小时内完成审核。',
        'success',
        () => navigate('/creator')
      );
    } catch (error) {
      console.error('提交失败:', error);
      showAlert('提交失败', '提交过程中出现错误，请重试。', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 返回导航 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/creator')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            返回创作者中心
          </Button>
        </div>
        
        {/* 页面标题和步骤指示器 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {formData.type === 'workflow' ? '上传工作流' : '上传AI应用'}
          </h1>
          
          {/* 步骤指示器 */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-slate-400'
                )}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div className={clsx(
                    'w-12 h-0.5 mx-2 transition-all duration-200',
                    step < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-gray-700'
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/50">
            
            {/* 步骤1: 基本信息 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">基本信息</h2>
                  <p className="text-slate-600 dark:text-slate-300">填写您的作品基本信息</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="请输入作品标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-32 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                    placeholder="请详细描述您的作品功能和特点"
                    required
                  />
                </div>
              </div>
            )}

            {/* 步骤2: 分类标签 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🏷️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">分类标签</h2>
                  <p className="text-slate-600 dark:text-slate-300">选择合适的分类和标签</p>
                </div>

                {/* 国家选择 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    国家/地区 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => {
                      const countryValue = e.target.value;
                      setFormData(prev => ({ ...prev, country: countryValue, customCountry: '' }));
                    }}
                    className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 text-slate-800 dark:text-slate-100"
                    required
                    disabled={loadingCountries}
                  >
                    {loadingCountries ? (
                      <option value="">加载中...</option>
                    ) : (
                      <option value="">请选择国家/地区</option>
                    )}
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                  {formData.country === 'custom' && (
                    <input
                      type="text"
                      value={formData.customCountry}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCountry: e.target.value }))}
                      className="w-full mt-3 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="请输入自定义国家/地区"
                      required
                    />
                  )}
                </div>

                {/* 分类选择 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const categoryId = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        category: categoryId, 
                        customCategory: '', 
                        tags: [] 
                      }));
                    }}
                    className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 text-slate-800 dark:text-slate-100"
                    required
                    disabled={loadingCategories}
                  >
                    {loadingCategories ? (
                      <option value="">加载中...</option>
                    ) : (
                      <option value="">请选择分类</option>
                    )}
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                    <option value="custom">其他（自定义）</option>
                  </select>
                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                      className="w-full mt-3 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="请输入自定义分类"
                      required
                    />
                  )}
                </div>

                {/* 标签管理 */}
                <div className="space-y-6">
                  {/* 系统标签 */}
                  {formData.category && formData.category !== 'custom' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        系统标签（可选择）
                      </label>
                      {loadingTags ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                          <span className="ml-2 text-slate-500 dark:text-slate-400">加载标签中...</span>
                        </div>
                      ) : availableTags.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-3 mb-4">
                            {availableTags.map((tag) => (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => {
                                  const tagName = tag.name;
                                  if (formData.tags.includes(tagName)) {
                                    handleRemoveTag(tagName);
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      tags: [...prev.tags, tagName]
                                    }));
                                  }
                                }}
                                className={clsx(
                                  'px-4 py-2 rounded-full text-sm transition-all duration-200 border',
                                  formData.tags.includes(tag.name)
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent shadow-md'
                                    : 'bg-white/70 dark:bg-gray-700/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                )}
                              >
                                {tag.name}
                              </button>
                            ))}
                          </div>
                          <div className="text-right">
                            <button
                              type="button"
                              onClick={() => setShowCustomTags(true)}
                              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer"
                            >
                              找不到标签试试自定义
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500 dark:text-slate-400 mb-4">该分类暂无系统标签</p>
                          <button
                            type="button"
                            onClick={() => setShowCustomTags(true)}
                            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors duration-200 cursor-pointer"
                          >
                            添加自定义标签
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 自定义标签 */}
                  {showCustomTags && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        自定义标签
                      </label>
                      {formData.customTags.length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                          {formData.customTags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomTag(tag)}
                                className="ml-2 text-white/80 hover:text-white transition-colors duration-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={newCustomTag}
                          onChange={(e) => setNewCustomTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                          className="flex-1 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                          placeholder="输入自定义标签，按回车添加"
                        />
                        <Button 
                          type="button" 
                          onClick={handleAddCustomTag}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 步骤3: 价格设置 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">价格设置</h2>
                  <p className="text-slate-600 dark:text-slate-300">设置您的内容价格</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    WH币价格类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priceType: PriceType.FREE, price: 0 }))}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        formData.priceType === PriceType.FREE
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-slate-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                      )}
                    >
                      <div className="flex items-center mb-2">
                        <div className={clsx(
                          'w-4 h-4 rounded-full border-2 mr-3',
                          formData.priceType === PriceType.FREE
                            ? 'border-green-500 bg-green-500'
                            : 'border-slate-300 dark:border-gray-600'
                        )}>
                          {formData.priceType === PriceType.FREE && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">免费</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 ml-7">
                        所有用户都可以免费使用
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priceType: PriceType.MEMBER_FREE, price: 0 }))}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        formData.priceType === PriceType.MEMBER_FREE
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                      )}
                    >
                      <div className="flex items-center mb-2">
                        <div className={clsx(
                          'w-4 h-4 rounded-full border-2 mr-3',
                          formData.priceType === PriceType.MEMBER_FREE
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300 dark:border-gray-600'
                        )}>
                          {formData.priceType === PriceType.MEMBER_FREE && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">会员免费</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 ml-7">
                        仅会员用户可以免费使用
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priceType: PriceType.PAID }))}
                      className={clsx(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        formData.priceType === PriceType.PAID
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-slate-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-600'
                      )}
                    >
                      <div className="flex items-center mb-2">
                        <div className={clsx(
                          'w-4 h-4 rounded-full border-2 mr-3',
                          formData.priceType === PriceType.PAID
                            ? 'border-yellow-500 bg-yellow-500'
                            : 'border-slate-300 dark:border-gray-600'
                        )}>
                          {formData.priceType === PriceType.PAID && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">付费</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 ml-7">
                        用户需要支付WH币使用
                      </p>
                    </button>
                  </div>
                </div>

                {formData.priceType === PriceType.PAID && (
                  <div>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                        <span className="text-lg">💡</span>
                        <span className="text-sm font-medium">WH币汇率说明：1美元 = 100 WH币</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-center">
                        例如：设置100 WH币相当于1美元，设置50 WH币相当于0.5美元
                      </p>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      价格(WH币) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.price === 0 ? '' : formData.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData(prev => ({ ...prev, price: 0 }));
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setFormData(prev => ({ ...prev, price: numValue }));
                          }
                        }
                      }}
                      min="1"
                      step="1"
                      className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/30 dark:focus:ring-yellow-400/30 focus:border-yellow-500 dark:focus:border-yellow-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="输入价格（WH币）"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* 步骤4: 媒体文件上传 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {formData.type === 'workflow' ? '媒体文件上传' : 'API配置'}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    {formData.type === 'workflow' ? '上传封面图片和相关文件' : '配置API代码和上传封面图片'}
                  </p>
                </div>

                {/* 封面图片上传 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    封面图片 <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    支持 JPG, PNG 格式，<span className="text-xs">最佳比例 300×400，最大1MB</span>
                  </p>
                  {!formData.coverImage.file ? (
                    <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                         onClick={() => document.getElementById('cover-image-input')?.click()}>
                      <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">点击选择封面图片</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">支持 JPG, PNG 格式，<span className="text-xs">最佳比例 300×400，最大1MB</span></p>
                      <input
                        id="cover-image-input"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => e.target.files?.[0] && handleCoverImageSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                          <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-100">{formData.coverImage.file.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{(formData.coverImage.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, coverImage: { file: null, uploading: false, progress: 0, error: null } }))}
                        className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI应用API代码输入 */}
                {formData.type === 'ai-app' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Coze API代码 <span className="text-red-500">*</span>
                      <span 
                        className="ml-2 text-blue-500 cursor-help" 
                        title="中国的coze必须要打开异步模式"
                      >
                        ❗
                      </span>
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      请粘贴完整的curl命令，包含Authorization和请求参数。支持Markdown格式编辑。
                    </p>
                    <div className="relative">
                      <div className="absolute top-3 right-3 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-gray-600 px-2 py-1 rounded">
                        Markdown
                      </div>
                      <textarea
                        value={formData.cozeApiCode || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, cozeApiCode: e.target.value }))}
                        className="w-full h-48 px-4 py-3 pt-12 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 dark:focus:ring-green-400/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-sm resize-none"
                        placeholder={`# API调用代码

\`\`\`bash
curl -X POST 'https://api.coze.cn/v1/workflow/run' \\
  -H "Authorization: Bearer your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_id": "your_workflow_id",
    "parameters": {
      "input": "your_input_here"
    },
    "is_async": true
  }'
\`\`\`

## 说明
- 请替换 \`your_token_here\` 为实际的API token
- 请替换 \`your_workflow_id\` 为实际的工作流ID
- 可以添加更多说明和使用示例`}
                        spellCheck={false}
                        required
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      💡 提示：使用 \`\`\`bash 代码块来格式化curl命令，使用 # 添加标题，使用 - 添加说明列表
                    </div>
                  </div>
                )}

                {/* 运行时长配置 (所有AI应用必填) */}
                {shouldShowRuntimeDuration && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      预计运行时长 <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      请输入AI应用单次运行的预计时长（分钟），用于用户了解应用执行时间
                    </p>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.runtimeDuration === undefined ? '' : formData.runtimeDuration}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setFormData(prev => ({ ...prev, runtimeDuration: undefined }));
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setFormData(prev => ({ ...prev, runtimeDuration: numValue }));
                            }
                          }
                        }}
                        className="w-full px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="输入预计运行时长（分钟）"
                        min="1"
                        max="1440"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400">
                        
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      💡 提示：请根据AI应用的复杂度合理估算运行时长，范围：1-1440分钟
                    </div>
                  </div>
                )}

                {/* 工作流文件上传 */}
                {formData.type === 'workflow' && (
                  <>
                    {/* 预览视频上传（可选） */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        预览视频（可选）
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        支持 MP4 格式，<span className="text-xs">最佳比例 300×400</span>，最大50MB，用于展示工作流效果
                      </p>
                      {!formData.previewVideo?.file ? (
                        <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                             onClick={() => document.getElementById('preview-video-input')?.click()}>
                          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                          <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">点击选择预览视频</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">支持 MP4 格式，<span className="text-xs">最佳比例 300×400</span>，最大50MB</p>
                          <input
                            id="preview-video-input"
                            type="file"
                            accept=".mp4"
                            onChange={(e) => e.target.files?.[0] && handlePreviewVideoSelect(e.target.files[0])}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100">{formData.previewVideo.file.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{(formData.previewVideo.file.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, previewVideo: { file: null, uploading: false, progress: 0, error: null } }))}
                            className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 工作流文件上传 */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        工作流文件 <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        支持 .zip, .rar 等压缩包格式，最大1MB
                      </p>
                      {!formData.mainFile.file ? (
                        <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-slate-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
                             onClick={() => document.getElementById('workflow-file-input')?.click()}>
                          <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                          <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">点击选择工作流文件</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">支持 .zip, .rar, .7z 格式，最大1MB</p>
                          <input
                            id="workflow-file-input"
                            type="file"
                            accept=".zip,.rar,.7z"
                            onChange={(e) => e.target.files?.[0] && handleMainFileSelect(e.target.files[0])}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-100">{formData.mainFile.file.name}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{(formData.mainFile.file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, mainFile: { file: null, uploading: false, progress: 0, error: null } }))}
                            className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 步骤5: AI配置 (仅AI应用) */}
            {currentStep === 5 && formData.type === 'ai-app' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">AI配置</h2>
                  <p className="text-slate-600 dark:text-slate-300">配置AI应用的交互设置</p>
                </div>

                {/* 开场白配置 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    开场白
                  </label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    设置AI应用的欢迎消息，用户进入对话时会首先看到
                  </p>
                  <textarea
                    value={formData.openingMessage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingMessage: e.target.value }))}
                    className="w-full h-32 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                    placeholder="欢迎使用我的AI应用！我可以帮助您解决各种问题，请告诉我您需要什么帮助..."
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">建议长度：50-200字符</span>
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      {(formData.openingMessage || '').length}/500
                    </span>
                  </div>
                </div>

                {/* 预置问题配置 */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    预置问题
                  </label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    设置一些常见问题，帮助用户快速开始对话
                  </p>
                  {formData.presetQuestions.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {formData.presetQuestions.map((question, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-slate-200 dark:border-gray-600">
                          <span className="flex-1 text-slate-700 dark:text-slate-300">{question}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemovePresetQuestion(index)}
                            className="text-red-500 hover:text-red-600 border-red-200 hover:border-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newPresetQuestion}
                      onChange={(e) => setNewPresetQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPresetQuestion())}
                      className="flex-1 px-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 dark:focus:ring-purple-400/30 focus:border-purple-500 dark:focus:border-purple-400 transition-all duration-200 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="输入预置问题，按回车添加"
                      maxLength={100}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddPresetQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>


              </div>
            )}
          </div>

          {/* 步骤导航按钮 */}
          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              上一步
            </Button>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              第 {currentStep} 步，共 {totalSteps} 步
            </div>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                下一步
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交作品'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* 提示弹窗 */}
      {alert.isOpen && (
        <AlertDialog
          isOpen={true}
          onClose={hideAlert}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
        />
      )}
    </div>
  );
};

export default CreatorUploadPage;