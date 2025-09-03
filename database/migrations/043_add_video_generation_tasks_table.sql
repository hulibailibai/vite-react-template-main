-- 创建视频生成任务表
CREATE TABLE IF NOT EXISTS video_generation_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execute_id TEXT NOT NULL UNIQUE,
  workflow_id TEXT NOT NULL,
  token TEXT NOT NULL,
  notification_email TEXT NOT NULL,
  submission_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  result_data TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (submission_id) REFERENCES task_submissions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_status ON video_generation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_execute_id ON video_generation_tasks(execute_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_tasks_created_at ON video_generation_tasks(created_at);

-- 创建触发器自动更新 updated_at 字段
CREATE TRIGGER IF NOT EXISTS update_video_generation_tasks_updated_at
  AFTER UPDATE ON video_generation_tasks
  FOR EACH ROW
BEGIN
  UPDATE video_generation_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;