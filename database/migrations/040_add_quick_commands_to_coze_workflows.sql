-- 为coze_workflows表添加quick_commands字段
-- 用于存储快速命令数组，例如：["草船借鉴","破釜沉舟"]

-- 添加quick_commands字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN quick_commands TEXT;

-- 添加索引以提高查询性能
CREate INDEX IF NOT EXISTS idx_coze_workflows_quick_commands ON coze_workflows(quick_commands);

-- 注释：quick_commands为可选字段，允许为NULL
-- 存储格式为JSON数组字符串，例如：'["草船借鉴","破釜沉舟"]'
-- 当工作流没有快速命令时，quick_commands为NULL