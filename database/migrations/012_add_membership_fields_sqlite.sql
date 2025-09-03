-- 添加会员相关字段到users表 (SQLite版本)
ALTER TABLE users ADD COLUMN membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'basic', 'premium', 'enterprise'));
ALTER TABLE users ADD COLUMN membership_start_date TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN membership_end_date TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN membership_auto_renew BOOLEAN DEFAULT FALSE;

-- 创建订单表
CREATE TABLE orders (
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

-- 创建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_out_trade_no ON orders(out_trade_no);
CREATE INDEX idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 创建会员权限表
CREATE TABLE membership_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membership_type TEXT NOT NULL CHECK (membership_type IN ('free', 'basic', 'premium', 'enterprise')),
    permission_key TEXT NOT NULL, -- 权限键
    permission_value TEXT, -- 权限值（JSON格式）
    description TEXT, -- 权限描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(membership_type, permission_key)
);

-- 创建索引
CREATE INDEX idx_membership_permissions_type ON membership_permissions(membership_type);

-- 插入默认会员权限配置
INSERT INTO membership_permissions (membership_type, permission_key, permission_value, description) VALUES
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