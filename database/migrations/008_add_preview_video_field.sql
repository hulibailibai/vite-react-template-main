-- 添加预览视频字段到workflows表
ALTER TABLE workflows ADD COLUMN preview_video TEXT;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_workflows_preview_video ON workflows(preview_video);