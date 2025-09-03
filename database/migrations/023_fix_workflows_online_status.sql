-- 修复workflows表的CHECK约束以支持'online'状态
-- 这个脚本需要在Cloudflare Dashboard中手动执行

-- 步骤1：禁用外键约束
PRAGMA foreign_keys=off;

-- 步骤2：创建新的workflows表，包含'online'状态支持
CREATE TABLE workflows_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    subcategory_id INTEGER,
    price REAL DEFAULT 0.00,
    file_url TEXT,
    preview_images TEXT,
    tags TEXT,
    download_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'offline', 'online')),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    preview_video TEXT,
    like_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_member_free BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'workflow' CHECK (type IN ('workflow', 'ai_app')),
    country TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES categories(id)
);

-- 步骤3：复制数据
INSERT INTO workflows_temp (
    id, creator_id, title, description, category_id, subcategory_id, 
    price, file_url, preview_images, tags, download_count, rating, 
    rating_count, favorite_count, comment_count, status, is_featured, 
    created_at, updated_at, preview_video, like_count, view_count,
    is_member_free, type, country, is_official
) SELECT 
    id, creator_id, title, description, category_id, subcategory_id, 
    price, file_url, preview_images, tags, download_count, rating, 
    rating_count, favorite_count, comment_count, status, is_featured, 
    created_at, updated_at, preview_video, like_count, view_count,
    is_member_free, type, country, is_official
FROM workflows;

-- 步骤4：删除旧表
DROP TABLE workflows;

-- 步骤5：重命名新表
ALTER TABLE workflows_temp RENAME TO workflows;

-- 步骤6：重建索引
CREATE INDEX IF NOT EXISTS idx_workflows_creator ON workflows(creator_id);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);
CREATE INDEX IF NOT EXISTS idx_workflows_rating ON workflows(rating);
CREATE INDEX IF NOT EXISTS idx_workflows_download_count ON workflows(download_count);
CREATE INDEX IF NOT EXISTS idx_workflows_price ON workflows(price);
CREATE INDEX IF NOT EXISTS idx_workflows_country ON workflows(country);

-- 步骤7：重新启用外键约束
PRAGMA foreign_keys=on;

-- 验证更新
SELECT 'workflows table updated successfully to support online status' as result;