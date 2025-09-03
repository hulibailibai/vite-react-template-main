-- 添加会员免费标记字段到workflows表
ALTER TABLE workflows ADD COLUMN is_member_free BOOLEAN DEFAULT FALSE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_workflows_member_free ON workflows(is_member_free);

-- 注释：
-- is_member_free = TRUE 表示仅会员免费
-- is_member_free = FALSE 且 price = 0 表示所有用户免费
-- is_member_free = FALSE 且 price > 0 表示付费工作流