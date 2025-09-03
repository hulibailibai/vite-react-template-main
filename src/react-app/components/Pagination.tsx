import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/Button';

// 分页组件属性接口
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

// 分页信息组件属性
interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

// 页码选择器组件属性
interface PageSizeSelectorProps {
  currentSize: number;
  options: number[];
  onChange: (size: number) => void;
  className?: string;
}

// 生成页码数组
const generatePageNumbers = (currentPage: number, totalPages: number): (number | 'ellipsis')[] => {
  const pages: (number | 'ellipsis')[] = [];
  const delta = 2; // 当前页前后显示的页数

  // 如果总页数小于等于7，显示所有页码
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // 始终显示第一页
  pages.push(1);

  // 计算显示范围
  const start = Math.max(2, currentPage - delta);
  const end = Math.min(totalPages - 1, currentPage + delta);

  // 如果开始页码大于2，添加省略号
  if (start > 2) {
    pages.push('ellipsis');
  }

  // 添加中间页码
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // 如果结束页码小于倒数第二页，添加省略号
  if (end < totalPages - 1) {
    pages.push('ellipsis');
  }

  // 始终显示最后一页（如果总页数大于1）
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

// 分页信息组件
const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,

  totalItems,
  itemsPerPage,
  className,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={clsx('text-sm text-gray-700', className)}>
      显示第 <span className="font-medium">{startItem}</span> 到{' '}
      <span className="font-medium">{endItem}</span> 项，共{' '}
      <span className="font-medium">{totalItems}</span> 项
    </div>
  );
};

// 页码选择器组件
const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  currentSize,
  options,
  onChange,
  className,
}) => {
  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      <span className="text-sm text-gray-700">每页显示</span>
      <select
        value={currentSize}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-700">项</span>
    </div>
  );
};

// 主分页组件
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  className,
}) => {
  // 如果没有数据或只有一页，不显示分页
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className={clsx('flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0', className)}>
      {/* 分页信息 */}
      {showInfo && (
        <PaginationInfo
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* 分页控件 */}
      <div className="flex items-center space-x-2">
        {/* 上一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">上一页</span>
        </Button>

        {/* 页码按钮 */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageClick(page)}
                className={clsx(
                  'min-w-[40px] h-10',
                  currentPage === page && 'font-semibold'
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* 下一页按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1"
        >
          <span className="hidden sm:inline">下一页</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 页码选择器 */}
      {showSizeChanger && onPageSizeChange && (
        <PageSizeSelector
          currentSize={itemsPerPage}
          options={pageSizeOptions}
          onChange={onPageSizeChange}
        />
      )}
    </div>
  );
};

// 简单分页组件（只有上一页/下一页）
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  className?: string;
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  className,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center space-x-2"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>上一页</span>
      </Button>

      {showPageInfo && (
        <span className="text-sm text-gray-700">
          第 {currentPage} 页，共 {totalPages} 页
        </span>
      )}

      <Button
        variant="outline"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center space-x-2"
      >
        <span>下一页</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

// 加载更多组件
interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export const LoadMore: React.FC<LoadMoreProps> = ({
  hasMore,
  loading,
  onLoadMore,
  className,
}) => {
  if (!hasMore) {
    return (
      <div className={clsx('text-center py-8', className)}>
        <p className="text-gray-500">没有更多内容了</p>
      </div>
    );
  }

  return (
    <div className={clsx('text-center py-8', className)}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        loading={loading}
        disabled={loading}
      >
        {loading ? '加载中...' : '加载更多'}
      </Button>
    </div>
  );
};

// 跳转到页面组件
interface JumpToPageProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const JumpToPage: React.FC<JumpToPageProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('flex items-center space-x-2', className)}>
      <span className="text-sm text-gray-700">跳转到</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={currentPage.toString()}
        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="text-sm text-gray-700">页</span>
      <Button type="submit" variant="outline" size="sm">
        跳转
      </Button>
    </form>
  );
};

export default Pagination;