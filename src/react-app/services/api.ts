import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Workflow,
  Category,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  // WorkflowCreateRequest, // 注释掉未使用的类型
  // WorkflowUpdateRequest, // 注释掉未使用的类型
  WorkflowSearchParams,
  DashboardStats,
  CreatorStats,
  HomeStats,
  // Review, // Commented out - review functionality disabled
  CreatorApplication,
  CreatorApplicationRequest,
  CreatorApplicationReview,
  // Transaction, // 注释掉未使用的类型
  WalletBalance,
  SubscribeResponse,
  SubscriptionStatus
} from '../types';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建axios实例
class ApiClient {
  public client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30秒超时，解决注册超时问题
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加认证token
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        // 统一错误处理
        if (error.response?.status === 401) {
          // 清除token并跳转到登录页
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    // 从localStorage恢复token
    this.token = localStorage.getItem('auth_token');
  }

  // 设置认证token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // 清除认证token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // 获取当前token
  getToken(): string | null {
    if (!this.token) {
      // 尝试从localStorage恢复token
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  // 通用请求方法
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<T> {
    const requestId = Math.random().toString(36).substr(2, 9);
    const requestInfo = {
      requestId,
      method,
      url,
      data,
      params,
      timestamp: new Date().toISOString(),
      baseURL: this.client.defaults.baseURL
    };
    
    console.log('[ApiClient] 发起请求:', requestInfo);
    
    try {
      const response = await this.client.request<ApiResponse<T>>({
        method,
        url,
        data,
        params,
      });
      
      console.log('[ApiClient] 收到响应:', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        timestamp: new Date().toISOString()
      });

      // 检查响应状态码
      if (response.data.code === 200) {
        // 对于DELETE请求，如果data为null且T为void，返回undefined
        if (method === 'DELETE' && response.data.data === null) {
          return undefined as T;
        }
        return response.data.data as T;
      } else {
        console.error('[ApiClient] 业务逻辑错误:', {
          requestId,
          code: response.data.code,
          message: response.data.message,
          timestamp: new Date().toISOString()
        });
        throw new Error(response.data.message || '请求失败');
      }
    } catch (error) {
      console.error('[ApiClient] 请求异常:', {
        requestId,
        error,
        errorMessage: error instanceof Error ? error.message : '未知错误',
        isAxiosError: axios.isAxiosError(error),
        errorCode: axios.isAxiosError(error) ? error.code : undefined,
        errorResponse: axios.isAxiosError(error) ? error.response : undefined,
        errorRequest: axios.isAxiosError(error) ? error.request : undefined,
        timestamp: new Date().toISOString()
      });
      
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '请求失败');
      }
      throw error;
    }
  }

  // GET请求
  async get<T>(url: string, params?: any): Promise<T> {
    return this.request<T>('GET', url, undefined, params);
  }

  // POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('POST', url, data);
  }

  // PUT请求
  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('PUT', url, data);
  }

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    return this.request<T>('DELETE', url);
  }
}

// 创建API客户端实例
const apiClient = new ApiClient();

