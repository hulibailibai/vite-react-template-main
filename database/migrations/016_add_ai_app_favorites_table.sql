-- 创建AI应用收藏表
-- 016_add_ai_app_favorites_table.sql

-- 创建AI应用收藏表
CREATE TABLE IF NOT EXISTS ai_app_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ai_app_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ai_app_id) REFERENCES ai_apps(id) ON DELETE CASCADE,
    UNIQUE(user_id, ai_app_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_app_favorites_user ON ai_app_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_favorites_ai_app ON ai_app_favorites(ai_app_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_favorites_created ON ai_app_favorites(created_at);

-- 更新现有AI应用的收藏数统计
UPDATE ai_apps SET favorite_count = (
    SELECT COUNT(*) FROM ai_app_favorites WHERE ai_app_id = ai_apps.id
) WHERE favorite_count IS NULL OR favorite_count = 0;