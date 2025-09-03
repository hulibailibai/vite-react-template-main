-- 更新任务表结构
-- 删除不需要的字段：priority、tags、attachment_urls、max_submissions
-- 添加缺少的字段：submission_format

-- 创建新的任务表结构
CREATE TABLE IF NOT EXISTS tasks_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT, -- 任务要求详情
    submission_format TEXT, -- 提交格式要求
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

-- 复制现有数据到新表（排除删除的字段）
INSERT INTO tasks_new (
    id, title, description, requirements, reward_amount, reward_type, 
    start_date, end_date, status, category, created_by, created_at, updated_at
)
SELECT 
    id, title, description, requirements, reward_amount, reward_type,
    start_date, end_date, status, category, created_by, created_at, updated_at
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

-- 更新任务提交表，删除attachment_urls字段
CREATE TABLE IF NOT EXISTS task_submissions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    submission_content TEXT NOT NULL, -- 提交内容
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
    review_comment TEXT, -- 审核意见
    reviewed_by INTEGER, -- 审核人ID
    reviewed_at DATETIME, -- 审核时间
    reward_granted BOOLEAN DEFAULT FALSE, -- 是否已发放奖励
    reward_granted_at DATETIME, -- 奖励发放时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    UNIQUE(task_id, user_id) -- 每个用户对每个任务只能提交一次
);

-- 复制现有提交数据到新表（排除attachment_urls字段）
INSERT INTO task_submissions_new (
    id, task_id, user_id, submission_content, status, review_comment,
    reviewed_by, reviewed_at, reward_granted, reward_granted_at, created_at, updated_at
)
SELECT 
    id, task_id, user_id, submission_content, status, review_comment,
    reviewed_by, reviewed_at, reward_granted, reward_granted_at, created_at, updated_at
FROM task_submissions;

-- 删除旧的提交表
DROP TABLE task_submissions;

-- 重命名新的提交表
ALTER TABLE task_submissions_new RENAME TO task_submissions;

-- 重新创建提交表索引
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_reviewed_by ON task_submissions(reviewed_by);