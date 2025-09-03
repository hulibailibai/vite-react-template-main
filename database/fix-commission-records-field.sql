-- 修复佣金记录表字段名不匹配问题
-- 将 total_rmb_amount 字段改为 total_wh_coins

-- SQLite 不支持直接重命名列，需要重建表

-- 1. 创建新的临时表
CREATE TABLE commission_records_temp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    total_wh_coins REAL NOT NULL,
    days INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. 复制数据（如果原表存在数据）
INSERT INTO commission_records_temp (id, user_id, admin_id, total_wh_coins, days, status, created_at, completed_at)
SELECT id, user_id, admin_id, 
       CASE 
           WHEN EXISTS(SELECT 1 FROM pragma_table_info('commission_records') WHERE name = 'total_rmb_amount') 
           THEN total_rmb_amount 
           ELSE total_wh_coins 
       END as total_wh_coins,
       days, status, created_at, completed_at
FROM commission_records;

-- 3. 删除原表
DROP TABLE commission_records;

-- 4. 重命名临时表
ALTER TABLE commission_records_temp RENAME TO commission_records;

-- 5. 重新创建索引
CREATE INDEX IF NOT EXISTS idx_commission_records_user_id ON commission_records(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_admin_id ON commission_records(admin_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_status ON commission_records(status);
CREATE INDEX IF NOT EXISTS idx_commission_records_created_at ON commission_records(created_at);