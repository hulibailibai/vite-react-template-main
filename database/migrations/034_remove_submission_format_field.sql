-- 删除tasks表的submission_format字段
-- 现在只使用submission_types字段来管理提交类型

-- 创建新的任务表结构（不包含submission_format字段）
CREATE TABLE IF NOT EXISTS tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT, -- 任务要求详情
    submission_types TEXT, -- 提交类型，JSON格式存储选中的类型 ["ai_app", "workflow"]
    reward_amount REAL NOT NULL DEFAULT 0.00, -- 任务奖励金额
    reward_type TEXT DEFAULT 'coins' CHECK (reward_type IN ('coins', 'points', 'cash')), -- 奖励类型
    start_date DATETIME NOT NULL, -- 任务开始时间
    end_date DATETIME NOT NULL, -- 任务结束时间
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    category VARCHAR(100), -- 任务分类
    created_by INTEGER NOT NULL, -- 创建者ID（管理员）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 复制现有数据到新表（排除submission_format字段）
INSERT INTO tasks_new (
    id, title, description, requirements, submission_types,
    reward_amount, reward_type, start_date, end_date, status, category, 
    created_by, created_at, updated_at
)
SELECT 
    id, title, description, requirements, submission_types,
    reward_amount, reward_type, start_date, end_date, status, category,
    created_by, created_at, updated_at
FROM tasks;

-- 删除旧表
DROP TABLE tasks;

-- 重命名新表
ALTER TABLE tasks_new RENAME TO tasks;

-- 重新创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_submission_types ON tasks(submission_types);