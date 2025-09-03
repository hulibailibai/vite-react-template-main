import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Star, 
  DollarSign,
  Calendar,
  Download,
  Tag,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { WorkflowSearchParams, Category } from '../types';

// 搜索框组件属性
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

// 筛选器组件属性
interface FilterPanelProps {
  filters: WorkflowSearchParams;
  categories: Category[];
  onFiltersChange: (filters: WorkflowSearchParams) => void;
  onReset: () => void;
  className?: string;
}

// 排序选项
const sortOptions = [
  { value: 'latest', label: '最新发布', icon: <Calendar className="w-4 h-4" /> },
  { value: 'popular', label: '最受欢迎', icon: <Star className="w-4 h-4" /> },
  { value: 'downloads', label: '下载最多', icon: <Download className="w-4 h-4" /> },
  { value: 'rating', label: '评分最高', icon: <Star className="w-4 h-4" /> },
  { value: 'price_low', label: '价格从低到高', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'price_high', label: '价格从高到低', icon: <DollarSign className="w-4 h-4" /> },
];

// 价格范围选项
const priceRanges = [
  { value: 'free', label: '免费', min: 0, max: 0 },
  { value: '0-10', label: '¥0-10', min: 0, max: 10 },
  { value: '10-50', label: '¥10-50', min: 10, max: 50 },
  { value: '50-100', label: '¥50-100', min: 50, max: 100 },
  { value: '100+', label: '¥100+', min: 100, max: null },
];

// 评分选项
const ratingOptions = [
  { value: 5, label: '5星' },
  { value: 4, label: '4星及以上' },
  { value: 3, label: '3星及以上' },
  { value: 2, label: '2星及以上' },
  { value: 1, label: '1星及以上' },
];

// 搜索框组件
export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = '搜索工作流...',
  className,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      <div className="relative">
        <Input
          type="text"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="pr-10 h-12 text-base"
          leftIcon={<Search className="w-5 h-5" />}
          fullWidth
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
};

// 筛选面板组件
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  categories,
  onFiltersChange,
  onReset,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 更新筛选器
  const updateFilter = (key: keyof WorkflowSearchParams, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  // 切换标签
  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags);
  };

  // 获取活跃筛选器数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category_id) count++;
    if (filters.min_price !== undefined || filters.max_price !== undefined) count++;
    if (filters.min_rating) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.is_free !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={clsx('', className)}>
      {/* 筛选器头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">筛选器</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeFiltersCount === 0}
          >
            重置
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* 筛选器内容 */}
      <div className={clsx('p-4 space-y-6', !isExpanded && 'hidden md:block')}>
        {/* 排序 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">排序方式</h4>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  checked={filters.sortBy === option.value}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {option.icon}
                  <span className="text-sm text-gray-700">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 分类 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">分类</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value=""
                checked={!filters.category}
              onChange={() => updateFilter('category', undefined)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">全部分类</span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={filters.category === category.id}
              onChange={(e) => updateFilter('category', parseInt(e.target.value))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 价格范围 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">价格范围</h4>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label key={range.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  value={range.value}
                  checked={
                    (range.value === 'free' && filters.is_free) ||
                    (filters.min_price === range.min && filters.max_price === range.max)
                  }
                  onChange={() => {
                    if (range.value === 'free') {
                      updateFilter('is_free', true);
                      updateFilter('min_price', undefined);
                      updateFilter('max_price', undefined);
                    } else {
                      updateFilter('is_free', undefined);
                      updateFilter('min_price', range.min);
                      updateFilter('max_price', range.max);
                    }
                  }}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 评分 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">最低评分</h4>
          <div className="space-y-2">
            {ratingOptions.map((rating) => (
              <label key={rating.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={rating.value}
                  checked={filters.min_rating === rating.value}
                  onChange={(e) => updateFilter('min_rating', parseInt(e.target.value))}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        'w-4 h-4',
                        i < rating.value ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      )}
                    />
                  ))}
                  <span className="text-sm text-gray-700 ml-1">{rating.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 热门标签 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">热门标签</h4>
          <div className="flex flex-wrap gap-2">
            {['自动化', '数据分析', '内容创作', '营销', '办公', '设计', '开发', '效率'].map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={clsx(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  filters.tags?.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                )}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 其他选项 */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">其他选项</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured || false}
                onChange={(e) => updateFilter('featured', e.target.checked || undefined)}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="text-sm text-gray-700">仅显示精选</span>
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};

// 活跃筛选器标签组件
interface ActiveFiltersProps {
  filters: WorkflowSearchParams;
  categories: Category[];
  onRemoveFilter: (key: keyof WorkflowSearchParams, value?: any) => void;
  onClearAll: () => void;
  className?: string;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  categories,
  onRemoveFilter,
  onClearAll,
  className,
}) => {
  const getFilterTags = () => {
    const tags: Array<{ key: keyof WorkflowSearchParams; value?: any; label: string }> = [];

    // 分类
    if (filters.category) {
      const category = categories.find(c => c.id === filters.category);
      if (category) {
        tags.push({ key: 'category', label: `分类: ${category.name}` });
      }
    }

    // 价格
    if (filters.is_free) {
      tags.push({ key: 'is_free', label: '免费' });
    } else if (filters.min_price !== undefined || filters.max_price !== undefined) {
      const min = filters.min_price || 0;
      const max = filters.max_price;
      const label = max ? `$${min}-${max}` : `$${min}+`;
      tags.push({ key: 'min_price', label: `价格: ${label}` });
    }

    // 评分
    if (filters.min_rating) {
      tags.push({ key: 'min_rating', label: `${filters.min_rating}星及以上` });
    }

    // 标签
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => {
        tags.push({ key: 'tags', value: tag, label: `标签: ${tag}` });
      });
    }

    // 精选
    if (filters.featured) {
      tags.push({ key: 'featured', label: '精选' });
    }

    return tags;
  };

  const filterTags = getFilterTags();

  if (filterTags.length === 0) {
    return null;
  }

  return (
    <div className={clsx('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-gray-600">已选筛选器:</span>
      {filterTags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
        >
          {tag.label}
          <button
          onClick={() => onRemoveFilter(tag.key as keyof WorkflowSearchParams, tag.value)}
          className="ml-2 text-blue-600 hover:text-blue-800"
        >
          <X className="w-3 h-3" />
        </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-gray-600 hover:text-gray-800"
      >
        清除全部
      </Button>
    </div>
  );
};

export default SearchBox;