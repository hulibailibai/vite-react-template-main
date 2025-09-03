-- 添加提现记录表
-- 创建时间: 2024-01-15
-- 描述: 添加withdrawals表用于记录用户提现申请

CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY, -- 提现单号，如 WD20240115123456789
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL, -- 提现金额
    wechat_account TEXT NOT NULL, -- 微信账号
    payment_method TEXT DEFAULT 'wechat' CHECK (payment_method IN ('wechat', 'alipay')), -- 提现方式
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')), -- 提现状态
    batch_id TEXT, -- 微信商家转账批次号
    transfer_id TEXT, -- 微信商家转账转账单号
    failure_reason TEXT, -- 失败原因
    processed_at DATETIME, -- 处理时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_payment_method ON withdrawals(payment_method);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);
CREATE INDEX IF NOT EXISTS idx_withdrawals_batch_id ON withdrawals(batch_id);