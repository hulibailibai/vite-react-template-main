-- 工作流分享平台 Cloudflare D1 数据库架构
-- 注意：D1 使用 SQLite 语法

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- 允许为空，支持OAuth用户
    oauth_provider TEXT, -- OAuth提供商：github, google
    oauth_id TEXT, -- OAuth用户ID
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin', 'advertiser', 'super_admin')),
    avatar_url TEXT,
    balance REAL DEFAULT 0.00,
    total_earnings REAL DEFAULT 0.00,
    wh_coins INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'pending', 'suspended', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- 会员相关字段
    membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'basic', 'premium', 'enterprise')),
    membership_start_date TIMESTAMP NULL,
    membership_end_date TIMESTAMP NULL,
    membership_auto_renew BOOLEAN DEFAULT FALSE,
    -- 微信相关字段
    wechat_openid TEXT, -- 微信openid，用于微信支付转账
    -- 联系方式字段
    phone TEXT -- 用户手机号码，用于身份验证和联系
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    description TEXT,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- 工作流表
CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    is_member_free BOOLEAN DEFAULT FALSE, -- 是否仅会员免费
    type TEXT DEFAULT 'workflow', -- 工作流类型
    country TEXT, -- 适用国家/地区
    file_url TEXT NOT NULL,
    preview_images TEXT, -- JSON as TEXT in SQLite
    tags TEXT, -- JSON as TEXT in SQLite
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_workflows_creator ON workflows(creator_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_featured ON workflows(is_featured);
CREATE INDEX IF NOT EXISTS idx_workflows_rating ON workflows(rating);
CREATE INDEX IF NOT EXISTS idx_workflows_downloads ON workflows(download_count);
CREATE INDEX IF NOT EXISTS idx_workflows_member_free ON workflows(is_member_free);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_country ON workflows(country);
CREATE INDEX IF NOT EXISTS idx_workflows_is_official ON workflows(is_official);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'recharge', 'withdrawal', 'commission', 'ai_usage')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_id TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workflow ON transactions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- 用户工作流关系表
CREATE TABLE IF NOT EXISTS user_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('purchase', 'favorite', 'download')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    UNIQUE(user_id, workflow_id, action)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_workflows_user ON user_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workflows_workflow ON user_workflows(workflow_id);

-- 评价表
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    UNIQUE(user_id, workflow_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reviews_workflow ON reviews(workflow_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- 广告表
CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    advertiser_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    target_url TEXT,
    position TEXT NOT NULL CHECK (position IN ('banner', 'sidebar', 'detail', 'search')),
    budget REAL NOT NULL,
    spent REAL DEFAULT 0.00,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed')),
    start_date DATE,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_advertisements_advertiser ON advertisements(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON advertisements(position);

-- 邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at);

-- 文件存储表
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    upload_type TEXT DEFAULT 'avatar' CHECK (upload_type IN ('avatar', 'workflow', 'preview', 'document', 'ai_app_thumbnail', 'ai_app_screenshot')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'preview')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(upload_type);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    sender_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('system', 'workflow_approved', 'workflow_rejected', 'new_comment', 'new_purchase', 'withdrawal_processed', 'ai_app_approved', 'ai_app_rejected', 'ai_app_run_completed', 'ai_app_run_failed')),
    title TEXT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    welcome_shown BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- 创作者申请表
CREATE TABLE IF NOT EXISTS creator_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    real_name TEXT NOT NULL,
    id_card TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience TEXT,
    portfolio_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_creator_applications_user ON creator_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_applications_status ON creator_applications(status);

-- 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, preference_key)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL, -- 管理员ID
    action TEXT NOT NULL, -- 操作类型
    target_type TEXT NOT NULL, -- 目标类型 (workflow, ai_app, user等)
    target_id INTEGER NOT NULL, -- 目标ID
    details TEXT, -- 操作详情
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);

