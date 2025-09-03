-- 为video_generation_tasks表添加debug_url字段
-- 用于存储Coze工作流的调试URL

-- 由于SQLite不支持直接添加字段，需要重新创建表
-- 首先备份现有数据
CREATE TABLE IF NOT EXISTS video_generation_tasks_backup AS 
SELECT * FROM video_generation_tasks;

-- 删除现有表
DROP TABLE IF EXISTS video_generation_tasks;

-- 重新创建表，添加debug_url字段
CREATE TABLE IF NOT EXISTS video_generation_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execute_id TEXT NOT NULL UNIQUE,
  workflow_id TEXT NOT NULL, -- Coze工作流ID
  token TEXT NOT NULL,
  notification_email TEXT NOT NULL,
  title TEXT, -- 视频任务标题
  coze_workflow_id INTEGER, -- 关联到coze_workflows表的ID，可选
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  result_data TEXT,
  error_message TEXT,
  debug_url TEXT, -- 新增：Coze工作流调试URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (coze_workflow_id) REFERENCES coze_workflows(id), -- 外键约束指向coze_workflows表
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 恢复现有数据
INSERT INTO video_generation_tasks (
  id, execute_id, workflow_id, token, notification_email, title, 
  coze_workflow_id, user_id, status, result_data, error_message, 
  created_at, updated_at, completed_at
)
SELECT 
  id, execute_id, workflow_id, token, notification_email, title,
  coze_workflow_id, user_id, status, result_data, error_message,
  created_at, updated_at, completed_at
FROM video_generation_tasks_backup;

-- 删除备份表
DROP TABLE video_generation_tasks_backup;

-- 重新创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_status ON video_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_execute_id ON video_generation_tasks(execute_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_created_at ON video_generation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_user_id ON video_generation_tasks(user_id);

-- 重新创建触发器自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_video_generation_tasks_updated_at
  AFTER UPDATE ON video_generation_tasks
  FOR EACH ROW
BEGIN
  UPDATE video_generation_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;