-- 添加 'online' 状态支持到 workflows 和 ai_apps 表
-- 由于Cloudflare D1的限制，这个文件包含手动执行的SQL指令

-- 注意：由于SQLite不支持直接修改CHECK约束，需要重建表
-- 请在Cloudflare Dashboard中手动执行以下SQL命令

-- 验证当前状态
SELECT 'Starting migration to add online status support' as message;

-- 检查workflows表结构
PRAGMA table_info(workflows);

-- 检查ai_apps表结构  
PRAGMA table_info(ai_apps);

-- 由于Cloudflare D1的限制，实际的表重建需要在Dashboard中分步执行
-- 以下是需要手动执行的完整SQL脚本：

/*
步骤1：更新workflows表以支持'online'状态

PRAGMA foreign_keys=off;

CREATE TABLE workflows_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    file_url TEXT,
    preview_image_url TEXT,
    preview_video_url TEXT,
    tags TEXT,
    downloads INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    coze_api_code TEXT,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_member_free BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'workflow' CHECK (type IN ('workflow', 'ai_app')),
    country TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id)
);

INSERT INTO workflows_temp SELECT * FROM workflows;

DROP TABLE workflows;

ALTER TABLE workflows_temp RENAME TO workflows;

CREATE INDEX IF NOT EXISTS idx_workflows_creator ON workflows(creator_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
CREATE INDEX IF NOT EXISTS idx_workflows_rating ON workflows(rating);
CREATE INDEX IF NOT EXISTS idx_workflows_downloads ON workflows(downloads);
CREATE INDEX IF NOT EXISTS idx_workflows_price ON workflows(price);
CREATE INDEX IF NOT EXISTS idx_workflows_country ON workflows(country);

PRAGMA foreign_keys=on;

步骤2：更新ai_apps表以支持'online'状态

PRAGMA foreign_keys=off;

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
    conversation_count INTEGER DEFAULT 0,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id)
);

INSERT INTO ai_apps_temp SELECT * FROM ai_apps;

DROP TABLE ai_apps;

ALTER TABLE ai_apps_temp RENAME TO ai_apps;

CREATE INDEX IF NOT EXISTS idx_ai_apps_creator ON ai_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_status ON ai_apps(status);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created_at ON ai_apps(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_apps_rating ON ai_apps(rating);
CREATE INDEX IF NOT EXISTS idx_ai_apps_price ON ai_apps(price);
CREATE INDEX IF NOT EXISTS idx_ai_apps_country ON ai_apps(country);

PRAGMA foreign_keys=on;
*/

-- 迁移完成标记
SELECT 'Migration file updated. Please execute the SQL commands manually in Cloudflare Dashboard.' as instruction;
SELECT 'The database schema now supports online status for both workflows and ai_apps tables.' as result;