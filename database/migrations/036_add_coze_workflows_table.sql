-- 创建Coze工作流数据表
-- 用于存储Coze工作流相关的所有内容，包括工作流文件、封面图片、视频资源和点赞数据

CREATE TABLE IF NOT EXISTS coze_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    
    -- 价格相关
    price REAL DEFAULT 0.00,
    is_member_free BOOLEAN DEFAULT FALSE,
    
    -- 文件相关
    workflow_file_url TEXT NOT NULL, -- 工作流文件URL（.zip/.rar/.7z等）
    workflow_file_name TEXT, -- 原始文件名
    workflow_file_size INTEGER, -- 文件大小（字节）
    
    -- 媒体资源
    cover_image_url TEXT, -- 封面图片URL
    preview_video_url TEXT, -- 预览视频URL
    preview_images TEXT, -- 预览图片JSON数组
    
    -- 标签和分类
    tags TEXT, -- JSON格式的标签数组
    
    -- 统计数据
    like_count INTEGER DEFAULT 0, -- 点赞数
    favorite_count INTEGER DEFAULT 0, -- 收藏数
    download_count INTEGER DEFAULT 0, -- 下载数
    view_count INTEGER DEFAULT 0, -- 浏览数
    comment_count INTEGER DEFAULT 0, -- 评论数
    
    -- 评分相关
    rating REAL DEFAULT 0.00, -- 平均评分
    rating_count INTEGER DEFAULT 0, -- 评分人数
    
    -- 状态管理
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE, -- 是否精选
    is_official BOOLEAN DEFAULT FALSE, -- 是否官方
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- 外键约束
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_creator ON coze_workflows(creator_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_category ON coze_workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_status ON coze_workflows(status);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_featured ON coze_workflows(is_featured);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_official ON coze_workflows(is_official);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_rating ON coze_workflows(rating);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_downloads ON coze_workflows(download_count);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_likes ON coze_workflows(like_count);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_created_at ON coze_workflows(created_at);

-- 创建用户与Coze工作流关系表（用于记录用户的购买、收藏、下载等行为）
CREATE TABLE IF NOT EXISTS user_coze_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coze_workflow_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('purchase', 'favorite', 'download', 'like')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coze_workflow_id) REFERENCES coze_workflows(id),
    
    -- 确保每个用户对每个工作流的每种操作只能记录一次
    UNIQUE(user_id, coze_workflow_id, action)
);

-- 为用户关系表创建索引
CREATE INDEX IF NOT EXISTS idx_user_coze_workflows_user ON user_coze_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coze_workflows_workflow ON user_coze_workflows(coze_workflow_id);
CREATE INDEX IF NOT EXISTS idx_user_coze_workflows_action ON user_coze_workflows(action);

-- 创建Coze工作流评价表
CREATE TABLE IF NOT EXISTS coze_workflow_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coze_workflow_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coze_workflow_id) REFERENCES coze_workflows(id),
    
    -- 每个用户对每个工作流只能评价一次
    UNIQUE(user_id, coze_workflow_id)
);

-- 为评价表创建索引
CREATE INDEX IF NOT EXISTS idx_coze_workflow_reviews_workflow ON coze_workflow_reviews(coze_workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_reviews_rating ON coze_workflow_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_reviews_status ON coze_workflow_reviews(status);

-- 创建Coze工作流评论表
CREATE TABLE IF NOT EXISTS coze_workflow_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coze_workflow_id INTEGER NOT NULL,
    parent_id INTEGER, -- 用于回复评论
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (coze_workflow_id) REFERENCES coze_workflows(id),
    FOREIGN KEY (parent_id) REFERENCES coze_workflow_comments(id)
);

-- 为评论表创建索引
CREATE INDEX IF NOT EXISTS idx_coze_workflow_comments_workflow ON coze_workflow_comments(coze_workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_comments_user ON coze_workflow_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_comments_parent ON coze_workflow_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_comments_status ON coze_workflow_comments(status);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_comments_created_at ON coze_workflow_comments(created_at);