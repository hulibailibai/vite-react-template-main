import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Code, 
  Image, 
  Link,
  List,
  ListOrdered,
  Quote,
  Type,
  Edit,
  Eye
} from 'lucide-react';
import { Button } from './Button';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "输入内容...",
  className = "",
  onImageUpload
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isPreview, setIsPreview] = useState(true);

  // 插入文本到光标位置
  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    
    // 如果当前是预览模式，先切换到编辑模式
    if (isPreview) {
      setIsPreview(false);
      // 延迟执行插入操作，确保编辑模式已激活
      setTimeout(() => {
        if (!textarea) return;
        const start = textarea.selectionStart || value.length;
        const end = textarea.selectionEnd || value.length;
        const selectedText = value.substring(start, end);
        const textToInsert = selectedText || placeholder;
        
        const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
        onChange(newText);
        
        // 重新设置光标位置并切换回预览模式
        setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + before.length + textToInsert.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          // 短暂延迟后切换回预览模式
          setTimeout(() => setIsPreview(true), 100);
        }, 0);
      }, 50);
      return;
    }

    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);
    
    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, isPreview]);

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) {
      // 如果没有上传函数，创建本地预览URL
      const url = URL.createObjectURL(file);
      insertText(`![${file.name}](${url})`);
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await onImageUpload(file);
      insertText(`![${file.name}](${imageUrl})`);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // 插入链接
  const insertLink = () => {
    const url = prompt('请输入链接地址:');
    if (url) {
      const text = prompt('请输入链接文本:') || '链接';
      insertText(`[${text}](${url})`);
    }
  };

  // 渲染Markdown预览
  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left: 4px solid #e2e8f0; margin: 16px 0; padding-left: 16px; color: #64748b; font-style: italic;">$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li style="margin-left: 20px; list-style-type: disc;">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li style="margin-left: 20px; list-style-type: decimal;">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />')
      .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; margin: 16px 0;"><code>$1</code></pre>')
      .replace(/\n/g, '<br />');
  };

  // 工具栏按钮配置
  const toolbarButtons = [
    {
      icon: Bold,
      title: '粗体 (Ctrl+B)',
      action: () => insertText('**', '**', '粗体文本')
    },
    {
      icon: Italic,
      title: '斜体 (Ctrl+I)',
      action: () => insertText('*', '*', '斜体文本')
    },
    {
      icon: Code,
      title: '内联代码',
      action: () => insertText('`', '`', '代码')
    },
    {
      icon: Quote,
      title: '引用',
      action: () => insertText('> ', '', '引用文本')
    },
    {
      icon: List,
      title: '无序列表',
      action: () => insertText('- ', '', '列表项')
    },
    {
      icon: ListOrdered,
      title: '有序列表',
      action: () => insertText('1. ', '', '列表项')
    },
    {
      icon: Link,
      title: '插入链接',
      action: insertLink
    }
  ];

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('**', '**', '粗体文本');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', '斜体文本');
          break;
      }
    }
  }, [insertText]);

  // 处理预览模式下的键盘事件
  const handlePreviewKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('**', '**', '粗体文本');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', '斜体文本');
          break;
      }
    }
  }, [insertText]);



  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center space-x-1 flex-wrap">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={button.action}
              title={button.title}
              className="p-2 h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <button.icon className="w-4 h-4" />
            </Button>
          ))}
          
          {/* 图片上传按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="上传图片"
            className="p-2 h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-700"
            disabled={uploading}
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <Image className="w-4 h-4" />
            )}
          </Button>
          
          {/* 代码块按钮 */}
          <Button
             variant="ghost"
             size="sm"
             onClick={() => insertText('```\n', '\n```', '代码')}
             title="代码块"
             className="p-2 h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
           >
             <Type className="w-4 h-4" />
           </Button>
           
           {/* 预览切换按钮 */}
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsPreview(!isPreview)}
             title={isPreview ? '编辑模式' : '预览模式'}
             className="p-2 h-10 w-10 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
           >
             {isPreview ? <Edit className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
           </Button>
        </div>
      </div>
      
      {/* 编辑区域 */}
      {isPreview ? (
        <div 
          className="w-full p-4 min-h-[200px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
          onKeyDown={handlePreviewKeyDown}
          tabIndex={0} // 使div可以接收键盘事件
          onDoubleClick={() => setIsPreview(false)} // 双击切换到编辑模式
          title="双击切换到编辑模式"
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full p-4 min-h-[200px] bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
        />
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImageUpload(file);
          }
          // 重置文件输入，允许选择相同文件
          e.target.value = '';
        }}
        className="hidden"
      />
      
      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>{isPreview ? '实时预览模式 - 双击切换编辑' : '编辑模式'} - 支持 Markdown 语法</span>
        <span>{value.length} 字符</span>
      </div>
    </div>
  );
};