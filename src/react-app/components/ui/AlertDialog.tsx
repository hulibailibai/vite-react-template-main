import React from 'react';
import { clsx } from 'clsx';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = '确定',
    cancelText = '取消',
    onConfirm,
    onCancel,
    showCancel = false
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            case 'warning':
                return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
            case 'error':
                return <AlertCircle className="w-6 h-6 text-red-600" />;
            default:
                return <Info className="w-6 h-6 text-blue-600" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-900';
            case 'warning':
                return 'text-yellow-900';
            case 'error':
                return 'text-red-900';
            default:
                return 'text-blue-900';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 ease-out scale-100 animate-slideUp">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {getIcon()}
                        <h3 className={clsx('text-lg font-semibold', getHeaderColor())}>
                            {title || (type === 'error' ? '错误' : type === 'warning' ? '警告' : type === 'success' ? '成功' : '提示')}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 内容 */}
                <div className="p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* 底部按钮 */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    {showCancel && (
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        variant={type === 'error' ? 'destructive' : 'primary'}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AlertDialog;
