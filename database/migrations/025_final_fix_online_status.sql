-- 修复ai_apps表的status字段CHECK约束以支持'online'状态
-- 基于实际的表结构

PRAGMA foreign_keys = OFF;

-- 创建新的ai_apps表，包含所有现有字段和修复的CHECK约束
CREATE TABLE ai_apps_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    price DECIMAL(10,2) DEFAULT 0.00,
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
    quick_commands TEXT,
    conversation_count INTEGER DEFAULT 0,
    is_member_free BOOLEAN DEFAULT FALSE
);

-- 复制所有数据到新表
INSERT INTO ai_apps_new (
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags, download_count, view_count, like_count,
    run_count, rating, rating_count, favorite_count, status, is_featured,
    created_at, updated_at, app_avatar_url, opening_message, preset_questions,
    quick_commands, conversation_count, is_member_free
)
SELECT 
    id, creator_id, title, description, category_id, subcategory_id, price,
    coze_api_code, usage_instructions, tags, download_count, view_count, like_count,
    run_count, rating, rating_count, favorite_count, status, is_featured,
    created_at, updated_at, app_avatar_url, opening_message, preset_questions,
    quick_commands, conversation_count, is_member_free
FROM ai_apps;

-- 删除旧表
DROP TABLE ai_apps;

-- 重命名新表
ALTER TABLE ai_apps_new RENAME TO ai_apps;

-- 重新创建索引（如果有的话）
CREATE INDEX IF NOT EXISTS idx_ai_apps_creator_id ON ai_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_category_id ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_status ON ai_apps(status);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created_at ON ai_apps(created_at);

PRAGMA foreign_keys = ON;

-- 验证修复
SELECT 'ai_apps表status字段CHECK约束修复完成' as result;