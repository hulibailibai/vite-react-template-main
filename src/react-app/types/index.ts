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
  timestamp?: string;
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

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  oauth_provider?: string;
  oauth_id?: string;
  role: 'user' | 'creator' | 'advertiser' | 'admin' | 'super_admin';
  avatar_url?: string;
  bio?: string;
  balance: number;
  total_earnings: number;
  wh_coins: number;
  membership_type: 'free' | 'basic' | 'premium';
  membership_start_date?: string;
  membership_end_date?: string;
  membership_auto_renew: number;
  creator_level_id?: number;
  workflow_count?: number;
  average_rating?: number;
  wechat_openid?: string;
  phone?: string;
  status: 'active' | 'banned' | 'pending' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
  // 保留兼容字段
  realName?: string;
  lastLoginAt?: string;
  totalWorkflows?: number;
  totalDownloads?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'creator' | 'advertiser';
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 工作流相关类型
export interface Workflow {
  id: number;
  creator_id: number;
  creator?: User;
  title: string;
  description?: string;
  category_id: number;
  category?: Category;
  category_name?: string;
  subcategory_id?: number;
  subcategory?: Category;
  price: number; // 运行工作流的价格
  download_price?: number; // 下载工作流的价格
  tags: string[];
  is_member_free: boolean;
  is_download_member_free?: boolean; // 下载会员免费
  file_url: string;
  fileUrl?: string; // 兼容字段
  file_size?: number; // 文件大小
  fileSize?: string; // 兼容字段
  preview_images: string[];
  preview_video?: string; // 预览视频URL
  preview_video_url?: string; // 预览视频URL（新字段）
  previewVideo?: string; // 兼容字段
  version?: string; // 版本号
  download_count: number;
  view_count: number;
  like_count: number;
  favorite_count?: number;
  rating: number;
  review_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'offline' | 'draft';
  is_featured: boolean;
  type?: 'workflow' | 'ai-app' | 'coze-workflow'; // 作品类型：工作流或AI应用或Coze工作流
  coze_api?: string; // Coze API相关信息
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreateRequest {
  title: string;
  description?: string;
  category_id: number;
  subcategory_id?: number;
  price: number; // 运行工作流的价格
  download_price?: number; // 下载工作流的价格
  tags: string[];
  file_url: string;
  preview_images: string[];
  preview_video?: string;
}

export interface WorkflowUpdateRequest extends Partial<WorkflowCreateRequest> {
  status?: 'pending' | 'approved' | 'rejected' | 'offline';
  is_featured?: boolean;
}

export interface WorkflowSearchParams {
  page?: number;
  pageSize?: number;
  category?: number;
  status?: string;
  featured?: boolean;
  search?: string;
  sortBy?: string;
  creatorId?: number;
  tags?: string[];
  category_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  is_free?: boolean;
  sort_by?: string;
  country?: string;
}

// 分类相关类型
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: number;
  children?: Category[];
  workflow_count: number;
  created_at: string;
  updated_at: string;
}

// 交易相关类型
export interface Transaction {
  id: number;
  user_id: number;
  workflow_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  updated_at: string;
}

// 评价相关类型
export interface Review {
  id: number;
  user_id: number;
  workflow_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  pinned?: boolean;
}

// 钱包与订阅相关类型
export interface WalletBalance {
  wh_balance: number;
  wh_coins: number;
  membership_active?: boolean;
}

export interface SubscriptionStatus {
  subscribed: boolean;
}

export interface SubscribeResponse {
  subscribed: boolean;
  new_balance?: number;
}

// 广告相关类型
export interface Advertisement {
  id: number;
  advertiser_id: number;
  title: string;
  content: string;
  image_url?: string;
  target_url: string;
  position: 'banner' | 'sidebar' | 'popup';
  status: 'active' | 'inactive' | 'expired';
  start_date: string;
  end_date: string;
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
}

// 统计相关类型
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
  totalWorks: number;
  totalDownloads: number;
  averageRating: number;
}

// 首页统计数据类型
export interface HomeStats {
  onlineUsers: number;   // 在线用户量
  creators: number;      // 创作者数量
  usage: number;         // 使用量
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
  user?: User;
  // 直接包含的用户信息字段（用于支持后端返回的扁平化数据结构）
  username?: string;
  email?: string;
  avatar_url?: string;
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
  sender_id?: number;
  type: Notification['type'];
  title: string;
  content: string;
}

export interface NotificationSearchParams {
  page?: number;
  pageSize?: number;
  is_read?: boolean;
  type?: Notification['type'];
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

// 表单相关类型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'file' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormErrors {
  [key: string]: string;
}

// 组件Props类型
export interface WorkflowCardProps {
  workflow: Workflow;
  onFavorite?: (id: number) => void;
  onDownload?: (id: number) => void;
  showActions?: boolean;
}

export interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showSizeChanger?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
}

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

// 路由相关类型
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  protected?: boolean;
  roles?: string[];
  title?: string;
}

// 主题相关类型
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
}

// Toast通知相关类型
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
}

// 上传相关类型
export interface UploadFile {
  uid: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  percent?: number;
  response?: any;
}

