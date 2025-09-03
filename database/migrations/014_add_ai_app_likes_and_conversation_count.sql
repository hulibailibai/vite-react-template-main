-- 添加AI应用点赞表和对话量字段
-- 014_add_ai_app_likes_and_conversation_count.sql

-- 创建AI应用点赞表
CREATE TABLE IF NOT EXISTS ai_app_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ai_app_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_app_id) REFERENCES ai_apps(id) ON DELETE CASCADE,
    UNIQUE(user_id, ai_app_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_app_likes_user ON ai_app_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_likes_ai_app ON ai_app_likes(ai_app_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_likes_created ON ai_app_likes(created_at);

-- 为ai_apps表添加对话量字段
ALTER TABLE ai_apps ADD COLUMN conversation_count INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_apps_conversation_count ON ai_apps(conversation_count);

-- 更新现有AI应用的统计数据
-- 更新点赞数
UPDATE ai_apps SET like_count = (
    SELECT COUNT(*) FROM ai_app_likes WHERE ai_app_id = ai_apps.id
) WHERE like_count IS NULL OR like_count = 0;

-- 更新对话量（基于运行记录）
UPDATE ai_apps SET conversation_count = (
    SELECT COUNT(*) FROM ai_app_runs WHERE ai_app_id = ai_apps.id AND status = 'completed'
) WHERE conversation_count IS NULL OR conversation_count = 0;