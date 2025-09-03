-- 从Coze工作流数据表中移除评分系统
-- 删除评分相关字段和评价表

-- 1. 删除评价表
DROP TABLE IF EXISTS coze_workflow_reviews;

-- 2. 由于SQLite不支持直接删除列，需要重建coze_workflows表
-- 创建临时表，排除评分相关字段
CREATE TABLE coze_workflows_temp (
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
    
    -- 统计数据（移除评分相关字段）
    like_count INTEGER DEFAULT 0, -- 点赞数
    favorite_count INTEGER DEFAULT 0, -- 收藏数
    download_count INTEGER DEFAULT 0, -- 下载数
    view_count INTEGER DEFAULT 0, -- 浏览数
    comment_count INTEGER DEFAULT 0, -- 评论数
    
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

-- 3. 复制数据到临时表（排除评分字段）
INSERT INTO coze_workflows_temp (
    id, creator_id, title, description, category_id, subcategory_id,
    price, is_member_free,
    workflow_file_url, workflow_file_name, workflow_file_size,
    cover_image_url, preview_video_url, preview_images,
    tags,
    like_count, favorite_count, download_count, view_count, comment_count,
    status, is_featured, is_official,
    created_at, updated_at
)
SELECT 
    id, creator_id, title, description, category_id, subcategory_id,
    price, is_member_free,
    workflow_file_url, workflow_file_name, workflow_file_size,
    cover_image_url, preview_video_url, preview_images,
    tags,
    like_count, favorite_count, download_count, view_count, comment_count,
    status, is_featured, is_official,
    created_at, updated_at
FROM coze_workflows;

-- 4. 删除原表
DROP TABLE coze_workflows;

-- 5. 重命名临时表
ALTER TABLE coze_workflows_temp RENAME TO coze_workflows;

-- 6. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_coze_workflows_creator ON coze_workflows(creator_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_category ON coze_workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_status ON coze_workflows(status);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_featured ON coze_workflows(is_featured);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_official ON coze_workflows(is_official);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_downloads ON coze_workflows(download_count);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_likes ON coze_workflows(like_count);
CREATE INDEX IF NOT EXISTS idx_coze_workflows_created_at ON coze_workflows(created_at);

-- 7. 从用户关系表中移除评分相关的操作记录（如果有的话）
-- 保留其他操作：purchase, favorite, download, like
-- 评分操作通常不会记录在user_coze_workflows表中，所以这里不需要特别处理

-- 完成评分系统移除