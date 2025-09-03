import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertDialog } from '../components/ui/AlertDialog';

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

interface AlertContextType {
  showAlert: (message: string, type?: AlertState['type'], title?: string) => Promise<boolean>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showError: (message: string, title?: string) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => Promise<boolean>;
  showWarning: (message: string, title?: string) => Promise<boolean>;
  showInfo: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showAlert = (
    message: string,
    type: AlertState['type'] = 'info',
    title?: string,
    showCancel: boolean = false
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setAlert({
        isOpen: true,
        message,
        type,
        title,
        showCancel,
        confirmText: '确定',
        cancelText: '取消'
      });
    });
  };

  const showConfirm = (message: string, title?: string): Promise<boolean> => {
    return showAlert(message, 'warning', title, true);
  };

  const showError = (message: string, title?: string): Promise<boolean> => {
    return showAlert(message, 'error', title);
  };

  const showSuccess = (message: string, title?: string): Promise<boolean> => {
    return showAlert(message, 'success', title);
  };

  const showWarning = (message: string, title?: string): Promise<boolean> => {
    return showAlert(message, 'warning', title);
  };

  const showInfo = (message: string, title?: string): Promise<boolean> => {
    return showAlert(message, 'info', title);
  };

  const handleClose = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  };

  const handleConfirm = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  };

  const handleCancel = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert: (message, type, title) => showAlert(message, type, title, false),
        showConfirm,
        showError,
        showSuccess,
        showWarning,
        showInfo
      }}
    >
      {children}
      <AlertDialog
        isOpen={alert.isOpen}
        onClose={handleClose}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        showCancel={alert.showCancel}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};