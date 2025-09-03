-- 添加任务领取表，用于记录用户领取任务的状态
-- 将任务领取和任务提交分离，解决领取任务后直接显示为已提交的问题

CREATE TABLE IF NOT EXISTS task_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'claimed' CHECK (status IN ('claimed', 'abandoned')),
    abandoned_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(task_id, user_id) -- 每个用户对每个任务只能领取一次
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_task_claims_task_id ON task_claims(task_id);
CREATE INDEX IF NOT EXISTS idx_task_claims_user_id ON task_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_task_claims_status ON task_claims(status);
CREATE INDEX IF NOT EXISTS idx_task_claims_claimed_at ON task_claims(claimed_at);

-- 从现有的task_submissions表中迁移领取记录
-- 对于状态为pending且没有submission_content的记录，将其转换为task_claims记录
INSERT INTO task_claims (task_id, user_id, claimed_at, status, created_at, updated_at)
SELECT 
    task_id, 
    user_id, 
    created_at as claimed_at,
    'claimed' as status,
    created_at,
    updated_at
FROM task_submissions 
WHERE status = 'pending' AND (submission_content = '' OR submission_content IS NULL);

-- 删除已迁移到task_claims的空提交记录
DELETE FROM task_submissions 
WHERE status = 'pending' AND (submission_content = '' OR submission_content IS NULL);