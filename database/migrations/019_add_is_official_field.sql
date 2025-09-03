-- 添加 is_official 字段到 workflows 表
ALTER TABLE workflows ADD COLUMN is_official BOOLEAN DEFAULT FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_workflows_is_official ON workflows(is_official);

-- 注释：
-- is_official: 标识是否为官方工作流，管理员上传的工作流标记为官方