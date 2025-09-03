-- 为 user_initial_commission_configs 表添加 status 列
-- 修复用户佣金状态更新功能

-- 添加 status 列
ALTER TABLE user_initial_commission_configs 
ADD COLUMN status TEXT NOT NULL DEFAULT 'inactive' 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- 根据现有的 is_active 字段设置 status 值
UPDATE user_initial_commission_configs 
SET status = CASE 
    WHEN is_active = TRUE THEN 'active'
    ELSE 'inactive'
END;

-- 为新的 status 列创建索引
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_status 
ON user_initial_commission_configs(status);