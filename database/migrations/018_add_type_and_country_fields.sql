-- 添加 type 和 country 字段到 workflows 表
ALTER TABLE workflows ADD COLUMN type TEXT DEFAULT 'workflow';
ALTER TABLE workflows ADD COLUMN country TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(type);
CREATE INDEX IF NOT EXISTS idx_workflows_country ON workflows(country);

-- 注释：
-- type: 工作流类型，如 'workflow', 'template', 'automation' 等
-- country: 工作流适用的国家/地区，如 'china', 'usa', 'global' 等