// 认证相关API
export const authApi = {
  // 发送邮箱验证码
  sendVerificationCode: (email: string): Promise<{ verificationCode?: string }> => {
    return apiClient.post<{ verificationCode?: string }>('/auth/send-verification-code', { email });
  },

  // 验证邮箱验证码
  verifyEmailCode: (email: string, code: string): Promise<void> => {
    return apiClient.post<void>('/auth/verify-email-code', { email, code });
  },

  // 用户注册
  register: async (data: RegisterRequest & { verificationCode: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/register', data);
    return response;
  },

  // 用户登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<{ user: User; token: string }>('/auth/login', data);
    return response;
  },

  // OAuth注册/登录（带重试机制）
  oauthLogin: async (provider: 'github' | 'google' | 'wechat', code: string, role?: string): Promise<AuthResponse> => {
    const maxRetries = 3;
    const retryDelay = 3000; // 3秒
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiClient.post<{ user: User; token: string }>(`/auth/oauth/${provider}`, { code, role });
        return response;
      } catch (error) {
        console.log(`OAuth登录尝试 ${attempt}/${maxRetries} 失败:`, error);
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 等待3秒后重试
        console.log(`等待 ${retryDelay/1000} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // 这行代码理论上不会执行到，但为了TypeScript类型检查
    throw new Error('OAuth登录失败');
  },

  // 获取OAuth授权URL
  getOAuthUrl: (provider: 'github' | 'google' | 'wechat', redirectUri?: string): Promise<{ authUrl: string }> => {
    return apiClient.get<{ authUrl: string }>(`/auth/oauth/${provider}/url`, { redirect_uri: redirectUri });
  },

  // 解绑OAuth账号
  unbindOAuth: (provider: 'wechat'): Promise<void> => {
    return apiClient.delete<void>(`/user/oauth/${provider}/unbind`);
  },

  // 获取当前用户信息
  getCurrentUser: (): Promise<User> => {
    return apiClient.get<User>('/user/profile');
  },

  // 更新用户信息
  updateProfile: (data: Partial<User>): Promise<User> => {
    return apiClient.put<User>('/user/profile', data);
  },

  // 获取用户设置
  getUserSettings: (): Promise<{ welcome_shown: boolean; email_notifications: boolean; push_notifications: boolean }> => {
    return apiClient.get<{ welcome_shown: boolean; email_notifications: boolean; push_notifications: boolean }>('/user/settings');
  },

  // 更新用户设置
  updateUserSettings: (data: { welcome_shown?: boolean; email_notifications?: boolean; push_notifications?: boolean }): Promise<{ welcome_shown: boolean; email_notifications: boolean; push_notifications: boolean }> => {
    return apiClient.put<{ welcome_shown: boolean; email_notifications: boolean; push_notifications: boolean }>('/user/settings', data);
  },

  // 获取用户偏好设置
  getUserPreferences: (): Promise<Record<string, string>> => {
    return apiClient.get<Record<string, string>>('/user/preferences');
  },

  // 更新用户偏好设置
  updateUserPreferences: (preferences: Record<string, string>): Promise<Record<string, string>> => {
    return apiClient.put<Record<string, string>>('/user/preferences', preferences);
  },

  // 获取单个偏好设置
  getUserPreference: (key: string): Promise<Record<string, string>> => {
    return apiClient.get<Record<string, string>>(`/user/preferences/${key}`);
  },

  // 更新单个偏好设置
  updateUserPreference: (key: string, value: string): Promise<Record<string, string>> => {
    return apiClient.put<Record<string, string>>(`/user/preferences/${key}`, { value });
  },
};

// 工作流相关API - 已移除workflows表依赖
/*
export const workflowApi = {
  // 获取工作流列表
  getWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/coze-workflows', params);
  },

  // 获取工作流详情
  getWorkflow: (id: number): Promise<Workflow> => {
    return apiClient.get<Workflow>(`/coze-workflows/${id}`);
  },

  // 创建工作流
  createWorkflow: (data: WorkflowCreateRequest): Promise<Workflow> => {
    return apiClient.post<Workflow>('/coze-workflows', data);
  },

  // 更新工作流
  updateWorkflow: (id: number, data: WorkflowUpdateRequest): Promise<Workflow> => {
    return apiClient.put<Workflow>(`/coze-workflows/${id}`, data);
  },

  // 删除工作流
  deleteWorkflow: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/coze-workflows/${id}`);
  },

  // 搜索工作流
  searchWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/search/coze-workflows', params);
  },

  // 购买工作流
  purchaseWorkflow: (id: number, data?: { payment_method?: 'wh_coins' | 'paypal' }): Promise<{ 
    success: boolean; 
    message: string; 
    transaction_id?: number; 
    payment_url?: string; 
    amount?: number; 
    workflow_title?: string;
    wh_coins_used?: number;
    remaining_balance?: number;
  }> => {
    return apiClient.post<{ 
      success: boolean; 
      message: string; 
      transaction_id?: number; 
      payment_url?: string; 
      amount?: number; 
      workflow_title?: string;
      wh_coins_used?: number;
      remaining_balance?: number;
    }>(`/coze-workflows/${id}/purchase`, data);
  },

  // 点赞工作流
  likeWorkflow: (id: number): Promise<{ success: boolean; message: string; liked: boolean }> => {
    return apiClient.post<{ success: boolean; message: string; liked: boolean }>(`/coze-workflows/${id}/like`);
  },

  // 收藏工作流  
  favoriteWorkflow: (id: number): Promise<{ success: boolean; message: string; favorited: boolean }> => {
    return apiClient.post<{ success: boolean; message: string; favorited: boolean }>(`/coze-workflows/${id}/favorite`);
  },

  // 下载工作流
  downloadWorkflow: (id: number): Promise<{ success: boolean; message: string; download_url: string; filename: string }> => {
    return apiClient.post<{ success: boolean; message: string; download_url: string; filename: string }>(`/coze-workflows/${id}/download`);
  },

  // 获取用户对工作流的互动状态
  getUserWorkflowStatus: (id: number): Promise<{ liked: boolean; favorited: boolean; purchased: boolean }> => {
    return apiClient.get<{ liked: boolean; favorited: boolean; purchased: boolean }>(`/coze-workflows/${id}/user-status`);
  },

  // 记录浏览量
  recordView: (id: number): Promise<{ success: boolean; message: string; view_count: number }> => {
    return apiClient.post<{ success: boolean; message: string; view_count: number }>(`/coze-workflows/${id}/view`);
  },

  // 获取分类列表
  getCategories: (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  // 获取用户交易记录
  getUserTransactions: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Transaction & { 
    type: string; 
    description: string; 
    workflow_title?: string; 
    workflow_id?: number; 
  }>> => {
    return apiClient.get<PaginatedResponse<Transaction & { 
      type: string; 
      description: string; 
      workflow_title?: string; 
      workflow_id?: number; 
    }>>('/user/transactions', params);
  },

  // 获取用户购买记录
  getUserPurchases: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<{
    id: number;
    user_id: number;
    workflow_id: number;
    action: string;
    created_at: string;
    workflow_title: string;
    workflow_description: string;
    workflow_price: number;
    workflow_preview_images: string[];
    category_name: string;
  }>> => {
    return apiClient.get<PaginatedResponse<{
      id: number;
      user_id: number;
      workflow_id: number;
      action: string;
      created_at: string;
      workflow_title: string;
      workflow_description: string;
      workflow_price: number;
      workflow_preview_images: string[];
      category_name: string;
    }>>('/user/purchases', params);
  },
};
*/

// 分类相关API
export const categoryApi = {
  // 获取所有分类
  getCategories: (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  // 获取单个分类
  getCategory: (id: number): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },
  
  // 获取分类下的标签
  getTagsByCategory: (categoryId: number): Promise<{ data: any[] }> => {
    return apiClient.get<{ data: any[] }>(`/categories/${categoryId}/tags`);
  },
};

// 国家API
export const countryApi = {
  // 获取所有国家
  getCountries: (): Promise<{ data: any[] }> => {
    return apiClient.get<{ data: any[] }>('/countries');
  },
};

