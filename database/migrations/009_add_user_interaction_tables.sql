-- 添加用户交互相关表
-- 009_add_user_interaction_tables.sql

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
CREATE INDEX IF NOT EXISTS idx_download_logs_created ON download_logs(created_at);

-- 更新工作流表，添加点赞数字段（如果不存在）
-- 注意：SQLite 不支持 ADD COLUMN IF NOT EXISTS，所以使用忽略错误的方式
PRAGMA table_info(workflows);

-- 如果 like_count 列不存在，添加它
-- SQLite 中我们需要用更安全的方式
-- 先尝试添加列，如果已存在会失败但不影响
ALTER TABLE workflows ADD COLUMN like_count INTEGER DEFAULT 0;

-- 为了确保数据一致性，更新现有工作流的统计数据
-- 更新点赞数
UPDATE workflows SET like_count = (
    SELECT COUNT(*) FROM user_likes WHERE workflow_id = workflows.id
) WHERE like_count IS NULL OR like_count = 0;

-- 更新收藏数
UPDATE workflows SET favorite_count = (
    SELECT COUNT(*) FROM user_favorites WHERE workflow_id = workflows.id
) WHERE favorite_count IS NULL OR favorite_count = 0;