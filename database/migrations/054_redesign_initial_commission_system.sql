-- 重新设计初始佣金管理系统数据表结构
-- 删除现有的commission相关表，创建新的初始佣金管理表结构

-- ============================================
-- 第一步：删除现有的commission相关表
-- ============================================

-- 删除现有表的索引
DROP INDEX IF EXISTS idx_commission_daily_records_commission_record_id;
DROP INDEX IF EXISTS idx_commission_daily_records_scheduled_date;
DROP INDEX IF EXISTS idx_commission_daily_records_status;
DROP INDEX IF EXISTS idx_commission_daily_records_day_number;

DROP INDEX IF EXISTS idx_commission_records_user_id;
DROP INDEX IF EXISTS idx_commission_records_admin_id;
DROP INDEX IF EXISTS idx_commission_records_status;
DROP INDEX IF EXISTS idx_commission_records_created_at;

-- 删除现有表
DROP TABLE IF EXISTS commission_daily_records;
DROP TABLE IF EXISTS commission_records;

-- ============================================
-- 第二步：创建新的初始佣金管理表结构
-- ============================================

-- 1. 初始佣金计划表 (initial_commission_plans)
-- 用于管理不同的佣金计划配置
CREATE TABLE IF NOT EXISTS initial_commission_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                              -- 计划名称
    description TEXT,                                 -- 计划描述
    fixed_amount REAL NOT NULL DEFAULT 0,            -- 固定佣金金额
    payout_cycle INTEGER NOT NULL DEFAULT 7,         -- 发放周期（天数）
    trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'workflow_threshold')), -- 触发类型
    workflow_threshold INTEGER,                       -- Coze工作流数量阈值（当trigger_type为workflow_threshold时使用）
    auto_trigger BOOLEAN NOT NULL DEFAULT FALSE,     -- 是否自动触发
    target_user_type TEXT NOT NULL DEFAULT 'all' CHECK (target_user_type IN ('all', 'specific')), -- 目标用户类型：all=所有用户，specific=指定用户
    is_active BOOLEAN NOT NULL DEFAULT TRUE,         -- 计划是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,                               -- 创建者ID
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. 初始佣金计划目标用户表 (initial_commission_plan_users)
-- 用于存储特定计划的目标用户列表
CREATE TABLE IF NOT EXISTS initial_commission_plan_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES initial_commission_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(plan_id, user_id)                          -- 防止重复添加同一用户到同一计划
);

-- 3. 用户初始佣金配置表 (user_initial_commission_configs)
-- 用于存储每个用户的佣金配置和状态
CREATE TABLE IF NOT EXISTS user_initial_commission_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_id INTEGER,                                  -- 关联的佣金计划ID（可为空，表示自定义配置）
    fixed_amount REAL NOT NULL DEFAULT 0,            -- 固定佣金金额
    payout_cycle INTEGER NOT NULL DEFAULT 7,         -- 发放周期（天数）
    next_payout_date DATE,                            -- 下次发放日期
    total_received REAL NOT NULL DEFAULT 0,          -- 累计已收到金额
    payout_count INTEGER NOT NULL DEFAULT 0,         -- 发放次数
    is_active BOOLEAN NOT NULL DEFAULT FALSE,        -- 是否启用佣金
    workflow_count INTEGER NOT NULL DEFAULT 0,       -- 当前工作流数量（用于阈值触发）
    last_workflow_check_at DATETIME,                  -- 最后一次工作流数量检查时间
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,                            -- 激活时间
    deactivated_at DATETIME,                          -- 停用时间
    activated_by INTEGER,                             -- 激活操作者ID
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES initial_commission_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (activated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id)                                   -- 每个用户只能有一个佣金配置
);

