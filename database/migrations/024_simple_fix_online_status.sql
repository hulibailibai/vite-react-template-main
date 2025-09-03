-- 简单修复：直接更新ai_apps表的CHECK约束以支持'online'状态
-- 基于实际的表结构

PRAGMA foreign_keys=off;

-- 创建新的ai_apps表（基于实际结构）
CREATE TABLE ai_apps_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    type TEXT DEFAULT 'ai_app' CHECK (type IN ('workflow', 'ai_app')),
    country TEXT,
    file_url TEXT,
    preview_images TEXT,
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

-- 复制数据
INSERT INTO ai_apps_new SELECT * FROM ai_apps;

-- 删除旧表并重命名新表
DROP TABLE ai_apps;
ALTER TABLE ai_apps_new RENAME TO ai_apps;

PRAGMA foreign_keys=on;

-- 验证修改
SELECT 'ai_apps table updated successfully' as result;