-- 插入初始分类数据
INSERT OR IGNORE INTO categories (name, parent_id, description, sort_order) VALUES
('办公自动化', NULL, '提高办公效率的自动化工作流', 1),
('数据处理', NULL, '数据分析和处理相关工作流', 2),
('设计创作', NULL, '设计和创意相关工作流', 3),
('营销推广', NULL, '营销和推广相关工作流', 4),
('开发工具', NULL, '开发和编程相关工作流', 5),
('AI应用', NULL, 'AI智能应用和工具', 6);

-- 插入子分类
INSERT OR IGNORE INTO categories (name, parent_id, description, sort_order) VALUES
('Excel处理', 1, 'Excel数据处理和自动化', 1),
('文档生成', 1, '自动生成各类文档', 2),
('邮件自动化', 1, '邮件发送和管理自动化', 3),
('数据清洗', 2, '数据清理和预处理', 1),
('数据分析', 2, '数据分析和可视化', 2),
('报表生成', 2, '自动生成各类报表', 3),
('图像处理', 3, '图片编辑和处理', 1),
('视频编辑', 3, '视频剪辑和制作', 2),
('UI设计', 3, '界面设计相关', 3),
('社媒管理', 4, '社交媒体管理', 1),
('广告投放', 4, '广告创建和投放', 2),
('数据分析', 4, '营销数据分析', 3),
('代码生成', 5, '自动生成代码', 1),
('测试自动化', 5, '自动化测试', 2),
('部署脚本', 5, '自动化部署', 3),
('文本处理', 6, 'AI文本生成和处理', 1),
('图像生成', 6, 'AI图像生成和编辑', 2),
('语音处理', 6, 'AI语音识别和合成', 3),
('数据分析', 6, 'AI数据分析和预测', 4),
('聊天机器人', 6, 'AI对话和客服机器人', 5),
('翻译工具', 6, 'AI翻译和语言处理', 6);

