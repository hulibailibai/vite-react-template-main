-- 为 ai_apps 表添加新的功能字段
-- 支持应用头像、开场白、预置问题和快捷指令功能

-- 添加应用头像字段
ALTER TABLE ai_apps ADD COLUMN app_avatar_url TEXT;

-- 添加开场白字段
ALTER TABLE ai_apps ADD COLUMN opening_message TEXT;

-- 添加预置问题字段（JSON格式存储）
ALTER TABLE ai_apps ADD COLUMN preset_questions TEXT; -- JSON array

-- 添加快捷指令字段（JSON格式存储）
ALTER TABLE ai_apps ADD COLUMN quick_commands TEXT; -- JSON array of {name, command}

-- 创建相关索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_apps_app_avatar ON ai_apps(app_avatar_url);
CREATE INDEX IF NOT EXISTS idx_ai_apps_opening_message ON ai_apps(opening_message);

-- 更新现有记录的默认值（可选）
-- UPDATE ai_apps SET preset_questions = '[]' WHERE preset_questions IS NULL;
-- UPDATE ai_apps SET quick_commands = '[]' WHERE quick_commands IS NULL;