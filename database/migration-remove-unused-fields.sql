-- 删除 ai_apps 表中不再需要的字段
-- 这些字段包括：coze_api_url, coze_token, workflow_id, thumbnail_url, screenshots

-- 禁用外键约束
PRAGMA foreign_keys = OFF;

-- 1. 创建新表结构（不包含要删除的字段）
CREATE TABLE ai_apps_new (
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
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    run_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_avatar_url TEXT,
    opening_message TEXT,
    preset_questions TEXT,
    quick_commands TEXT
);

-- 2. 复制数据（排除要删除的字段）
INSERT INTO ai_apps_new (
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags,
    download_count, view_count, like_count, run_count, rating, rating_count, favorite_count,
    status, is_featured, created_at, updated_at,
    app_avatar_url, opening_message, preset_questions, quick_commands
)
SELECT 
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags,
    download_count, view_count, like_count, run_count, rating, rating_count, favorite_count,
    status, is_featured, created_at, updated_at,
    app_avatar_url, opening_message, preset_questions, quick_commands
FROM ai_apps;

-- 3. 删除旧表
DROP TABLE ai_apps;

-- 4. 重命名新表
ALTER TABLE ai_apps_new RENAME TO ai_apps;

-- 5. 重新创建索引
CREATE INDEX idx_ai_apps_creator ON ai_apps(creator_id);
CREATE INDEX idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX idx_ai_apps_status ON ai_apps(status);
CREATE INDEX idx_ai_apps_featured ON ai_apps(is_featured);
CREATE INDEX idx_ai_apps_created ON ai_apps(created_at);
CREATE INDEX idx_ai_apps_app_avatar ON ai_apps(app_avatar_url);
CREATE INDEX idx_ai_apps_opening_message ON ai_apps(opening_message);

-- 重新启用外键约束
PRAGMA foreign_keys = ON;