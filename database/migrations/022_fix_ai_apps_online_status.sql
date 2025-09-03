-- 修复ai_apps表的CHECK约束以支持'online'状态
-- 这个脚本需要在Cloudflare Dashboard中手动执行

-- 步骤1：禁用外键约束
PRAGMA foreign_keys=off;

-- 步骤2：创建新的ai_apps表，包含'online'状态支持
CREATE TABLE ai_apps_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    is_member_free BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'ai_app' CHECK (type IN ('workflow', 'ai_app')),
    country TEXT,
    file_url TEXT,
    preview_images TEXT,
    tags TEXT,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_avatar_url TEXT,
    opening_message TEXT,
    preset_questions TEXT,
    quick_commands TEXT,
    conversation_count INTEGER DEFAULT 0
);

-- 步骤3：复制数据
INSERT INTO ai_apps_temp SELECT * FROM ai_apps;

-- 步骤4：删除旧表
DROP TABLE ai_apps;

-- 步骤5：重命名新表
ALTER TABLE ai_apps_temp RENAME TO ai_apps;

-- 步骤6：重建索引
CREATE INDEX IF NOT EXISTS idx_ai_apps_creator ON ai_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_status ON ai_apps(status);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created_at ON ai_apps(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_apps_rating ON ai_apps(rating);
CREATE INDEX IF NOT EXISTS idx_ai_apps_price ON ai_apps(price);
CREATE INDEX IF NOT EXISTS idx_ai_apps_country ON ai_apps(country);

-- 步骤7：重新启用外键约束
PRAGMA foreign_keys=on;

-- 验证更新
SELECT 'ai_apps table updated successfully to support online status' as result;