import React, { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

// 卡片变体类型
type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

// 卡片尺寸类型
type CardSize = 'sm' | 'md' | 'lg';

// 卡片属性接口
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  hoverable?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
}

// 卡片变体样式映射
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
  outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
  elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
  filled: 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
};

// 卡片尺寸样式映射
const sizeStyles: Record<CardSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

// 卡片组件
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hoverable = false,
      clickable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-lg transition-all duration-200';
    
    const cardClasses = clsx(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      hoverable && 'hover:shadow-md hover:-translate-y-1',
      clickable && 'cursor-pointer hover:shadow-md',
      className
    );

    return (
      <div
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// 卡片头部组件
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && (
          <div className="ml-4 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// 卡片内容组件
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('text-gray-700 dark:text-gray-300', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// 卡片标题组件
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className, ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={clsx(
          'text-lg font-semibold text-gray-900 dark:text-white',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// 卡片底部组件
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, justify = 'end', className, ...props }, ref) => {
    const justifyStyles = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center mt-4 pt-4 border-t border-gray-700',
          justifyStyles[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// 统计卡片组件
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  className,
}) => {
  const changeStyles = {
    increase: 'text-green-600 bg-green-100',
    decrease: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100',
  };

  return (
    <Card className={clsx('relative overflow-hidden', className)}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-300 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                changeStyles[change.type]
              )}>
                {change.type === 'increase' && '↗'}
                {change.type === 'decrease' && '↘'}
                {change.type === 'neutral' && '→'}
                {change.value}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-blue-900 rounded-lg flex items-center justify-center text-blue-400">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// 图片卡片组件
interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  aspectRatio?: 'square' | 'video' | 'wide';
  className?: string;
  onClick?: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  src,
  alt,
  title,
  description,
  action,
  aspectRatio = 'video',
  className,
  onClick,
}) => {
  const aspectRatioStyles = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
  };

  return (
    <Card 
      className={clsx('overflow-hidden', className)}
      clickable={!!onClick}
      onClick={onClick}
    >
      <div className={clsx('relative', aspectRatioStyles[aspectRatio])}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
        {action && (
          <div className="absolute top-2 right-2">
            {action}
          </div>
        )}
      </div>
      {(title || description) && (
        <div className="p-4">
          {title && (
            <h3 className="text-lg font-semibold text-white mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-300">
              {description}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

// 加载卡片组件
interface LoadingCardProps {
  lines?: number;
  showImage?: boolean;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  lines = 3,
  showImage = false,
  className,
}) => {
  return (
    <Card className={clsx('animate-pulse', className)}>
      {showImage && (
        <div className="bg-gray-600 aspect-video rounded-t-lg mb-4"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'bg-gray-600 rounded',
              index === 0 ? 'h-4' : 'h-3',
              index === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          ></div>
        ))}
      </div>
    </Card>
  );
};

export default Card;