export interface UploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxCount?: number;
  onUpload: (files: File[]) => Promise<UploadFile[]>;
  onChange?: (files: UploadFile[]) => void;
  children?: React.ReactNode;
}

// 筛选相关类型
export interface FilterOption {
  label: string;
  value: string | number;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'select';
  options: FilterOption[];
  multiple?: boolean;
}

export interface FilterState {
  [key: string]: string | number | string[] | number[];
}

// 工具函数类型
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// 错误处理类型
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// 本地存储类型
export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiry?: number;
}

// AI应用相关类型
export interface AIApp {
  id: number;
  creator_id: number;
  creator?: User;
  creator_name?: string;
  creator_avatar?: string;
  creator_verified?: boolean;
  title: string;
  description?: string;
  long_description?: string;
  category_id: number;
  category?: Category;
  category_name?: string;
  subcategory_id?: number;
  subcategory?: Category;
  price: number;
  is_member_free: boolean;
  thumbnail?: string;
  thumbnail_url?: string;
  icon_url?: string;
  app_avatar_url?: string;
  opening_message?: string;
  preset_questions?: string[];
  quick_commands?: Array<{name: string; command: string}>;
  preview_images: string[];
  screenshots?: string[];
  demo_video?: string;
  coze_api_url: string;
  coze_api_code?: string;
  coze_token?: string;
  workflow_id: string;
  usage_instructions?: string;
  input_parameters: AIAppInputParameter[];
  tags: string[];
  features?: string[];

  downloads: number;
  download_count: number;
  run_count: number;
  views: number;
  view_count: number;
  rating: number;
  rating_count: number;
  reviews_count: number;
  favorite_count: number;
  comment_count: number;
  like_count: number;
  conversation_count: number;
  status: 'pending' | 'approved' | 'rejected' | 'offline';
  is_featured: boolean;
  featured?: boolean;
  trending?: boolean;
  version?: string;
  file_size?: string;
  changelog?: Array<{
    version: string;
    date: string;
    changes: string[];
  }>;
  country?: string; // 国家/地区
  runtime_duration?: number; // 预计运行时间（分钟）
  created_at: string;
  updated_at: string;
}

export interface AIAppInputParameter {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'file';
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  default_value?: string;
}

export interface AIAppCreateRequest {
  title: string;
  description?: string;
  category_id: number;
  subcategory_id?: number;
  price: number;
  icon_url?: string;
  preview_images: string[];
  coze_api_url: string;
  coze_token: string;
  workflow_id: string;
  usage_instructions: string;
  input_parameters: AIAppInputParameter[];
  tags: string[];
}

export interface AIAppUpdateRequest extends Partial<AIAppCreateRequest> {
  status?: 'pending' | 'approved' | 'rejected' | 'offline';
  is_featured?: boolean;
}

export interface AIAppSearchParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  category?: number;
  status?: string;
  featured?: boolean;
  search?: string;
  sortBy?: string;
  creatorId?: number;
  tags?: string[];
  category_id?: number;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  is_free?: boolean;
  sort_by?: string;
}

export interface AIAppRun {
  id: number;
  user_id: number;
  ai_app_id: number;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  execution_time?: number;
  created_at: string;
  updated_at: string;
}

export interface AIAppRunRequest {
  ai_app_id: number;
  input_data: Record<string, any>;
}

export interface AIAppReview {
  id: number;
  user_id: number;
  ai_app_id: number;
  rating: number;
  comment?: string;
  status: 'active' | 'hidden' | 'deleted';
  created_at: string;
  updated_at: string;
  user?: User;
}

// 权限相关类型
export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}

// 提现请求相关类型
export interface WithdrawalRequest {
  id: number;
  user_id: number;
  user?: User;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  payment_method: string;
  payment_details: Record<string, any>;
  admin_comment?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequestCreateRequest {
  amount: number;
  payment_method: string;
  payment_details: Record<string, any>;
}

export interface WithdrawalRequestReview {
  status: 'approved' | 'rejected';
  admin_comment?: string;
}

export interface WithdrawalRequestSearchParams {
  page?: number;
  pageSize?: number;
  status?: string;
  user_id?: number;
  min_amount?: number;
  max_amount?: number;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
}

// 创作者等级相关类型
export interface CreatorLevel {
  id: number;
  name: string;
  description?: string;
  min_works: number;
  min_rating: number;
  commission_rate: number;
  benefits: string[];
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorLevelCreateRequest {
  name: string;
  description?: string;
  min_works: number;
  min_rating: number;
  commission_rate: number;
  benefits: string[];
  color?: string;
  icon?: string;
}

export interface CreatorLevelUpdateRequest extends Partial<CreatorLevelCreateRequest> {}

// 创作者类型（扩展User）
export interface Creator extends User {
  balance: number;
  creator_level_id?: number;
  workflow_count: number;
  average_rating: number;
}

// 收益历史记录
export interface EarningsHistory {
  id: number;
  user_id: number;
  type: 'workflow_sale' | 'ai_app_sale' | 'commission' | 'bonus' | 'withdrawal' | 'refund';
  amount: number;
  description: string;
  workflow_id?: number;
  ai_app_id?: number;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// 导出所有类型 - 所有类型已在此文件中定义