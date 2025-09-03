import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// 输入框尺寸类型
type InputSize = 'sm' | 'md' | 'lg';

// 输入框状态类型
type InputState = 'default' | 'error' | 'success';

// 输入框属性接口
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  state?: InputState;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
}

// 输入框尺寸样式映射
const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

// 输入框状态样式映射
const stateStyles: Record<InputState, string> = {
  default: 'border-transparent focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
  error: 'border-transparent focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
  success: 'border-transparent focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
};

// 输入框组件
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      state = 'default',
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      fullWidth = false,
      showPasswordToggle = false,
      type = 'text',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalType, setInternalType] = useState(type);

    // 处理密码显示切换
    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
      setInternalType(showPassword ? 'password' : 'text');
    };

    // 确定最终状态
    const finalState = errorMessage ? 'error' : state;

    // 基础样式
    const baseStyles = 'block rounded-lg border transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-400 dark:disabled:text-gray-500';
    
    // 输入框样式
    const inputClasses = clsx(
      baseStyles,
      sizeStyles[size],
      stateStyles[finalState],
      fullWidth && 'w-full',
      leftIcon && 'pl-10',
      (rightIcon || (type === 'password' && showPasswordToggle)) && 'pr-10',
      className
    );

    // 容器样式
    const containerClasses = clsx(
      'relative',
      fullWidth && 'w-full'
    );

    return (
      <div className={containerClasses}>
        {/* 标签 */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        {/* 输入框容器 */}
        <div className="relative">
          {/* 左侧图标 */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{leftIcon}</span>
            </div>
          )}
          
          {/* 输入框 */}
          <input
            ref={ref}
            type={type === 'password' && showPasswordToggle ? internalType : type}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
          
          {/* 右侧图标或密码切换 */}
          {(rightIcon || (type === 'password' && showPasswordToggle)) && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {type === 'password' && showPasswordToggle ? (
                <button
                  type="button"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors"
                  onClick={handlePasswordToggle}
                  disabled={disabled}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>
        
        {/* 帮助文本或错误信息 */}
        {(helperText || errorMessage) && (
          <div className="mt-1 flex items-center">
            {errorMessage && (
              <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <p className={clsx(
              'text-xs',
              errorMessage ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            )}>
              {errorMessage || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// 文本域组件
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: InputSize;
  state?: InputState;
  label?: string;
  helperText?: string;
  errorMessage?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      state = 'default',
      label,
      helperText,
      errorMessage,
      fullWidth = false,
      resize = 'vertical',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // 确定最终状态
    const finalState = errorMessage ? 'error' : state;

    // 基础样式
    const baseStyles = 'block rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-400';
    
    // 文本域样式
    const textareaClasses = clsx(
      baseStyles,
      sizeStyles[size],
      stateStyles[finalState],
      fullWidth && 'w-full',
      {
        'resize-none': resize === 'none',
        'resize-y': resize === 'vertical',
        'resize-x': resize === 'horizontal',
        'resize': resize === 'both',
      },
      className
    );

    // 容器样式
    const containerClasses = clsx(
      fullWidth && 'w-full'
    );

    return (
      <div className={containerClasses}>
        {/* 标签 */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        
        {/* 文本域 */}
        <textarea
          ref={ref}
          className={textareaClasses}
          disabled={disabled}
          {...props}
        />
        
        {/* 帮助文本或错误信息 */}
        {(helperText || errorMessage) && (
          <div className="mt-1 flex items-center">
            {errorMessage && (
              <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            <p className={clsx(
              'text-xs',
              errorMessage ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
            )}>
              {errorMessage || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// 搜索输入框组件
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      onClear,
      showClearButton = true,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value);
      }
    };

    const handleClear = () => {
      if (onClear) {
        onClear();
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>}
        rightIcon={showClearButton && value ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : undefined}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;