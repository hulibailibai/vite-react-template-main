-- 更新 ai_apps 表字段结构
-- 015_update_ai_apps_fields.sql
-- 删除不需要的字段：download_count, view_count, rating, rating_count
-- 添加使用次数字段：usage_count
-- run_count 字段保留作为对话次数

-- 禁用外键约束
PRAGMA foreign_keys = OFF;

-- 1. 创建新表结构
CREATE TABLE ai_apps_updated (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    coze_api_code TEXT,
    usage_instructions TEXT,
    tags TEXT,
    like_count INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0, -- 新增：使用次数
    run_count INTEGER DEFAULT 0, -- 保留：对话次数
    favorite_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_avatar_url TEXT,
    opening_message TEXT,
    preset_questions TEXT,
    quick_commands TEXT,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 2. 复制数据（排除要删除的字段）
INSERT INTO ai_apps_updated (
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags,
    like_count, usage_count, run_count, favorite_count,
    status, is_featured, created_at, updated_at,
    app_avatar_url, opening_message, preset_questions, quick_commands
)
SELECT 
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags,
    COALESCE(like_count, 0) as like_count,
    0 as usage_count, -- 新字段，默认为0
    COALESCE(run_count, 0) as run_count,
    COALESCE(favorite_count, 0) as favorite_count,
    status, is_featured, created_at, updated_at,
    app_avatar_url, opening_message, preset_questions, quick_commands
FROM ai_apps;

-- 3. 删除旧表
DROP TABLE ai_apps;

-- 4. 重命名新表
ALTER TABLE ai_apps_updated RENAME TO ai_apps;

-- 5. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_ai_apps_creator ON ai_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_status ON ai_apps(status);
CREATE INDEX IF NOT EXISTS idx_ai_apps_featured ON ai_apps(is_featured);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created ON ai_apps(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_apps_like_count ON ai_apps(like_count);
CREATE INDEX IF NOT EXISTS idx_ai_apps_usage_count ON ai_apps(usage_count);
CREATE INDEX IF NOT EXISTS idx_ai_apps_run_count ON ai_apps(run_count);
CREATE INDEX IF NOT EXISTS idx_ai_apps_app_avatar ON ai_apps(app_avatar_url);
CREATE INDEX IF NOT EXISTS idx_ai_apps_opening_message ON ai_apps(opening_message);

-- 重新启用外键约束
PRAGMA foreign_keys = ON;

-- 更新现有AI应用的统计数据
-- 更新点赞数
UPDATE ai_apps SET like_count = (
    SELECT COUNT(*) FROM ai_app_likes WHERE ai_app_id = ai_apps.id
) WHERE like_count IS NULL OR like_count = 0;

-- 更新使用次数（基于运行记录）
UPDATE ai_apps SET usage_count = (
    SELECT COUNT(*) FROM ai_app_runs WHERE ai_app_id = ai_apps.id
) WHERE usage_count IS NULL OR usage_count = 0;

-- 更新收藏数
UPDATE ai_apps SET favorite_count = (
    SELECT COUNT(*) FROM ai_app_favorites WHERE ai_app_id = ai_apps.id
) WHERE favorite_count IS NULL OR favorite_count = 0;