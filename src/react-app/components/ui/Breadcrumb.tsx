import React from 'react';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// 面包屑项目接口
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// 面包屑组件属性接口
interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// 面包屑组件
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={clsx('flex items-center space-x-2 text-sm text-gray-600', className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          {item.href ? (
            <a
              href={item.href}
              className="hover:text-blue-600 transition-colors duration-200"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};