// 创作者相关API
// 用户任务相关API
export const taskApi = {
  // 获取可参与的任务列表
  getAvailableTasks: (params?: { page?: number; pageSize?: number; search?: string; category?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/tasks', params);
  },

  // 获取任务详情
  getTaskDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/tasks/${id}`);
  },

  // 提交任务
  submitTask: (taskId: number, data: {
    content: string;
    attachments?: string[];
  }): Promise<any> => {
    return apiClient.post<any>(`/tasks/${taskId}/submit`, data);
  },

  // 获取我的任务提交记录
  getMySubmissions: (params?: { page?: number; pageSize?: number; status?: string; task_id?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/my-task-submissions', params);
  },

  // 获取我的提交详情
  getMySubmissionDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/my-task-submissions/${id}`);
  },

  // 更新我的提交
  updateMySubmission: (id: number, data: {
    content: string;
    attachments?: string[];
  }): Promise<any> => {
    return apiClient.put<any>(`/my-task-submissions/${id}`, data);
  },

  // 撤回我的提交（仅在待审核状态下）
  withdrawMySubmission: (id: number): Promise<any> => {
    return apiClient.delete<any>(`/my-task-submissions/${id}`);
  },

  // 检查任务参与状态
  checkTaskParticipation: (taskId: number): Promise<{ participated: boolean; submission_id?: number; status?: string }> => {
    return apiClient.get<{ participated: boolean; submission_id?: number; status?: string }>(`/tasks/${taskId}/participation`);
  },

  // 领取任务
  claimTask: (taskId: number): Promise<{ success: boolean; message: string; submission_id?: number }> => {
    return apiClient.post<{ success: boolean; message: string; submission_id?: number }>(`/tasks/${taskId}/claim`);
  },

  // 取消任务领取
  cancelTaskClaim: (taskId: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/tasks/${taskId}/claim`);
  },

  // 获取任务统计信息
  getTaskStats: (): Promise<{
    total_participated: number;
    pending_submissions: number;
    approved_submissions: number;
    rejected_submissions: number;
    total_earnings: number;
  }> => {
    return apiClient.get<{
      total_participated: number;
      pending_submissions: number;
      approved_submissions: number;
      rejected_submissions: number;
      total_earnings: number;
    }>('/my-task-stats');
  },

  // 为任务提交工作流
  submitWorkflowForTask: (data: {
    taskId: number;
    title: string;
    description?: string;
    category: string;
    tags?: string[];
    price?: number;
    download_price?: number;
    type?: string;
    isMemberFree?: boolean;
    isDownloadMemberFree?: boolean;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    coverImageUrl?: string;
    previewImages?: string[];
    previewVideoUrl?: string;
    quickCommands?: string[];
  }): Promise<any> => {
    return apiClient.post('/creator/coze-workflows/task-submission', data);
  },

  // 获取任务的工作流数据（用于重新提交时的数据回填）
  getTaskWorkflow: (taskId: number): Promise<{
    id: number;
    title: string;
    description: string;
    category_id: number;
    tags: string[];
    price: number;
    download_price?: number;
    type: string;
    is_member_free: boolean;
    is_download_member_free?: boolean;
    workflow_file_url: string;
    workflow_file_name?: string;
    workflow_file_size?: number;
    cover_image_url?: string;
    preview_images?: string[];
    preview_video_url?: string;
    coze_api?: string;
    quick_commands?: string[];
    status: string;
    created_at: string;
    file_url?: string;
  } | null> => {
    return apiClient.get<{
      id: number;
      title: string;
      description: string;
      category_id: number;
      tags: string[];
      price: number;
      download_price?: number;
      type: string;
      is_member_free: boolean;
      is_download_member_free?: boolean;
      workflow_file_url: string;
      workflow_file_name?: string;
      workflow_file_size?: number;
      cover_image_url?: string;
      preview_images?: string[];
      preview_video_url?: string;
      coze_api?: string;
      quick_commands?: string[];
      status: string;
      created_at: string;
      file_url?: string;
    } | null>(`/tasks/${taskId}/workflow`);
  },
};

export const creatorApi = {
  // 获取创作者工作流
  getCreatorWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/creator/coze-workflows', params);
  },



  // 获取创作者统计数据
  getCreatorStats: (): Promise<CreatorStats | { data: any }> => {
    return apiClient.get<CreatorStats | { data: any }>('/creator/stats');
  },

  // 创作者申请相关API
  // 提交创作者申请
  applyToBeCreator: (data: {
    country: string;
    linkedin?: string;
    experience: string;
    portfolio?: string;
    reason: string;
    skills: string;
  }): Promise<{ id: number; status: string; message: string }> => {
    return apiClient.post<{ id: number; status: string; message: string }>('/creator/apply', data);
  },

  // 获取用户的创作者申请状态
  getApplication: (): Promise<any> => {
    return apiClient.get<any>('/creator/application');
  },

  // 更新创作者申请
  updateApplication: (id: number, data: {
    country: string;
    linkedin?: string;
    experience: string;
    portfolio?: string;
    reason: string;
    skills: string;
  }): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(`/creator/application/${id}`, data);
  },

  // 撤回创作者申请
  withdrawApplication: (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/creator/application/${id}`);
  },

  // 删除AI应用（创作者）
  // AI app methods removed as ai_apps table no longer exists
  // deleteAIApp and updateAIApp methods removed
  updateWorkflow: (id: number, data: any): Promise<any> => {
    return apiClient.put(`/creator/coze-workflows/${id}`, data);
  },
  // 更新工作流状态（创作者）
  updateWorkflowStatus: (id: number, status: string): Promise<any> => {
    return apiClient.put(`/creator/coze-workflows/${id}/status`, { status });
  },
  // 更新AI应用状态（创作者）
  // updateAIAppStatus method removed as ai_apps table no longer exists
  // 删除工作流（创作者）
  deleteWorkflow: (id: number): Promise<void> => {
    return apiClient.delete(`/creator/coze-workflows/${id}`);
  },

  // 获取创作者收益记录
  getEarningsHistory: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<{
    id: number;
    commission_record_id: number;
    day_number: number;
    wh_coins_amount: number;
    reason: string;
    scheduled_date: string;
    actual_date: string | null;
    transaction_id: number | null;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    completed_at: string | null;
    total_commission: number;
  }>> => {
    return apiClient.get('/creator/earnings-history', params);
  },
};

