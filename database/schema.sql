-- 工作流分享平台数据库设计
-- 创建数据库
CREATE DATABASE IF NOT EXISTS workflow_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE workflow_platform;

-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- 允许为空，支持OAuth用户
    oauth_provider VARCHAR(20), -- OAuth提供商：github, google
    oauth_id VARCHAR(100), -- OAuth用户ID
    role ENUM('user', 'creator', 'admin', 'advertiser') DEFAULT 'user',
    avatar_url VARCHAR(255),
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    phone VARCHAR(20), -- 用户手机号码
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_oauth (oauth_provider, oauth_id),
    INDEX idx_phone (phone)
);

-- 分类表
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INT DEFAULT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES categories(id),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
);

-- 工作流表
CREATE TABLE workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    creator_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    subcategory_id INT,
    price DECIMAL(8,2) DEFAULT 0.00,
    file_url VARCHAR(500) NOT NULL,
    preview_images JSON,
    preview_video VARCHAR(500),
    tags JSON,
    download_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected', 'offline') DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    INDEX idx_creator (creator_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured),
    INDEX idx_rating (rating),
    INDEX idx_downloads (download_count)
);

-- 交易记录表
CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    workflow_id BIGINT,
    type ENUM('purchase', 'recharge', 'withdrawal', 'commission', 'ai_usage') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    INDEX idx_user (user_id),
    INDEX idx_workflow (workflow_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- 用户工作流关系表
CREATE TABLE user_workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    action ENUM('purchase', 'favorite', 'download') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    UNIQUE KEY uk_user_workflow_action (user_id, workflow_id, action),
    INDEX idx_user (user_id),
    INDEX idx_workflow (workflow_id)
);

-- 评价表
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status ENUM('active', 'hidden', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    UNIQUE KEY uk_user_workflow (user_id, workflow_id),
    INDEX idx_workflow (workflow_id),
    INDEX idx_rating (rating)
);

-- 广告表
CREATE TABLE advertisements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    advertiser_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    image_url VARCHAR(500),
    target_url VARCHAR(500),
    position ENUM('banner', 'sidebar', 'detail', 'search') NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    spent DECIMAL(10,2) DEFAULT 0.00,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    status ENUM('pending', 'active', 'paused', 'completed') DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES users(id),
    INDEX idx_advertiser (advertiser_id),
    INDEX idx_status (status),
    INDEX idx_position (position)
);

-- 用户偏好设置表
CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    preference_key VARCHAR(50) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    INDEX idx_user_id (user_id),
    INDEX idx_preference_key (preference_key)
);

-- 插入初始分类数据
INSERT INTO categories (name, parent_id, description, sort_order) VALUES
('办公自动化', NULL, '提高办公效率的自动化工作流', 1),
('数据处理', NULL, '数据分析和处理相关工作流', 2),
('设计创作', NULL, '设计和创意相关工作流', 3),
('营销推广', NULL, '营销和推广相关工作流', 4),
('开发工具', NULL, '开发和编程相关工作流', 5);

-- 插入子分类
INSERT INTO categories (name, parent_id, description, sort_order) VALUES
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
('部署脚本', 5, '自动化部署', 3);

-- 插入管理员用户
INSERT INTO users (username, email, password_hash, role, status) VALUES
('admin', 'admin@workflow.com', '$2b$10$example_hash', 'admin', 'active');