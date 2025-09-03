-- 更新视频生成任务表，使用coze_workflows表替代已弃用的task_submissions表
-- 将submission_id字段重命名为coze_workflow_id并更新外键约束

-- 删除现有的video_generation_tasks表
DROP TABLE IF EXISTS video_generation_tasks;

-- 重新创建video_generation_tasks表，使用coze_workflows外键
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (coze_workflow_id) REFERENCES coze_workflows(id), -- 外键约束指向coze_workflows表
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 重新创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_status ON video_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_execute_id ON video_generation_tasks(execute_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_created_at ON video_generation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_coze_workflow_id ON video_generation_tasks(coze_workflow_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_user_id ON video_generation_tasks(user_id);

-- 重新创建触发器自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_video_generation_tasks_updated_at
  AFTER UPDATE ON video_generation_tasks
  FOR EACH ROW
BEGIN
  UPDATE video_generation_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;