// 管理员相关API
export const adminApi = {
  // 获取仪表板统计数据
  getDashboardStats: (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/admin/dashboard/stats');
  },

  // 任务管理相关API
  getTasks: (params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/tasks', params);
  },

  getTaskDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/admin/tasks/${id}`);
  },

  createTask: (data: {
    title: string;
    description: string;
    reward_amount: number;
    submission_format: string;
    deadline: string;
    status?: 'draft' | 'published';
    category?: string;
  }): Promise<any> => {
    return apiClient.post<any>('/admin/tasks', data);
  },

  updateTask: (id: number, data: {
    title?: string;
    description?: string;
    reward_amount?: number;
    submission_types?: string;
    deadline?: string;
    status?: 'draft' | 'published' | 'completed' | 'cancelled';
    category?: string;
  }): Promise<any> => {
    return apiClient.put<any>(`/admin/tasks/${id}`, data);
  },

  deleteTask: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/tasks/${id}`);
  },

  updateTaskStatus: (id: number, status: 'draft' | 'published' | 'completed' | 'cancelled'): Promise<any> => {
    return apiClient.put<any>(`/admin/tasks/${id}/status`, { status });
  },

  // 任务提交管理相关API
  getTaskSubmissions: (params?: { 
    page?: number; 
    pageSize?: number; 
    search?: string; 
    status?: string; 
    task_id?: number;
    user_id?: number;
  }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/task-submissions', params);
  },

  getTaskSubmissionDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/admin/task-submissions/${id}`);
  },

  reviewSubmission: (id: number, data: {
    status: 'approved' | 'rejected';
    comment?: string;
  }): Promise<any> => {
    return apiClient.put<any>(`/admin/task-submissions/${id}/review`, data);
  },

  batchReviewSubmissions: (data: {
    submission_ids: number[];
    status: 'approved' | 'rejected';
    comment?: string;
  }): Promise<any> => {
    return apiClient.post<any>('/admin/task-submissions/batch-review', data);
  },

  // 获取待审核工作流
  // 已移除workflows表依赖
  /*
  getPendingWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/admin/coze-workflows', {
      ...params,
      status: 'pending',
    });
  },

  // 审核工作流
  reviewWorkflow: (id: number, status: 'approved' | 'rejected', reason?: string): Promise<Workflow> => {
    return apiClient.put<Workflow>(`/admin/coze-workflows/${id}/status`, { status, reason });
  },

  // 获取所有工作流（管理员）
  getAllWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/admin/coze-workflows', params);
  },
  updateWorkflowStatus: (id: number, status: string, reason?: string): Promise<Workflow> => {
    return apiClient.put<Workflow>(`/admin/coze-workflows/${id}/status`, { status, reason });
  },
  */

  // 用户管理
  getAllUsers: (params?: { page?: number; pageSize?: number; search?: string; role?: string; status?: string }): Promise<PaginatedResponse<User>> => {
    return apiClient.get<PaginatedResponse<User>>('/admin/users', params);
  },

  // 获取用户详情
  getUserDetail: (id: number): Promise<User> => {
    return apiClient.get<User>(`/admin/users/${id}`);
  },

  // 更新用户状态
  updateUserStatus: (id: number, status: 'active' | 'banned' | 'pending' | 'suspended' | 'deleted'): Promise<User> => {
    return apiClient.put<User>(`/admin/users/${id}/status`, { status });
  },

  // 更新用户信息
  updateUser: (id: number, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/admin/users/${id}`, data);
  },

  // 删除用户
  deleteUser: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/users/${id}`);
  },

  // 删除工作流（管理员） - 已移除workflows表依赖
  // deleteWorkflow: (id: number): Promise<void> => {
  //   return apiClient.delete<void>(`/admin/workflows/${id}`);
  // },

  // Coze工作流管理相关API
  // 获取所有coze工作流（管理员）
  getAllCozeWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    return apiClient.get<PaginatedResponse<Workflow>>('/admin/coze-workflows', params);
  },

  // 更新coze工作流状态
  updateCozeWorkflowStatus: (id: number, status: string, reason?: string): Promise<Workflow> => {
    return apiClient.put<Workflow>(`/admin/coze-workflows/${id}/status`, { status, reason });
  },

  // 删除coze工作流（管理员）
  deleteCozeWorkflow: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/coze-workflows/${id}`);
  },

  // 创建coze工作流（管理员）
  createCozeWorkflow: (data: {
    title: string;
    description: string;
    category_id: number;
    tags: string[];
    price: number; // 运行价格
    download_price?: number; // 下载价格
    type: string;
    is_member_free: boolean;
    file_url: string;
    file_name?: string;
    file_size?: number;
    cover_image_url?: string;
    preview_video_url?: string;
    coze_api?: string;
    quick_commands?: string[];
    creator_id: number;
  }): Promise<Workflow> => {
    return apiClient.post<Workflow>('/admin/coze-workflows', data);
  },

  // 更新coze工作流信息（管理员）
  updateCozeWorkflow: (id: number, data: Partial<{
    title: string;
    description: string;
    category_id: number;
    tags: string[];
    price: number; // 运行价格
    download_price?: number; // 下载价格
    type: string;
    is_member_free: boolean;
    file_url: string;
    file_name?: string;
    file_size?: number;
    cover_image_url?: string;
    preview_video_url?: string;
    coze_api?: string;
    quick_commands?: string[];
    is_featured: boolean;
  }>): Promise<Workflow> => {
    return apiClient.put<Workflow>(`/admin/coze-workflows/${id}`, data);
  },

  // AI应用管理
  // 获取所有AI应用（管理员）
  getAllAIApps: (params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/ai-apps', params);
  },

  // 获取AI应用详情（管理员）
  getAIAppDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/admin/ai-apps/${id}`);
  },

  // 更新AI应用状态
  updateAIAppStatus: (id: number, status: 'approved' | 'rejected' | 'pending', reason?: string): Promise<any> => {
    return apiClient.put<any>(`/admin/ai-apps/${id}/status`, { status, reason });
  },

  // 更新AI应用信息
  updateAIApp: (id: number, data: Partial<any>): Promise<any> => {
    return apiClient.put<any>(`/admin/ai-apps/${id}`, data);
  },

  // 删除AI应用
  deleteAIApp: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/ai-apps/${id}`);
  },

  // 创作者申请管理
  getCreatorApplications: (params?: { page?: number; pageSize?: number; status?: string; search?: string }): Promise<PaginatedResponse<CreatorApplication>> => {
    return apiClient.get<PaginatedResponse<CreatorApplication>>('/admin/creator-applications', params);
  },

  reviewCreatorApplication: (id: number, data: { status: 'approved' | 'rejected'; admin_comment?: string }): Promise<CreatorApplication> => {
    return apiClient.put<CreatorApplication>(`/admin/creator-applications/${id}/review`, data);
  },

  // 提现请求管理
  getWithdrawalRequests: (params?: { page?: number; pageSize?: number; status?: string; user_id?: number; min_amount?: number; max_amount?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/withdrawal-requests', params);
  },

  reviewWithdrawalRequest: (id: number, data: { status: 'approved' | 'rejected'; admin_comment?: string }): Promise<any> => {
    return apiClient.put<any>(`/admin/withdrawal-requests/${id}/review`, data);
  },

  // 创作者收益历史
  getCreatorEarningsHistory: (creatorId: number, params?: { page?: number; pageSize?: number; type?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>(`/admin/creators/${creatorId}/earnings`, params);
  },

  // 创作者等级管理
  getCreatorLevels: (): Promise<any[]> => {
    return apiClient.get<any[]>('/admin/creator-levels');
  },

  createCreatorLevel: (data: { name: string; description?: string; min_works: number; min_rating: number; commission_rate: number; benefits: string[]; color?: string; icon?: string }): Promise<any> => {
    return apiClient.post<any>('/admin/creator-levels', data);
  },

  updateCreatorLevel: (id: number, data: { name: string; description?: string; min_works: number; min_rating: number; commission_rate: number; benefits: string[]; color?: string; icon?: string }): Promise<any> => {
    return apiClient.put<any>(`/admin/creator-levels/${id}`, data);
  },

  deleteCreatorLevel: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/creator-levels/${id}`);
  },

  assignCreatorLevel: (creatorId: number, levelId: string): Promise<any> => {
    return apiClient.post(`/admin/creators/${creatorId}/level`, { level_id: levelId });
  },

  // 服务器管理相关API
  getServers: (params?: { page?: number; pageSize?: number; search?: string; status?: string; server_type?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/servers', params);
  },

  getServerDetail: (id: number): Promise<any> => {
    return apiClient.get<any>(`/admin/servers/${id}`);
  },

  createServer: (data: {
    name: string;
    url: string;
    description?: string;
    status: 'active' | 'inactive' | 'maintenance';
    server_type: 'shared' | 'dedicated' | 'cloud';
    location?: string;
    max_users: number;
    cpu_cores?: number;
    memory_gb?: number;
    storage_gb?: number;
    bandwidth_mbps?: number;
  }): Promise<any> => {
    return apiClient.post<any>('/admin/servers', data);
  },

  updateServer: (id: number, data: {
    name?: string;
    url?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'maintenance';
    server_type?: 'shared' | 'dedicated' | 'cloud';
    location?: string;
    max_users?: number;
    cpu_cores?: number;
    memory_gb?: number;
    storage_gb?: number;
    bandwidth_mbps?: number;
  }): Promise<any> => {
    return apiClient.put<any>(`/admin/servers/${id}`, data);
  },

  deleteServer: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/servers/${id}`);
  },

  // 视频生成任务相关API
  createVideoGenerationTask: (data: {
    execute_id: string;
    workflow_id: string;
    token: string;
    notification_email: string;
    coze_workflow_id: number | null; // 改为可选
    user_id: number;
    title: string; // 视频任务标题
    debug_url?: string; // Coze工作流调试URL
  }): Promise<any> => {
    return apiClient.post('/video-generation-tasks', data);
  },

  getVideoGenerationTasks: (params?: {
    page?: number;
    pageSize?: number;
    status?: 'running' | 'completed' | 'failed' | 'timeout';
  }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/video-generation-tasks', params);
  },

  getVideoGenerationTask: (id: number): Promise<any> => {
    return apiClient.get<any>(`/video-generation-tasks/${id}`);
  },

  updateVideoGenerationTaskStatus: (id: number, data: {
    status: 'running' | 'completed' | 'failed' | 'timeout';
    result_data?: any;
    error_message?: string;
  }): Promise<any> => {
    return apiClient.put<any>(`/video-generation-tasks/${id}/status`, data);
  },

  checkVideoGenerationTaskStatus: (id: number): Promise<any> => {
    return apiClient.get<any>(`/video-generation-tasks/${id}/check-status`);
  },

  // 视频任务监控管理API
  startVideoTaskMonitor: (): Promise<any> => {
    return apiClient.post<any>('/admin/video-task-monitor/start');
  },

  stopVideoTaskMonitor: (): Promise<any> => {
    return apiClient.post<any>('/admin/video-task-monitor/stop');
  },

  getVideoTaskMonitorStatus: (): Promise<any> => {
    return apiClient.get<any>('/admin/video-task-monitor/status');
  },

  updateServerStatus: (id: number, status: 'active' | 'inactive' | 'maintenance'): Promise<any> => {
    return apiClient.put<any>(`/admin/servers/${id}/status`, { status });
  },

  // 佣金发放相关API
  getCommissionUsers: (params?: { page?: number; pageSize?: number; search?: string; role?: string }): Promise<PaginatedResponse<{
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    earnings_status: string;
    workflow_count: number;
    // ai_app_count removed as ai_apps table no longer exists
    total_earnings: number;
    created_at: string;
  }>> => {
    return apiClient.get('/admin/commission/users', params);
  },

  // 获取包含统计数据的用户列表（用于佣金管理页面）
  getUsersWithStats: (params?: { page?: number; pageSize?: number; search?: string; role?: string; status?: string }): Promise<PaginatedResponse<{
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    workflow_count: number;
    favorite_count: number;
    download_count: number;
    conversation_count: number;
    created_at: string;
    updated_at: string;
  }>> => {
    return apiClient.get('/admin/users-with-stats', params);
  },

  // 审核通过时更新相关数据
  approveSubmissionWithRewards: (data: {
    submission_id: number;
    workflow_id: number;
    user_id: number;
    reward_amount: number;
    comment?: string;
  }): Promise<{
    success: boolean;
    message: string;
    transaction_id: number;
    new_balance: number;
  }> => {
    return apiClient.post('/admin/submissions/approve-with-rewards', data);
  },

  issueCommission: (data: {
    user_id: number;
    amount: number;
    reason: string;
    type: 'initial_bonus' | 'performance_bonus' | 'referral_bonus' | 'other';
  }): Promise<{
    success: boolean;
    message: string;
    transaction_id: number;
    new_balance: number;
  }> => {
    return apiClient.post('/admin/commission/issue', data);
  },

  getCommissionStats: (): Promise<{
    total_users: number;
    total_creators: number;
    total_workflows: number;
    // total_ai_apps removed as ai_apps table no longer exists
    total_commission_issued: number;
    pending_commission: number;
  }> => {
    return apiClient.get('/admin/commission/stats');
  },

  // 获取实时统计面板数据
  getRealTimeStats: (): Promise<{
    total_creators: number;
    active_payouts: number;
    total_commission_paid: number;
    pending_commission: number;
    total_processed: number;
    success_count: number;
    failure_count: number;
  }> => {
    return apiClient.get('/admin/commission/real-time-stats');
  },

  // 获取创作者详情（包括作品列表）
  getCreatorDetail: (userId: number): Promise<{
    workflows: Array<{
      id: number;
      title: string;
      description: string;
      cover_image_url?: string;
      price: number;
      download_count: number;
      rating: number;
      created_at: string;
    }>;
    // ai_apps removed as ai_apps table no longer exists
  }> => {
    return apiClient.get(`/admin/creators/${userId}/detail`);
  },

  // 按天数发放人民币佣金
  issueCommissionByDays: (data: {
    user_id: number;
    total_wh_coins: number;
    days: number;
  }): Promise<{
    success: boolean;
    message: string;
    commission_record_id: number;
    daily_schedule: Array<{
      day: number;
      amount: number;
      scheduled_date: string;
    }>;
  }> => {
    return apiClient.post('/admin/commission/issue-by-days', data);
  },

  // 初始佣金管理系统API
  // 获取佣金计划列表
  getInitialCommissionPlans: (params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/initial-commission/plans', params);
  },

  // 获取单个佣金计划
  getInitialCommissionPlan: (id: number): Promise<any> => {
    return apiClient.get<any>(`/admin/initial-commission/plans/${id}`);
  },

  // 创建佣金计划
  createInitialCommissionPlan: (data: {
    name: string;
    description?: string;
    trigger_type: string;
    amount_type: string;
    amount_value: number;
    workflow_threshold?: number;
    auto_trigger?: boolean;
    status?: string;
  }): Promise<any> => {
    return apiClient.post<any>('/admin/initial-commission/plans', data);
  },

  // 更新佣金计划
  updateInitialCommissionPlan: (id: number, data: {
    name?: string;
    description?: string;
    fixed_amount?: number;
    payout_cycle?: number;
    trigger_condition?: any;
    status?: string;
  }): Promise<any> => {
    return apiClient.put<any>(`/admin/initial-commission/plans/${id}`, data);
  },

  // 删除佣金计划
  deleteInitialCommissionPlan: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/admin/initial-commission/plans/${id}`);
  },

  // 获取用户佣金配置列表
  getUserInitialCommissionConfigs: (params?: { page?: number; pageSize?: number; search?: string; status?: string; planId?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/initial-commission/users', params);
  },

  // 获取用户佣金配置及发放进度
  getUserInitialCommissionWithPayouts: (params?: { page?: number; pageSize?: number; search?: string; status?: string; planId?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/admin/initial-commission/users-with-payouts', params);
  },

  // 批量发放初始佣金
  batchIssueInitialCommission: (data: {
    user_ids: number[];
    plan_id?: number;
    fixed_amount?: number;
    payout_cycle?: number;
  }): Promise<{
    success: boolean;
    message: string;
    processed_count: number;
    errors?: Array<{ user_id: number; error: string }>;
  }> => {
    return apiClient.post('/admin/initial-commission/batch-issue', data);
  },

  // 更新用户佣金状态
  updateUserCommissionStatus: (userId: number, isActive: boolean): Promise<{
    success: boolean;
    message: string;
    user: {
      id: number;
      username: string;
      email: string;
      is_active: boolean;
    };
  }> => {
    // 将布尔值转换为数字（0或1）发送给后端
    const requestData = { is_active: isActive ? 1 : 0 };
    const url = `/admin/initial-commission/users/${userId}/status`;
    
    console.log('[API] updateUserCommissionStatus 开始请求:', {
      userId,
      isActive,
      requestData,
      url,
      timestamp: new Date().toISOString()
    });
    
    return apiClient.put<{
      success: boolean;
      message: string;
      user: {
        id: number;
        username: string;
        email: string;
        is_active: boolean;
      };
    }>(url, requestData)
      .then(response => {
        console.log('[API] updateUserCommissionStatus 请求成功:', {
          userId,
          response,
          timestamp: new Date().toISOString()
        });
        return response;
      })
      .catch(error => {
        console.error('[API] updateUserCommissionStatus 请求失败:', {
          userId,
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorResponse: error.response,
          timestamp: new Date().toISOString()
        });
        throw error;
      });
  },

  // 获取用户符合条件的初始佣金计划
  getUserEligibleCommissionPlans: (userId: number): Promise<{
    plans: Array<{
      id: number;
      name: string;
      description?: string;
      trigger_type: string;
      amount_type: string;
      amount_value: number;
      workflow_threshold?: number;
    }>;
    userWorkflowCount: number;
  }> => {
    console.log('[API] getUserEligibleCommissionPlans 开始请求:', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    return apiClient.get<{
      plans: Array<{
        id: number;
        name: string;
        description?: string;
        trigger_type: string;
        amount_type: string;
        amount_value: number;
        workflow_threshold?: number;
      }>;
      userWorkflowCount: number;
    }>(`/admin/initial-commission/users/${userId}/eligible-plans`)
      .then(response => {
        console.log('[API] getUserEligibleCommissionPlans 请求成功:', {
          userId,
          response,
          timestamp: new Date().toISOString()
        });
        return response;
      })
      .catch(error => {
        console.error('[API] getUserEligibleCommissionPlans 请求失败:', {
          userId,
          error,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      });
  },
};

// 广告商相关API
export const advertiserApi = {
  // 获取广告列表
  getAds: (params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/advertiser/ads', params);
  },

  // 创建广告
  createAd: (data: any): Promise<any> => {
    return apiClient.post<any>('/advertiser/ads', data);
  },

  // 更新广告
  updateAd: (id: number, data: any): Promise<any> => {
    return apiClient.put<any>(`/advertiser/ads/${id}`, data);
  },

  // 删除广告
  deleteAd: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/advertiser/ads/${id}`);
  },

  // 暂停/恢复广告
  toggleAdStatus: (id: number, status: 'active' | 'paused'): Promise<any> => {
    return apiClient.put<any>(`/advertiser/ads/${id}/status`, { status });
  },

  // 获取广告统计
  getAdStats: (): Promise<any> => {
    return apiClient.get<any>('/advertiser/stats');
  },
};

