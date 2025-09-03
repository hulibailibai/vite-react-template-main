-- 佣金记录表迁移
-- 用于记录创作者的佣金奖励和按天发放的详细信息

-- 佣金记录主表
CREATE TABLE IF NOT EXISTS commission_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    total_rmb_amount REAL NOT NULL,
    days INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commission_records_user_id ON commission_records(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_admin_id ON commission_records(admin_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_records_created_at ON commission_records(created_at);

-- 每日佣金发放详情表
CREATE TABLE IF NOT EXISTS commission_daily_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commission_record_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    rmb_amount REAL NOT NULL,
    reason TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_date DATE NULL,
    transaction_id INTEGER NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (commission_record_id) REFERENCES commission_records(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_commission_record_id ON commission_daily_records(commission_record_id);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_scheduled_date ON commission_daily_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_status ON commission_daily_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_daily_records_day_number ON commission_daily_records(day_number);

-- 为transactions表添加佣金相关字段（如果不存在）
-- SQLite不支持ADD COLUMN IF NOT EXISTS，所以我们需要检查列是否存在
-- 这里使用安全的方式添加列
PRAGMA table_info(transactions);

-- 尝试添加列，如果已存在会失败但不影响
ALTER TABLE transactions ADD COLUMN commission_record_id INTEGER;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transactions_commission_record_id ON transactions(commission_record_id);