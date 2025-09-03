-- 为coze_workflows表添加type字段
-- 用于区分工作流类型

-- 添加type字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN type TEXT DEFAULT 'workflow';

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_type ON coze_workflows(type);

-- 注释：type字段用于标识工作流类型
-- 可能的值：'workflow', 'template', 'automation' 等