import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi, tokenManager } from '../services/api';

// 认证状态类型
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  showWelcome: boolean;
  welcomeType: 'new_user' | 'first_login' | null;
}

// 认证动作类型
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SHOW_WELCOME'; payload: { type: 'new_user' | 'first_login' } }
  | { type: 'HIDE_WELCOME' };

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  showWelcome: false,
  welcomeType: null,
};

// 认证reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SHOW_WELCOME':
      return {
        ...state,
        showWelcome: true,
        welcomeType: action.payload.type,
      };
    case 'HIDE_WELCOME':
      return {
        ...state,
        showWelcome: false,
        welcomeType: null,
      };
    default:
      return state;
  }
};

// 认证上下文类型
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string, verificationCode: string, role?: string) => Promise<AuthResponse>;
  oauthLogin: (provider: 'github' | 'google' | 'wechat', code: string, role?: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  showWelcomeCeremony: (type: 'new_user' | 'first_login') => void;
  hideWelcomeCeremony: () => void;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(false);

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    const token = tokenManager.getToken();
    
    if (!token) {
      return;
    }

    if (isCheckingAuth) {
      return;
    }

    setIsCheckingAuth(true);
    dispatch({ type: 'AUTH_START' });
    try {
      const user = await authApi.getCurrentUser();
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
      
      // 检查是否需要显示欢迎仪式
      try {
        const settingsResponse = await authApi.getUserSettings();
        if (!settingsResponse.welcome_shown) {
          dispatch({ type: 'SHOW_WELCOME', payload: { type: 'first_login' } });
        }
      } catch (error) {
        console.error('Failed to check welcome status:', error);
      }
    } catch (error) {
      // Token无效，清除本地存储
      tokenManager.clearToken();
      dispatch({
        type: 'AUTH_FAILURE',
        payload: '认证已过期，请重新登录',
      });
    } finally {
      setIsCheckingAuth(false);
    }
  }, [isCheckingAuth]);

  // 用户登录
  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authApi.login({ email, password });
      
      // 保存token
      tokenManager.setToken(response.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      
      // 检查是否需要显示欢迎仪式（仅首次登录）
      try {
        const settingsResponse = await authApi.getUserSettings();
        if (!settingsResponse.welcome_shown) {
          dispatch({ type: 'SHOW_WELCOME', payload: { type: 'first_login' } });
        }
      } catch (error) {
        // 如果获取设置失败，默认显示欢迎仪式
        dispatch({ type: 'SHOW_WELCOME', payload: { type: 'first_login' } });
      }
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : '登录失败',
      });
      throw error;
    }
  }, []);

  // 用户注册
  const register = useCallback(async (username: string, email: string, password: string, verificationCode: string, role: string = 'user') => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authApi.register({
        username,
        email,
        password,
        verificationCode,
        role: role as 'user' | 'creator' | 'advertiser',
      });
      
      // 保存token
      tokenManager.setToken(response.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      
      // 新用户注册成功后显示欢迎仪式
      dispatch({ type: 'SHOW_WELCOME', payload: { type: 'new_user' } });
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : '注册失败',
      });
      throw error;
    }
  }, []);

  // OAuth登录
  const oauthLogin = useCallback(async (provider: 'github' | 'google' | 'wechat', code: string, role: string = 'user') => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authApi.oauthLogin(provider, code, role);
      
      // 保存token
      tokenManager.setToken(response.token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
      
      // 检查是否需要显示欢迎仪式
      try {
        const settingsResponse = await authApi.getUserSettings();
        if (!settingsResponse.welcome_shown) {
          // OAuth登录默认为首次登录类型
          dispatch({ type: 'SHOW_WELCOME', payload: { type: 'first_login' } });
        }
      } catch (error) {
        // 如果获取设置失败，默认显示欢迎仪式
        dispatch({ type: 'SHOW_WELCOME', payload: { type: 'first_login' } });
      }
      
      return response;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error instanceof Error ? error.message : 'OAuth登录失败',
      });
      throw error;
    }
  }, []);

  // 用户登出
  const logout = useCallback(() => {
    tokenManager.clearToken();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // 更新用户信息
  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      const updatedUser = await authApi.updateProfile(userData);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      throw error;
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // 显示欢迎仪式
  const showWelcomeCeremony = useCallback((type: 'new_user' | 'first_login') => {
    dispatch({ type: 'SHOW_WELCOME', payload: { type } });
  }, []);

  // 隐藏欢迎仪式
  const hideWelcomeCeremony = useCallback(() => {
    dispatch({ type: 'HIDE_WELCOME' });
  }, []);

  // 组件挂载时检查认证状态
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      if (token) {
        await checkAuth();
      }
    };
    initAuth();
  }, []); // 移除checkAuth依赖，避免循环调用

  const value: AuthContextType = {
    ...state,
    login,
    register,
    oauthLogin,
    logout,
    updateUser,
    clearError,
    checkAuth,
    showWelcomeCeremony,
    hideWelcomeCeremony,
  };



  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 权限检查Hook
export const usePermission = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (roles: string | string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return hasRole(['admin', 'super_admin']);
  };

  const isCreator = (): boolean => {
    return hasRole(['creator', 'admin', 'super_admin']);
  };

  const isAdvertiser = (): boolean => {
    return hasRole(['advertiser', 'admin', 'super_admin']);
  };

  const canManageWorkflow = (creatorId: number): boolean => {
    if (!isAuthenticated || !user) return false;
    return user.role === 'admin' || user.role === 'super_admin' || user.id === creatorId;
  };

  return {
    hasRole,
    isAdmin,
    isCreator,
    isAdvertiser,
    canManageWorkflow,
  };
};

// 导出认证上下文
export default AuthContext;