// 评价相关API
export const reviewApi = {
  // 注释掉与workflows表相关的API调用
  // getWorkflowReviews: (workflowId: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Review>> => {
  //   return apiClient.get<PaginatedResponse<Review>>(`/workflows/${workflowId}/reviews`, params);
  // },

  // addReview: (workflowId: number, data: { rating: number; comment?: string }): Promise<Review> => {
  //   return apiClient.post<Review>(`/workflows/${workflowId}/reviews`, data);
  // },

  // updateReview: (reviewId: number, data: { rating: number; comment?: string }): Promise<Review> => {
  //   return apiClient.put<Review>(`/reviews/${reviewId}`, data);
  // },

  // deleteReview: (reviewId: number): Promise<void> => {
  //   return apiClient.delete<void>(`/reviews/${reviewId}`);
  // },

  // pinReview: (reviewId: number): Promise<Review> => {
  //   return apiClient.put<Review>(`/reviews/${reviewId}/pin`, {});
  // },
  // unpinReview: (reviewId: number): Promise<Review> => {
  //   return apiClient.put<Review>(`/reviews/${reviewId}/unpin`, {});
  // },
};

// 文件上传API
export const uploadApi = {
  // 上传文件
  uploadFile: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '上传失败');
      }
      throw error;
    }
  },

  // 上传头像预览
  uploadAvatarPreview: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/upload/avatar-preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '上传失败');
      }
      throw error;
    }
  },

  // 上传多个文件
  uploadFiles: async (files: File[], onProgress?: (progress: number) => void): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await apiClient.client.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '上传失败');
      }
      throw error;
    }
  },
};

