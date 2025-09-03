-- 任务发放模块数据表
-- 创建任务表和任务提交表

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT, -- 任务要求详情
    reward_amount REAL NOT NULL DEFAULT 0.00, -- 任务奖励金额
    reward_type TEXT DEFAULT 'coins' CHECK (reward_type IN ('coins', 'points', 'cash')), -- 奖励类型
    max_submissions INTEGER DEFAULT 1, -- 最大提交次数限制
    start_date DATETIME NOT NULL, -- 任务开始时间
    end_date DATETIME NOT NULL, -- 任务结束时间
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100), -- 任务分类
    tags TEXT, -- 任务标签，JSON格式
    attachment_urls TEXT, -- 附件链接，JSON格式
    created_by INTEGER NOT NULL, -- 创建者ID（管理员）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 任务提交表
CREATE TABLE IF NOT EXISTS task_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    submission_content TEXT NOT NULL, -- 提交内容
    attachment_urls TEXT, -- 提交附件，JSON格式
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
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

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_task_submissions_reviewed_by ON task_submissions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_task_submissions_submission_date ON task_submissions(submission_date);

-- 插入示例任务数据（可选）
INSERT INTO tasks (title, description, requirements, reward_amount, reward_type, max_submissions, start_date, end_date, status, priority, category, created_by) VALUES
('完善个人资料', '请完善您的个人资料信息，包括头像、昵称、个人简介等', '1. 上传个人头像\n2. 填写真实昵称\n3. 编写个人简介（不少于50字）\n4. 绑定手机号码', 10.00, 'coins', 1, datetime('now'), datetime('now', '+30 days'), 'active', 'medium', '新手任务', 1),
('分享工作流', '分享一个高质量的工作流到平台', '1. 工作流必须是原创或有使用权限\n2. 提供详细的使用说明\n3. 包含预览图片\n4. 设置合理的价格', 50.00, 'coins', 1, datetime('now'), datetime('now', '+60 days'), 'active', 'high', '内容创作', 1),
('邀请好友注册', '邀请好友注册并完成首次购买', '1. 通过邀请链接邀请好友\n2. 好友成功注册账号\n3. 好友完成首次工作流购买', 20.00, 'coins', 10, datetime('now'), datetime('now', '+90 days'), 'active', 'medium', '推广任务', 1);