import { ApiResponse, PaginatedResponse, AIApp, AIAppCreateRequest, AIAppSearchParams, AIAppRun } from '../types';
import { apiClient } from './api';

export class AIAppService {
  // 获取AI应用列表
  static async getAIApps(params?: AIAppSearchParams): Promise<ApiResponse<PaginatedResponse<AIApp>>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiClient.get<PaginatedResponse<AIApp>>(`/ai-apps?${searchParams.toString()}`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 获取AI应用详情
  static async getAIAppDetail(id: number): Promise<ApiResponse<AIApp>> {
    const response = await apiClient.get<AIApp>(`/ai-apps/${id}`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 创建AI应用
  static async createAIApp(data: AIAppCreateRequest): Promise<ApiResponse<{ id: number; message: string }>> {
    const response = await apiClient.post<{ id: number; message: string }>('/ai-apps', data);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 运行AI应用
  static async runAIApp(id: number, inputData: Record<string, any>): Promise<ApiResponse<{ run_id: number; result: any; status?: string; wh_coins_used?: number; remaining_balance?: number }>> {
    const response = await apiClient.post<{ run_id: number; result: any; wh_coins_used?: number; remaining_balance?: number }>(`/ai-apps/${id}/run`, {
      input_data: inputData
    });
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 获取AI应用运行历史
  static async getAIAppRuns(id: number, page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<AIAppRun>>> {
    const response = await apiClient.get<PaginatedResponse<AIAppRun>>(`/ai-apps/${id}/runs?page=${page}&pageSize=${pageSize}`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 收藏AI应用
  static async favoriteAIApp(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.post<null>(`/ai-apps/${id}/favorite`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 取消收藏AI应用
  static async unfavoriteAIApp(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<null>(`/ai-apps/${id}/favorite`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 下载AI应用
  static async downloadAIApp(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.post<null>(`/ai-apps/${id}/download`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 评价AI应用
  static async rateAIApp(id: number, rating: number, comment?: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<null>(`/ai-apps/${id}/reviews`, {
      rating,
      comment
    });
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 点赞/取消点赞AI应用
  static async likeAIApp(id: number): Promise<ApiResponse<{ success: boolean; message: string; liked: boolean }>> {
    const response = await apiClient.post<{ success: boolean; message: string; liked: boolean }>(`/ai-apps/${id}/like`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 获取AI应用用户状态
  static async getAIAppUserStatus(id: number): Promise<ApiResponse<{ liked: boolean; favorited: boolean }>> {
    const response = await apiClient.get<{ liked: boolean; favorited: boolean }>(`/ai-apps/${id}/user-status`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 获取AI应用评价
  static async getAIAppReviews(id: number, page = 1, pageSize = 20): Promise<ApiResponse<PaginatedResponse<any>>> {
    const response = await apiClient.get<PaginatedResponse<any>>(`/ai-apps/${id}/reviews?page=${page}&pageSize=${pageSize}`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }

  // 获取任务状态
  static async getTaskStatus(runId: number): Promise<ApiResponse<{ id: number; status: string; output_data?: any; error_message?: string; updated_at: string }>> {
    const response = await apiClient.get<{ id: number; status: string; output_data?: any; error_message?: string; updated_at: string }>(`/ai-apps/runs/${runId}/status`);
    return {
      success: true,
      code: 200,
      message: 'success',
      data: response,
      timestamp: new Date().toISOString()
    };
  }
}

export default AIAppService;