-- 用户点赞表
CREATE TABLE IF NOT EXISTS user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    UNIQUE(user_id, workflow_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_workflow ON user_likes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_created ON user_likes(created_at);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    UNIQUE(user_id, workflow_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_workflow ON user_favorites(workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON user_favorites(created_at);

-- 下载日志表
CREATE TABLE IF NOT EXISTS download_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_download_logs_user ON download_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_workflow ON download_logs(workflow_id);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    out_trade_no TEXT UNIQUE NOT NULL, -- 商户订单号
    transaction_id TEXT NULL, -- 微信支付交易号
    order_type TEXT NOT NULL DEFAULT 'membership' CHECK (order_type IN ('membership', 'workflow', 'recharge')),
    membership_type TEXT NULL CHECK (membership_type IN ('basic', 'premium', 'enterprise')), -- 会员类型
    membership_period TEXT NULL CHECK (membership_period IN ('month', 'year')), -- 会员周期
    workflow_id INTEGER NULL, -- 工作流ID（如果是购买工作流）
    amount DECIMAL(10,2) NOT NULL, -- 订单金额（元）
    currency TEXT DEFAULT 'CNY', -- 货币类型
    payment_method TEXT NOT NULL DEFAULT 'wechat' CHECK (payment_method IN ('wechat', 'alipay', 'paypal')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
    order_title TEXT NOT NULL, -- 订单标题
    order_description TEXT, -- 订单描述
    paid_at TIMESTAMP NULL, -- 支付时间
    expired_at TIMESTAMP NULL, -- 订单过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
);

-- 创建订单表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_out_trade_no ON orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 会员权限表
CREATE TABLE IF NOT EXISTS membership_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_type TEXT NOT NULL CHECK (membership_type IN ('free', 'basic', 'premium', 'enterprise')),
    permission_key TEXT NOT NULL, -- 权限键
    permission_value TEXT, -- 权限值（JSON格式）
    description TEXT, -- 权限描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(membership_type, permission_key)
);

-- 创建会员权限表索引
CREATE INDEX IF NOT EXISTS idx_membership_permissions_type ON membership_permissions(membership_type);

-- 插入默认会员权限配置
INSERT OR IGNORE INTO membership_permissions (membership_type, permission_key, permission_value, description) VALUES
('free', 'max_downloads_per_day', '3', '每日最大下载次数'),
('free', 'max_favorites', '10', '最大收藏数量'),
('free', 'can_upload_workflows', 'false', '是否可以上传工作流'),
('free', 'priority_support', 'false', '是否享有优先客服支持'),

('basic', 'max_downloads_per_day', '20', '每日最大下载次数'),
('basic', 'max_favorites', '100', '最大收藏数量'),
('basic', 'can_upload_workflows', 'true', '是否可以上传工作流'),
('basic', 'priority_support', 'false', '是否享有优先客服支持'),
('basic', 'ad_free', 'true', '是否无广告'),

('premium', 'max_downloads_per_day', '100', '每日最大下载次数'),
('premium', 'max_favorites', '500', '最大收藏数量'),
('premium', 'can_upload_workflows', 'true', '是否可以上传工作流'),
('premium', 'priority_support', 'true', '是否享有优先客服支持'),
('premium', 'ad_free', 'true', '是否无广告'),
('premium', 'exclusive_content', 'true', '是否可访问专属内容'),

('enterprise', 'max_downloads_per_day', '-1', '每日最大下载次数（-1表示无限制）'),
('enterprise', 'max_favorites', '-1', '最大收藏数量（-1表示无限制）'),
('enterprise', 'can_upload_workflows', 'true', '是否可以上传工作流'),
('enterprise', 'priority_support', 'true', '是否享有优先客服支持'),
('enterprise', 'ad_free', 'true', '是否无广告'),
('enterprise', 'exclusive_content', 'true', '是否可访问专属内容'),
('enterprise', 'api_access', 'true', '是否可使用API'),
('enterprise', 'custom_branding', 'true', '是否支持自定义品牌');
CREATE INDEX IF NOT EXISTS idx_download_logs_created ON download_logs(created_at);

-- 国家/地区表
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 国家代码，如 'china', 'usa', 'japan'
    name TEXT NOT NULL, -- 国家名称，如 '中国', '美国', '日本'
    name_en TEXT, -- 英文名称，如 'China', 'United States', 'Japan'
    sort_order INTEGER DEFAULT 0, -- 排序顺序
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);
CREATE INDEX IF NOT EXISTS idx_countries_sort_order ON countries(sort_order);

-- 插入初始国家数据
INSERT OR IGNORE INTO countries (code, name, name_en, sort_order, is_active) VALUES
('china', '中国', 'China', 1, TRUE),
('usa', '美国', 'United States', 2, TRUE),
('japan', '日本', 'Japan', 3, TRUE),
('korea', '韩国', 'South Korea', 4, TRUE),
('uk', '英国', 'United Kingdom', 5, TRUE),
('germany', '德国', 'Germany', 6, TRUE),
('france', '法国', 'France', 7, TRUE),
('canada', '加拿大', 'Canada', 8, TRUE),
('australia', '澳大利亚', 'Australia', 9, TRUE),
('singapore', '新加坡', 'Singapore', 10, TRUE),
('custom', '其他（自定义）', 'Other (Custom)', 999, TRUE);

-- 佣金记录表
CREATE TABLE IF NOT EXISTS commission_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    total_wh_coins REAL NOT NULL,
    days INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commission_records_user_id ON commission_records(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_admin_id ON commission_records(admin_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_records_created_at ON commission_records(created_at);

-- 每日佣金发放详情表
CREATE TABLE IF NOT EXISTS commission_daily_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commission_record_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    wh_coins_amount REAL NOT NULL,
    reason TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_date DATE NULL,
    transaction_id INTEGER NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (commission_record_id) REFERENCES commission_records(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_commission_record_id ON commission_daily_records(commission_record_id);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_scheduled_date ON commission_daily_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_status ON commission_daily_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_day_number ON commission_daily_records(day_number);

-- 插入管理员用户
INSERT OR IGNORE INTO users (username, email, password_hash, role, status) VALUES
('admin', 'admin@workflow.com', '$2b$10$example_hash', 'admin', 'active');