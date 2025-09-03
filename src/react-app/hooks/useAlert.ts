import { useState } from 'react';

export interface AlertState {
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
}

export const useAlert = () => {
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        message: '',
        type: 'info'
    });

    const showAlert = (options: Omit<AlertState, 'isOpen'>) => {
        setAlert({
            ...options,
            isOpen: true
        });
    };

    const hideAlert = () => {
        setAlert(prev => ({
            ...prev,
            isOpen: false
        }));
    };

    // 便捷方法
    const showError = (message: string, title?: string, onConfirm?: () => void) => {
        showAlert({
            type: 'error',
            title,
            message,
            onConfirm
        });
    };

    const showWarning = (message: string, title?: string, onConfirm?: () => void) => {
        showAlert({
            type: 'warning',
            title,
            message,
            onConfirm
        });
    };

    const showSuccess = (message: string, title?: string, onConfirm?: () => void) => {
        showAlert({
            type: 'success',
            title,
            message,
            onConfirm
        });
    };

    const showInfo = (message: string, title?: string, onConfirm?: () => void) => {
        showAlert({
            type: 'info',
            title,
            message,
            onConfirm
        });
    };

    const showConfirm = (
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
        title?: string
    ) => {
        showAlert({
            type: 'warning',
            title,
            message,
            onConfirm,
            onCancel,
            showCancel: true,
            confirmText: '确认',
            cancelText: '取消'
        });
    };

    return {
        alert,
        showAlert,
        hideAlert,
        showError,
        showWarning,
        showSuccess,
        showInfo,
        showConfirm
    };
};

export default useAlert;
