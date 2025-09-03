-- 添加is_member_free字段到workflows表
ALTER TABLE workflows ADD COLUMN is_member_free BOOLEAN DEFAULT FALSE;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_workflows_is_member_free ON workflows(is_member_free);