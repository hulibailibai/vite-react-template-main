-- 添加 ai_usage 交易类型到 transactions 表
-- 这个迁移脚本用于更新现有数据库，添加 'ai_usage' 到 type 字段的约束中

-- 对于 SQLite (D1)，我们需要重新创建表来修改 CHECK 约束
-- 首先创建新表
CREATE TABLE IF NOT EXISTS transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workflow_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'recharge', 'withdrawal', 'commission', 'ai_usage')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT,
    payment_id TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- 复制现有数据
INSERT INTO transactions_new (id, user_id, workflow_id, type, amount, status, payment_method, payment_id, description, created_at)
SELECT id, user_id, workflow_id, type, amount, status, payment_method, payment_id, description, created_at
FROM transactions;

-- 删除旧表
DROP TABLE transactions;

-- 重命名新表
ALTER TABLE transactions_new RENAME TO transactions;

-- 重新创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_workflow ON transactions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);