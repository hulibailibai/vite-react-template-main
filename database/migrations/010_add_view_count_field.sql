-- 添加浏览量字段
-- 010_add_view_count_field.sql

-- 为 workflows 表添加 view_count 字段
ALTER TABLE workflows ADD COLUMN view_count INTEGER DEFAULT 0;

-- 创建索引来优化浏览量查询
CREATE INDEX IF NOT EXISTS idx_workflows_view_count ON workflows(view_count);

-- 如果你想要一些初始的模拟数据（可选），可以根据下载数来设置浏览量
-- 假设浏览量通常是下载量的3-5倍
UPDATE workflows SET view_count = download_count * 3 WHERE view_count = 0;