-- 4. 初始佣金发放记录表 (initial_commission_payouts)
-- 用于记录每次佣金发放的详细信息
CREATE TABLE IF NOT EXISTS initial_commission_payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    config_id INTEGER NOT NULL,                       -- 关联的用户佣金配置ID
    plan_id INTEGER,                                  -- 关联的佣金计划ID（可为空）
    amount REAL NOT NULL,                            -- 发放金额
    payout_type TEXT NOT NULL DEFAULT 'scheduled' CHECK (payout_type IN ('scheduled', 'manual', 'workflow_triggered')), -- 发放类型
    trigger_reason TEXT,                              -- 触发原因描述
    workflow_count_at_trigger INTEGER,               -- 触发时的工作流数量
    scheduled_date DATE NOT NULL,                    -- 计划发放日期
    actual_payout_date DATE,                         -- 实际发放日期
    transaction_id INTEGER,                          -- 关联的交易记录ID
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')), -- 发放状态
    failure_reason TEXT,                             -- 失败原因
    retry_count INTEGER NOT NULL DEFAULT 0,         -- 重试次数
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_by INTEGER,                            -- 处理者ID
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (config_id) REFERENCES user_initial_commission_configs(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES initial_commission_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. 初始佣金操作日志表 (initial_commission_operation_logs)
-- 用于记录所有佣金相关的操作日志，便于审计和追踪
CREATE TABLE IF NOT EXISTS initial_commission_operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('plan_created', 'plan_updated', 'plan_deleted', 'user_activated', 'user_deactivated', 'payout_created', 'payout_processed', 'config_updated')), -- 操作类型
    target_type TEXT NOT NULL CHECK (target_type IN ('plan', 'user_config', 'payout')), -- 目标类型
    target_id INTEGER NOT NULL,                      -- 目标ID
    user_id INTEGER,                                  -- 相关用户ID（如果适用）
    operator_id INTEGER NOT NULL,                    -- 操作者ID
    operation_data TEXT,                             -- 操作数据（JSON格式）
    description TEXT,                                -- 操作描述
    ip_address TEXT,                                 -- 操作者IP地址
    user_agent TEXT,                                 -- 用户代理
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 第三步：创建索引以优化查询性能
-- ============================================

-- initial_commission_plans 表索引
CREATE INDEX IF NOT EXISTS idx_initial_commission_plans_is_active ON initial_commission_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_initial_commission_plans_trigger_type ON initial_commission_plans(trigger_type);
CREATE INDEX IF NOT EXISTS idx_initial_commission_plans_created_at ON initial_commission_plans(created_at);

-- initial_commission_plan_users 表索引
CREATE INDEX IF NOT EXISTS idx_initial_commission_plan_users_plan_id ON initial_commission_plan_users(plan_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_plan_users_user_id ON initial_commission_plan_users(user_id);

-- user_initial_commission_configs 表索引
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_user_id ON user_initial_commission_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_plan_id ON user_initial_commission_configs(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_is_active ON user_initial_commission_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_next_payout_date ON user_initial_commission_configs(next_payout_date);
CREATE INDEX IF NOT EXISTS idx_user_initial_commission_configs_workflow_count ON user_initial_commission_configs(workflow_count);

-- initial_commission_payouts 表索引
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_user_id ON initial_commission_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_config_id ON initial_commission_payouts(config_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_plan_id ON initial_commission_payouts(plan_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_status ON initial_commission_payouts(status);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_scheduled_date ON initial_commission_payouts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_actual_payout_date ON initial_commission_payouts(actual_payout_date);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_payout_type ON initial_commission_payouts(payout_type);
CREATE INDEX IF NOT EXISTS idx_initial_commission_payouts_created_at ON initial_commission_payouts(created_at);

-- initial_commission_operation_logs 表索引
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_operation_type ON initial_commission_operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_target_type ON initial_commission_operation_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_target_id ON initial_commission_operation_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_user_id ON initial_commission_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_operator_id ON initial_commission_operation_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_initial_commission_operation_logs_created_at ON initial_commission_operation_logs(created_at);

-- ============================================
-- 第四步：插入默认数据
-- ============================================

-- 插入默认的佣金计划
INSERT OR IGNORE INTO initial_commission_plans (
    id, name, description, fixed_amount, payout_cycle, trigger_type, auto_trigger, target_user_type, is_active
) VALUES 
(1, '新手创作者激励计划', '为新注册的创作者提供初期激励，帮助他们快速上手', 50.0, 7, 'manual', FALSE, 'all', TRUE),
(2, '工作流达标奖励', '当创作者发布的Coze工作流达到5个时自动发放奖励', 100.0, 14, 'workflow_threshold', TRUE, 'all', TRUE);

-- 更新工作流达标奖励计划的阈值
UPDATE initial_commission_plans SET workflow_threshold = 5 WHERE id = 2;