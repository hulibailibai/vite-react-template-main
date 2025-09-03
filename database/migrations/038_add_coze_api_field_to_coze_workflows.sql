-- 为Coze工作流表添加coze_api字段

-- 添加coze_api字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN coze_api TEXT;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_coze_api ON coze_workflows(coze_api);