// 数据库和API类型定义



export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'creator' | 'admin' | 'advertiser' | 'super_admin';
  avatar_url?: string;
  balance: number;
  total_earnings: number;
  wh_coins: number;
  membership_type?: 'basic' | 'premium' | 'vip';
  status: 'active' | 'banned' | 'pending' | 'suspended' | 'deleted';
  oauth_provider?: string;
  oauth_id?: string;
  password_hash?: string;
  wechat_openid?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: number;
  creator_id: number;
  title: string;
  description?: string;
  category_id: number | null;
  subcategory_id?: number | null;
  price: number;
  is_member_free: boolean;
  type?: string;
  country?: string;
  file_url: string;
  preview_images?: string[];
  preview_video?: string;
  tags?: string[];
  download_count: number;
  view_count: number;
  like_count: number;
  rating: number;
  rating_count: number;
  favorite_count: number;
  comment_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'offline';
  is_featured: boolean;
  is_official: boolean;
  created_at: string;
  updated_at: string;
  creator?: User;
  category?: Category;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  description?: string;
  icon_url?: string;
  sort_order: number;
  is_active: boolean;
  region: 'global' | 'china' | 'usa';
  children?: Category[];
}

export interface Tag {
  id: number;
  name: string;
  category_id?: number;
  region: 'global' | 'china' | 'usa';
  color: string;
  description?: string;
  usage_count: number;
  is_active: boolean;
  is_system: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  creator?: User;
}

export interface CategoryRequest {
  id: number;
  user_id: number;
  name: string;
  parent_id?: number;
  region: 'china' | 'usa';
  description?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_id?: number;
  admin_comment?: string;
  created_category_id?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  parent_category?: Category;
  admin?: User;
  created_category?: Category;
}

export interface TagRequest {
  id: number;
  user_id: number;
  name: string;
  category_id?: number;
  region: 'china' | 'usa';
  color: string;
  description?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_id?: number;
  admin_comment?: string;
  created_tag_id?: number;
  created_at: string;
  updated_at: string;
  user?: User;
  category?: Category;
  admin?: User;
  created_tag?: Tag;
}

export interface Transaction {
  id: number;
  user_id: number;
  workflow_id?: number;
  type: 'purchase' | 'recharge' | 'withdrawal' | 'commission';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  payment_id?: string;
  description?: string;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  workflow_id: number;
  rating: number;
  comment?: string;
  status: 'active' | 'hidden' | 'deleted';
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Advertisement {
  id: number;
  advertiser_id: number;
  title: string;
  content?: string;
  image_url?: string;
  target_url?: string;
  position: 'banner' | 'sidebar' | 'detail' | 'search';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  upload_type: 'avatar' | 'workflow' | 'preview' | 'document';
  status: 'active' | 'deleted';
  created_at: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  error?: {
    field?: string;
    reason: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 认证相关类型
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'creator' | 'advertiser' | 'super_admin';
}

export interface EmailVerificationRequest {
  email: string;
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
}

export interface EmailVerificationCode {
  id: number;
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// 创作者申请相关类型
export interface CreatorApplication {
  id: number;
  user_id: number;
  country: string;
  linkedin?: string;
  experience: string;
  portfolio?: string;
  reason: string;
  skills: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorApplicationRequest {
  country: string;
  linkedin?: string;
  experience: string;
  portfolio?: string;
  reason: string;
  skills: string;
}

export interface CreatorApplicationReview {
  status: 'approved' | 'rejected';
  admin_comment?: string;
}

export interface CategoryRequestCreate {
  name: string;
  parent_id?: number;
  region: 'china' | 'usa';
  description?: string;
  reason: string;
}

export interface TagRequestCreate {
  name: string;
  category_id?: number;
  region: 'china' | 'usa';
  color?: string;
  description?: string;
  reason: string;
}

export interface CategoryRequestReview {
  status: 'approved' | 'rejected';
  admin_comment?: string;
}

export interface TagRequestReview {
  status: 'approved' | 'rejected';
  admin_comment?: string;
}

export interface OAuthRegisterRequest {
  provider: 'github' | 'google' | 'wechat';
  code: string;
  role?: 'user' | 'creator' | 'advertiser' | 'super_admin';
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'github' | 'google' | 'wechat';
  openid?: string; // 微信openid
}

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

// 搜索和筛选类型
export interface WorkflowSearchParams {
  q?: string;
  category?: number;
  subcategory?: number;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: 'latest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface WorkflowCreateRequest {
  title: string;
  description?: string;
  category_id: number | null;
  subcategory_id?: number | null;
  price: number;
  tags?: string[];
  file_url: string;
  preview_images?: string[];
}

export interface WorkflowUpdateRequest extends Partial<WorkflowCreateRequest> {
  status?: 'pending' | 'approved' | 'rejected' | 'offline';
}

// 统计数据类型
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalWorkflows: number;
  pendingWorkflows: number;
  pendingAIApps: number;
  pendingCreatorApplications: number;
  todayDownloads: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  workflowCount: number;
  totalDownloads: number;
  averageRating: number;
}

// 消息通知相关类型
export interface Notification {
  id: number;
  recipient_id: number;
  sender_id?: number;
  type: 'system' | 'welcome' | 'creator_application' | 'creator_approved' | 'creator_rejected' | 'workflow_approved' | 'workflow_rejected';
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: User;
  // 扩展字段（从JOIN查询获取）
  sender_username?: string;
  sender_avatar?: string;
}

export interface NotificationCreateRequest {
  recipient_id: number;
  sender_id?: number | null;
  type: Notification['type'];
  title: string;
  content: string;
}

export interface NotificationSearchParams {
  page?: number;
  pageSize?: number;
  is_read?: boolean;
  type?: Notification['type'] | string;
  recipient_id?: number;
}

// 用户设置相关类型
export interface UserSettings {
  id: number;
  user_id: number;
  email_notifications: boolean;
  push_notifications: boolean;
  welcome_shown: boolean;
  created_at: string;
  updated_at: string;
}

// Cloudflare Workers环境变量类型
export interface Env {
  DB: any; // Cloudflare D1Database
  JWT_SECRET: string;
  UPLOAD_BUCKET?: any; // R2Bucket
  R2_BUCKET?: any; // R2Bucket for file uploads
  R2_BUCKET_ID?: string; // R2 Bucket ID for public URL
  ENVIRONMENT: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  DATABASE_URL?: string;
  _videoMonitorStarted?: boolean; // 标记视频监控服务是否已启动
}