// 首页统计数据API
export const homeStatsApi = {
  // 获取首页统计数据
  getHomeStats: (): Promise<ApiResponse<HomeStats>> => {
    return apiClient.get('/home/stats');
  },
};

// 导出API客户端实例
export { apiClient };

// 导出token管理方法
export const tokenManager = {
  setToken: (token: string) => apiClient.setToken(token),
  clearToken: () => apiClient.clearToken(),
  getToken: () => apiClient.getToken(),
};

// 创作者申请相关API
export const creatorApplicationsApi = {
  // 提交创作者申请
  submitApplication: (data: CreatorApplicationRequest): Promise<CreatorApplication> => {
    return apiClient.post<CreatorApplication>('/creator-applications', data);
  },

  // 获取当前用户的申请状态
  getMyApplication: (): Promise<CreatorApplication | null> => {
    return apiClient.get<CreatorApplication | null>('/creator-applications/my');
  },

  // 撤回申请
  withdrawApplication: (): Promise<void> => {
    return apiClient.delete<void>('/creator-applications/my');
  },

  // 获取申请列表（管理员用）
  getApplications: (params?: { status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<CreatorApplication>> => {
    return apiClient.get<PaginatedResponse<CreatorApplication>>('/admin/creator-applications', params);
  },

  // 审核申请（管理员用）
  reviewApplication: (id: number, data: CreatorApplicationReview): Promise<CreatorApplication> => {
    return apiClient.put<CreatorApplication>(`/admin/creator-applications/${id}/review`, data);
  },
};

// 创作者内容上传API
export const creatorUploadApi = {
  // 上传工作流压缩包
  uploadWorkflowFile: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/creator/upload/workflow', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '工作流文件上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '工作流文件上传失败');
      }
      throw error;
    }
  },

  // 上传AI应用压缩包
  uploadAIAppFile: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/creator/upload/ai-app', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'AI应用文件上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || 'AI应用文件上传失败');
      }
      throw error;
    }
  },

  // 上传封面图片
  uploadCoverImage: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/creator/upload/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '封面图片上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '封面图片上传失败');
      }
      throw error;
    }
  },

  // 上传预览视频（带压缩）
  uploadPreviewVideo: async (file: File, onProgress?: (progress: number) => void): Promise<{ url: string; filename: string; compressed: boolean }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.client.post('/creator/upload/preview-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || '预览视频上传失败');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || '预览视频上传失败');
      }
      throw error;
    }
  },

  // 提交工作流内容
  submitWorkflow: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    price: number;
    type: string;
    isMemberFree: boolean;
    fileUrl: string;
    coverImageUrl?: string;
    previewVideoUrl?: string;
    country?: string;
  }): Promise<any> => {
    return apiClient.post<any>('/creator/coze-workflows', data);
  },

  // 为任务提交工作流内容到coze_workflows表
  submitWorkflowForTask: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    price: number;
    download_price: number;
    type: string;
    isMemberFree: boolean;
    isDownloadMemberFree: boolean;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    coverImageUrl?: string;
    previewImages?: string[];
    previewVideoUrl?: string;
    quickCommands?: string[];
    taskId: number;
  }): Promise<any> => {
    return apiClient.post('/creator/coze-workflows/task-submission', data);
  },

  // 提交AI应用内容
  submitAIApp: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    price: number;
    cozeApiCode: string;
    appAvatarUrl?: string;
    openingMessage?: string;
    presetQuestions: string[];
    quickCommands: { name: string; command: string }[];
    coverImageUrl?: string;
    previewVideoUrl?: string;
    runtimeDuration?: number;
    country?: string;
  }): Promise<any> => {
    return apiClient.post('/creator/ai-apps', data);
  },
};

