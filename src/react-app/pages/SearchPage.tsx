import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Search, 
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid,
  List
} from 'lucide-react';
import { Workflow, Category, WorkflowSearchParams } from '../types';
import api from '../services/api';
import { WorkflowCard } from '../components/WorkflowCard';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

// 排序选项
const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'hot', label: '热门下载' },
  { value: 'rating', label: '评分最高' },
  { value: 'price_asc', label: '价格从低到高' },
  { value: 'price_desc', label: '价格从高到低' },
];

// 价格范围选项
const PRICE_RANGES = [
  { value: 'free', label: '免费', min: 0, max: 0 },
  { value: '1-10', label: '¥1-10', min: 1, max: 10 },
  { value: '10-50', label: '¥10-50', min: 10, max: 50 },
  { value: '50-100', label: '¥50-100', min: 50, max: 100 },
  { value: '100+', label: '¥100以上', min: 100, max: 999999 },
];

// 评分选项
const RATING_OPTIONS = [
  { value: '5', label: '5星' },
  { value: '4', label: '4星以上' },
  { value: '3', label: '3星以上' },
  { value: '2', label: '2星以上' },
];

// 搜索页面组件
export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get('category') ? parseInt(searchParams.get('category')!) : null
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(
    searchParams.get('price') || null
  );
  const [selectedRating, setSelectedRating] = useState<number | null>(
    searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : null
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await api.category.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // 搜索工作流
  useEffect(() => {
    const searchWorkflows = async () => {
      try {
        setLoading(true);
        
        const params: WorkflowSearchParams = {
          page: currentPage,
          pageSize: 20,
          search: searchQuery || undefined,
          category_id: selectedCategory || undefined,
          sort_by: sortBy,
        };

        // 添加价格筛选
        if (selectedPriceRange) {
          const priceRange = PRICE_RANGES.find(r => r.value === selectedPriceRange);
          if (priceRange) {
            params.min_price = priceRange.min;
            params.max_price = priceRange.max === 999999 ? undefined : priceRange.max;
            params.is_free = priceRange.value === 'free';
          }
        }

        // 添加评分筛选
        if (selectedRating) {
          params.min_rating = selectedRating;
        }

        const result = await api.cozeWorkflow.getCozeWorkflows(params);
        setWorkflows(result.items);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.error('Failed to search workflows:', error);
        setWorkflows([]);
      } finally {
        setLoading(false);
      }
    };

    searchWorkflows();
  }, [searchQuery, selectedCategory, selectedPriceRange, selectedRating, sortBy, currentPage]);

  // 更新URL参数
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory.toString());
    if (selectedPriceRange) params.set('price', selectedPriceRange);
    if (selectedRating) params.set('rating', selectedRating.toString());
    if (sortBy !== 'latest') params.set('sort', sortBy);
    if (currentPage > 1) params.set('page', currentPage.toString());

    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedPriceRange, selectedRating, sortBy, currentPage, setSearchParams]);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  // 清除筛选条件
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setCurrentPage(1);
  };

  // 处理工作流操作
  const handleWorkflowView = (id: number) => {
    window.location.href = `/coze-workflow/${id}`;
  };

  const handleWorkflowDownload = async (id: number) => {
    try {
      console.log('Download workflow:', id);
    } catch (error) {
      console.error('Failed to download workflow:', error);
    }
  };

  const handleWorkflowFavorite = async (id: number) => {
    try {
      console.log('Favorite workflow:', id);
    } catch (error) {
      console.error('Failed to favorite workflow:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索栏 */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="搜索工作流、创作者或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <Button type="submit" size="lg" className="px-8">
              搜索
            </Button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* 侧边栏筛选 */}
          <div className="lg:w-64 flex-shrink-0">
            {/* 移动端筛选按钮 */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>筛选条件</span>
                <ChevronDown className={clsx('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
              </Button>
            </div>

            {/* 筛选面板 */}
            <div className={clsx('space-y-6', !showFilters && 'hidden lg:block')}>
              {/* 分类筛选 */}
              <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">分类</h3>
                  {selectedCategory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={clsx(
                      'block w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                      !selectedCategory
                        ? 'bg-blue-500/20 text-blue-400 font-medium'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    )}
                  >
                    全部分类
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={clsx(
                        'block w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        selectedCategory === category.id
                          ? 'bg-blue-500/20 text-blue-400 font-medium'
                          : 'text-gray-300 hover:bg-gray-700/50'
                      )}
                    >
                      {category.name}
                      <span className="text-gray-400 ml-1">({category.workflow_count})</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* 价格筛选 */}
              <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">价格</h3>
                  {selectedPriceRange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPriceRange(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedPriceRange(range.value)}
                      className={clsx(
                        'block w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        selectedPriceRange === range.value
                          ? 'bg-blue-500/20 text-blue-400 font-medium'
                          : 'text-gray-300 hover:bg-gray-700/50'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* 评分筛选 */}
              <Card className="p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">评分</h3>
                  {selectedRating && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRating(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {RATING_OPTIONS.map((rating) => (
                    <button
                      key={rating.value}
                      onClick={() => setSelectedRating(parseInt(rating.value))}
                      className={clsx(
                        'block w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                        selectedRating === parseInt(rating.value)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {rating.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* 清除筛选 */}
              {(selectedCategory || selectedPriceRange || selectedRating) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  清除所有筛选
                </Button>
              )}
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  {searchQuery && `"${searchQuery}" 的搜索结果`}
                  {workflows.length > 0 && ` (${workflows.length} 个结果)`}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 排序选择 */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* 视图模式切换 */}
                <div className="flex items-center border border-gray-300 rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 工作流列表 */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-video rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : workflows.length > 0 ? (
              <>
                <div className={clsx(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                )}>
                  {workflows.map((workflow) => (
                    <WorkflowCard
                      key={workflow.id}
                      workflow={workflow}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                      onView={handleWorkflowView}
                      onDownload={handleWorkflowDownload}
                      onFavorite={handleWorkflowFavorite}
                    />
                  ))}
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={workflows.length * totalPages}
                      itemsPerPage={20}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  没有找到相关工作流
                </h3>
                <p className="text-gray-500 mb-6">
                  尝试调整搜索关键词或筛选条件
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  清除筛选条件
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;