-- 为coze_workflows表添加task_id列
-- 用于关联任务大厅中的任务

-- 添加task_id字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN task_id INTEGER;

-- 添加外键约束（如果tasks表存在）
-- ALTER TABLE coze_workflows ADD CONSTRAINT fk_coze_workflows_task_id 
-- FOREIGN KEY (task_id) REFERENCES tasks(id);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_task_id ON coze_workflows(task_id);

-- 注释：task_id为可选字段，允许为NULL
-- 当用户通过任务大厅提交工作流时，会填入对应的任务ID
-- 当用户直接上传工作流时，task_id为NULL