// 推广相关API
export const promotionApi = {
  // 创建推广订单
  createPromotion: (data: {
    workflow_id: number;
    channel: 'homepage' | 'category' | 'search';
    duration: number;
    budget: number;
  }): Promise<{ id: number; status: string; payment_url?: string }> => {
    return apiClient.post<{ id: number; status: string; payment_url?: string }>('/creator/promotions', data);
  },

  // 获取推广列表
  getPromotions: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/creator/promotions', params);
  },

  // 获取推广详情
  getPromotion: (id: number): Promise<any> => {
    return apiClient.get<any>(`/creator/promotions/${id}`);
  },

  // 取消推广
  cancelPromotion: (id: number): Promise<void> => {
    return apiClient.delete<void>(`/creator/promotions/${id}`);
  },

  // 获取推广统计
  getPromotionStats: (): Promise<any> => {
    return apiClient.get<any>('/creator/promotion-stats');
  },
};

// Coze Workflows API - 专门处理coze_workflows表的数据
export const cozeWorkflowApi = {
  // 获取coze工作流列表
  getCozeWorkflows: (params: WorkflowSearchParams): Promise<PaginatedResponse<Workflow>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.category) searchParams.append('category', params.category.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.status) searchParams.append('status', params.status);
    if (params.featured !== undefined) searchParams.append('featured', params.featured.toString());
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }
    return apiClient.get<PaginatedResponse<Workflow>>(`/coze-workflows?${searchParams.toString()}`);
  },

  // 获取单个coze工作流详情
  getCozeWorkflow: (id: number): Promise<Workflow> => {
    return apiClient.get<Workflow>(`/coze-workflows/${id}`);
  },

  // 记录coze工作流浏览量
  recordView: (id: number): Promise<{ success: boolean; message: string; view_count: number }> => {
    return apiClient.post<{ success: boolean; message: string; view_count: number }>(`/coze-workflows/${id}/view`);
  },

  // 获取用户对coze工作流的状态（点赞、收藏、购买）
  getUserCozeWorkflowStatus: (id: number): Promise<{ liked: boolean; favorited: boolean; purchased: boolean }> => {
    return apiClient.get<{ liked: boolean; favorited: boolean; purchased: boolean }>(`/coze-workflows/${id}/status`);
  },

  // 点赞coze工作流
  likeCozeWorkflow: (id: number): Promise<{ success: boolean; message: string; liked: boolean }> => {
    return apiClient.post<{ success: boolean; message: string; liked: boolean }>(`/coze-workflows/${id}/like`);
  },

  // 收藏coze工作流
  favoriteCozeWorkflow: (id: number): Promise<{ success: boolean; message: string; favorited: boolean }> => {
    return apiClient.post<{ success: boolean; message: string; favorited: boolean }>(`/coze-workflows/${id}/favorite`);
  },

  // 下载coze工作流
  downloadCozeWorkflow: (id: number): Promise<{ success: boolean; message: string; download_url: string; filename: string }> => {
    return apiClient.post<{ success: boolean; message: string; download_url: string; filename: string }>(`/coze-workflows/${id}/download`);
  },

  // 购买coze工作流
  purchaseCozeWorkflow: (id: number, data?: { payment_method?: 'wh_coins' | 'paypal' }): Promise<{ 
    success: boolean; 
    message: string; 
    transaction_id?: number; 
    payment_url?: string; 
    amount?: number; 
    workflow_title?: string;
    wh_coins_used?: number;
    remaining_balance?: number;
  }> => {
    return apiClient.post<{ 
      success: boolean; 
      message: string; 
      transaction_id?: number; 
      payment_url?: string; 
      amount?: number; 
      workflow_title?: string;
      wh_coins_used?: number;
      remaining_balance?: number;
    }>(`/coze-workflows/${id}/purchase`, data);
  },
};

