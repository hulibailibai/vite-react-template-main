-- 添加 coze_api_code 字段到 ai_apps 表
-- 这个字段将存储完整的 curl 代码，而不是解析后的部分

-- 如果 ai_apps 表不存在，先创建它
CREATE TABLE IF NOT EXISTS ai_apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    thumbnail_url TEXT,
    screenshots TEXT, -- JSON array
    coze_api_url TEXT,
    coze_token TEXT,
    workflow_id TEXT,
    coze_api_code TEXT, -- 新增：存储完整的 curl 代码
    usage_instructions TEXT,
    input_parameters TEXT, -- JSON array
    tags TEXT, -- JSON array
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
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 如果表已存在但没有 coze_api_code 字段，则添加它
-- 注意：SQLite 不支持 IF NOT EXISTS 在 ALTER TABLE 中，所以这可能会报错但不影响功能
ALTER TABLE ai_apps ADD COLUMN coze_api_code TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_apps_creator ON ai_apps(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_status ON ai_apps(status);
CREATE INDEX IF NOT EXISTS idx_ai_apps_featured ON ai_apps(is_featured);
CREATE INDEX IF NOT EXISTS idx_ai_apps_created ON ai_apps(created_at);

-- AI应用运行记录表
CREATE TABLE IF NOT EXISTS ai_app_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ai_app_id INTEGER NOT NULL,
    input_data TEXT, -- JSON
    output_data TEXT, -- JSON
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT,
    execution_time INTEGER, -- 执行时间（毫秒）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ai_app_id) REFERENCES ai_apps(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_app_runs_user ON ai_app_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_runs_app ON ai_app_runs(ai_app_id);
CREATE INDEX IF NOT EXISTS idx_ai_app_runs_status ON ai_app_runs(status);
CREATE INDEX IF NOT EXISTS idx_ai_app_runs_created ON ai_app_runs(created_at);