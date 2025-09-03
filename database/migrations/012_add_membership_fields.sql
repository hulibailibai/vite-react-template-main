-- 添加会员相关字段到users表
ALTER TABLE users ADD COLUMN membership_type ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free';
ALTER TABLE users ADD COLUMN membership_start_date TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN membership_end_date TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN membership_auto_renew BOOLEAN DEFAULT FALSE;

-- 创建订单表
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    out_trade_no VARCHAR(64) UNIQUE NOT NULL COMMENT '商户订单号',
    transaction_id VARCHAR(64) NULL COMMENT '微信支付交易号',
    order_type ENUM('membership', 'workflow', 'recharge') NOT NULL DEFAULT 'membership',
    membership_type ENUM('basic', 'premium', 'enterprise') NULL COMMENT '会员类型',
    membership_period ENUM('month', 'year') NULL COMMENT '会员周期',
    workflow_id BIGINT NULL COMMENT '工作流ID（如果是购买工作流）',
    amount DECIMAL(10,2) NOT NULL COMMENT '订单金额（元）',
    currency VARCHAR(3) DEFAULT 'CNY' COMMENT '货币类型',
    payment_method ENUM('wechat', 'alipay', 'paypal') NOT NULL DEFAULT 'wechat',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    order_title VARCHAR(200) NOT NULL COMMENT '订单标题',
    order_description TEXT COMMENT '订单描述',
    paid_at TIMESTAMP NULL COMMENT '支付时间',
    expired_at TIMESTAMP NULL COMMENT '订单过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_out_trade_no (out_trade_no),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_type (order_type),
    INDEX idx_created_at (created_at)
);

-- 创建会员权限表
CREATE TABLE membership_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    membership_type ENUM('free', 'basic', 'premium', 'enterprise') NOT NULL,
    permission_key VARCHAR(50) NOT NULL COMMENT '权限键',
    permission_value TEXT COMMENT '权限值（JSON格式）',
    description TEXT COMMENT '权限描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_membership_permission (membership_type, permission_key),
    INDEX idx_membership_type (membership_type)
);

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