// 钱包/订阅API
export const walletApi = {
  getBalance: (): Promise<WalletBalance> => apiClient.get<WalletBalance>('/wallet/balance'),
  createMembershipCheckout: (): Promise<{ payment_url: string }> => apiClient.post<{ payment_url: string }>('/wallet/membership/checkout')
};

export const subscriptionApi = {
  checkWorkflowSubscription: (workflowId: number): Promise<SubscriptionStatus> => apiClient.get<SubscriptionStatus>(`/subscriptions/workflow/${workflowId}`),
  checkCreatorSubscription: (creatorId: number): Promise<SubscriptionStatus> => apiClient.get<SubscriptionStatus>(`/subscriptions/creator/${creatorId}`),
  subscribeWorkflow: (workflowId: number): Promise<SubscribeResponse> => apiClient.post<SubscribeResponse>(`/subscriptions/workflow/${workflowId}`),
  subscribeCreator: (creatorId: number): Promise<SubscribeResponse> => apiClient.post<SubscribeResponse>(`/subscriptions/creator/${creatorId}`),
};

// 用户交易相关API
export const userApi = {
  // 获取用户交易记录
  getUserTransactions: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/user/transactions', params);
  },

  // 获取用户购买记录
  getUserPurchases: (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<any>> => {
    return apiClient.get<PaginatedResponse<any>>('/user/purchases', params);
  },

  // 获取用户会员信息
  getMembership: (): Promise<{ wh_coins: number; membership_active?: boolean; data?: { wh_coins: number } }> => {
    return apiClient.get<{ wh_coins: number; membership_active?: boolean; data?: { wh_coins: number } }>('/user/membership');
  },

  // 获取用户资料
  getProfile: (): Promise<{ total_earnings: number; balance?: number; data?: { total_earnings: number; balance?: number } }> => {
    return apiClient.get<{ total_earnings: number; balance?: number; data?: { total_earnings: number; balance?: number } }>('/user/profile');
  },
};

// 默认导出所有API
export default {
  auth: authApi,
  // workflow: workflowApi, // 注释掉已移除的workflowApi
  user: userApi,
  cozeWorkflow: cozeWorkflowApi,
  category: categoryApi,
  country: countryApi,
  task: taskApi,
  creator: creatorApi,
  admin: adminApi,
  advertiser: advertiserApi,
  review: reviewApi,
  upload: uploadApi,
  creatorApplications: creatorApplicationsApi,
  creatorUpload: creatorUploadApi,
  promotion: promotionApi,
  homeStats: homeStatsApi,
  wallet: walletApi,
  subscription: subscriptionApi
};

// 为了向后兼容，导出常用的API方法
export const getCountries = countryApi.getCountries;
export const getCategories = categoryApi.getCategories;
export const getTagsByCategory = categoryApi.getTagsByCategory;