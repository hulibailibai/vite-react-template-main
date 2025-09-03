import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  X, 
  Plus,
  Eye,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Workflow, Category } from '../types';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { Breadcrumb } from '../components/ui/Breadcrumb';

// 工作流编辑页面组件
export const CreatorWorkflowEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [workflowFile, setWorkflowFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    price: 0,
    tags: [] as string[],
    file_url: '',
    preview_images: [] as string[]
  });

  // 加载工作流数据和分类
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [workflowRes, categoriesRes] = await Promise.all([
          api.creator.getCreatorWorkflows({ page: 1, pageSize: 100 }).then(response => response.items.find(w => w.id === parseInt(id))),
          api.category.getCategories()
        ]);
        
        // 检查权限
        if (workflowRes && workflowRes.creator_id !== user?.id) {
          showError('您没有权限编辑此工作流');
          navigate('/creator');
          return;
        }
        
        if (workflowRes) {
          setWorkflow(workflowRes);
          setPreviewImages(workflowRes.preview_images || []);
          
          // 设置表单数据
          setFormData({
            title: workflowRes.title,
            description: workflowRes.description || '',
            category_id: workflowRes.category_id?.toString() || '',
            price: workflowRes.price,
            tags: workflowRes.tags || [],
            file_url: workflowRes.file_url,
            preview_images: workflowRes.preview_images || []
          });
        }
        setCategories(categoriesRes);
      } catch (error) {
        console.error('Failed to load workflow:', error);
        showError('加载工作流失败');
        navigate('/creator');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  // 处理表单输入
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理标签输入
  const handleTagAdd = (tag: string) => {
    if (tag.trim() && formData.tags && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
    }
  };

  const handleTagRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index)
    }));
  };

  // 处理预览图片上传
  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    
    try {
      setUploadingImages(true);
      const uploadPromises = Array.from(files).map(file => 
        api.creatorUpload.uploadCoverImage(file)
      );
      
      const uploadResults = await Promise.all(uploadPromises);
      const newImages = uploadResults.map((result: { url: string; filename: string }) => result.url);
      
      setPreviewImages(prev => [...prev, ...newImages]);
      setFormData(prev => ({
        ...prev,
        preview_images: [...prev.preview_images, ...newImages]
      }));
    } catch (error) {
      console.error('Failed to upload images:', error);
      showError('图片上传失败');
    } finally {
      setUploadingImages(false);
    }
  };

  // 移除预览图片
  const handleImageRemove = (index: number) => {
    const newImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newImages);
    setFormData(prev => ({
      ...prev,
      preview_images: newImages
    }));
  };

  // 处理工作流文件上传
  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);
      const result = await api.creatorUpload.uploadWorkflowFile(file);
      setFormData(prev => ({ ...prev, file_url: result.url }));
      setWorkflowFile(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
      showError('文件上传失败');
    } finally {
      setUploadingFile(false);
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入工作流标题';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入工作流描述';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = '请选择分类';
    }
    
    if (formData.price < 0) {
      newErrors.price = '价格不能为负数';
    }
    
    if (!formData.file_url) {
      newErrors.file_url = '请上传工作流文件';
    }
    
    if (!formData.preview_images || formData.preview_images.length === 0) {
      newErrors.preview_images = '请至少上传一张预览图片';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存工作流
  const handleSave = async () => {
    if (!validateForm() || !workflow) return;
    
    try {
      setSaving(true);
      const updateData = {
        ...formData,
        category_id: parseInt(formData.category_id)
      };
      
      await api.creator.updateWorkflow(workflow.id, updateData);
      showSuccess('工作流更新成功');
      navigate('/creator');
    } catch (error) {
      console.error('Failed to update workflow:', error);
      showError('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 面包屑导航
  const breadcrumbItems = [
    { label: '创作者中心', href: '/creator' },
    { label: '编辑工作流', href: '#' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/creator')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>返回</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">编辑工作流</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.open(`/coze-workflow/${workflow?.id}`, '_blank')}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>预览</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? '保存中...' : '保存'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="space-y-8">
          {/* 基本信息 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作流标题 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="请输入工作流标题"
                  errorMessage={errors.title}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作流描述 *
                </label>
                <Textarea
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                    placeholder="请详细描述您的工作流功能和用途"
                    rows={4}
                    errorMessage={errors.description}
                  />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 *
                  </label>
                  <Dropdown
                    value={formData.category_id}
                    onChange={(value: string) => handleInputChange('category_id', value)}
                    placeholder="请选择分类"
                    options={[
                      { value: '', label: '请选择分类' },
                      ...categories.map((category) => ({
                        value: category.id.toString(),
                        label: category.name
                      }))
                    ]}
                  />
                  {errors.category_id && (
                    <p className="text-xs text-red-600 mt-1">{errors.category_id}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格 (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        handleInputChange('price', 0);
                      } else {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          handleInputChange('price', numValue);
                        }
                      }
                    }}
                    placeholder="输入价格"
                    errorMessage={errors.price}
                  />
                  <p className="text-xs text-gray-500 mt-1">设置为 0 表示免费</p>
                </div>
              </div>
            </div>
          </Card>

          {/* 标签 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">标签</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags && formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagRemove(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="输入标签后按回车添加"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </Card>

          {/* 预览图片 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">预览图片 *</h2>
            <div className="space-y-4">
              {errors.preview_images && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.preview_images}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`预览图 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImages ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">添加图片</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    disabled={uploadingImages}
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* 工作流文件 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">工作流文件 *</h2>
            <div className="space-y-4">
              {errors.file_url && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.file_url}</span>
                </div>
              )}
              
              {formData.file_url ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {workflowFile?.name || '工作流文件已上传'}
                      </p>
                      <p className="text-xs text-green-600">文件已准备就绪</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, file_url: '' }));
                      setWorkflowFile(null);
                    }}
                  >
                    重新上传
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingFile ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">点击上传</span> 工作流文件
                        </p>
                        <p className="text-xs text-gray-500">支持 .json, .yaml, .yml 等格式</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,.yaml,.yml,.zip,.rar"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    disabled={uploadingFile}
                  />
                </label>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatorWorkflowEditPage;