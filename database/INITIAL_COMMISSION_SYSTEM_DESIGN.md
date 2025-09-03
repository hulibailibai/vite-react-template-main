# 初始佣金管理系统数据表结构设计说明

## 概述

本文档详细说明了重新设计的初始佣金管理系统数据表结构，该结构完全替代了原有的 `commission_records` 和 `commission_daily_records` 表，提供了更完整、更灵活的佣金管理功能。

## 设计目标

1. **功能完整性**：支持初始佣金管理页面的所有功能需求
2. **数据完整性**：确保数据的一致性和完整性约束
3. **查询效率**：优化索引设计，提高查询性能
4. **扩展性**：考虑未来功能扩展的需求
5. **审计追踪**：完整的操作日志记录

## 数据表结构

### 1. 初始佣金计划表 (initial_commission_plans)

**用途**：管理不同的佣金计划配置

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PRIMARY KEY | 计划ID |
| name | TEXT NOT NULL | 计划名称 |
| description | TEXT | 计划描述 |
| fixed_amount | REAL NOT NULL | 固定佣金金额 |
| payout_cycle | INTEGER NOT NULL | 发放周期（天数） |
| trigger_type | TEXT NOT NULL | 触发类型：manual/workflow_threshold |
| workflow_threshold | INTEGER | Coze工作流数量阈值 |
| auto_trigger | BOOLEAN NOT NULL | 是否自动触发 |
| target_user_type | TEXT NOT NULL | 目标用户类型：all/specific |
| is_active | BOOLEAN NOT NULL | 计划是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| created_by | INTEGER | 创建者ID |

**支持的页面功能**：
- ✅ 佣金计划的创建、编辑、删除
- ✅ 计划状态管理（启用/禁用）
- ✅ 手动发放和自动触发配置
- ✅ 基于工作流数量的阈值触发
- ✅ 目标用户配置（所有用户或指定用户）

### 2. 初始佣金计划目标用户表 (initial_commission_plan_users)

**用途**：存储特定计划的目标用户列表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PRIMARY KEY | 记录ID |
| plan_id | INTEGER NOT NULL | 佣金计划ID |
| user_id | INTEGER NOT NULL | 用户ID |
| created_at | DATETIME | 创建时间 |

**支持的页面功能**：
- ✅ 为特定计划指定目标用户
- ✅ 用户选择和管理
- ✅ 计划参与用户统计

### 3. 用户初始佣金配置表 (user_initial_commission_configs)

**用途**：存储每个用户的佣金配置和状态

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PRIMARY KEY | 配置ID |
| user_id | INTEGER NOT NULL | 用户ID |
| plan_id | INTEGER | 关联的佣金计划ID |
| fixed_amount | REAL NOT NULL | 固定佣金金额 |
| payout_cycle | INTEGER NOT NULL | 发放周期（天数） |
| next_payout_date | DATE | 下次发放日期 |
| total_received | REAL NOT NULL | 累计已收到金额 |
| payout_count | INTEGER NOT NULL | 发放次数 |
| is_active | BOOLEAN NOT NULL | 是否启用佣金 |
| workflow_count | INTEGER NOT NULL | 当前工作流数量 |
| last_workflow_check_at | DATETIME | 最后工作流检查时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| activated_at | DATETIME | 激活时间 |
| deactivated_at | DATETIME | 停用时间 |
| activated_by | INTEGER | 激活操作者ID |

**支持的页面功能**：
- ✅ 用户佣金状态管理（启用/禁用）
- ✅ 个人佣金配置（金额、周期）
- ✅ 下次发放时间计算和显示
- ✅ 累计收益统计
- ✅ 发放次数统计
- ✅ 工作流数量跟踪（用于阈值触发）

### 4. 初始佣金发放记录表 (initial_commission_payouts)

**用途**：记录每次佣金发放的详细信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PRIMARY KEY | 发放记录ID |
| user_id | INTEGER NOT NULL | 用户ID |
| config_id | INTEGER NOT NULL | 用户佣金配置ID |
| plan_id | INTEGER | 关联的佣金计划ID |
| amount | REAL NOT NULL | 发放金额 |
| payout_type | TEXT NOT NULL | 发放类型：scheduled/manual/workflow_triggered |
| trigger_reason | TEXT | 触发原因描述 |
| workflow_count_at_trigger | INTEGER | 触发时的工作流数量 |
| scheduled_date | DATE NOT NULL | 计划发放日期 |
| actual_payout_date | DATE | 实际发放日期 |
| transaction_id | INTEGER | 关联的交易记录ID |
| status | TEXT NOT NULL | 发放状态：pending/processing/completed/failed/cancelled |
| failure_reason | TEXT | 失败原因 |
| retry_count | INTEGER NOT NULL | 重试次数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| processed_by | INTEGER | 处理者ID |

**支持的页面功能**：
- ✅ 佣金发放历史记录
- ✅ 发放状态跟踪
- ✅ 手动发放和自动发放记录
- ✅ 失败重试机制
- ✅ 发放统计和分析

### 5. 初始佣金操作日志表 (initial_commission_operation_logs)

**用途**：记录所有佣金相关的操作日志

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INTEGER PRIMARY KEY | 日志ID |
| operation_type | TEXT NOT NULL | 操作类型 |
| target_type | TEXT NOT NULL | 目标类型：plan/user_config/payout |
| target_id | INTEGER NOT NULL | 目标ID |
| user_id | INTEGER | 相关用户ID |
| operator_id | INTEGER NOT NULL | 操作者ID |
| operation_data | TEXT | 操作数据（JSON格式） |
| description | TEXT | 操作描述 |
| ip_address | TEXT | 操作者IP地址 |
| user_agent | TEXT | 用户代理 |
| created_at | DATETIME | 创建时间 |

**支持的页面功能**：
- ✅ 操作审计和追踪
- ✅ 系统安全监控
- ✅ 问题排查和调试

## 页面功能支持映射

### 统计卡片功能

| 统计项 | 数据来源 | SQL查询示例 |
|--------|----------|-------------|
| 总参与用户 | user_initial_commission_configs | `SELECT COUNT(*) FROM user_initial_commission_configs` |
| 活跃用户 | user_initial_commission_configs | `SELECT COUNT(*) FROM user_initial_commission_configs WHERE is_active = TRUE` |
| 累计发放 | initial_commission_payouts | `SELECT SUM(amount) FROM initial_commission_payouts WHERE status = 'completed'` |
| 月度预估 | user_initial_commission_configs | `SELECT SUM(fixed_amount * 30 / payout_cycle) FROM user_initial_commission_configs WHERE is_active = TRUE` |

### 佣金计划管理功能

- **创建计划**：插入 `initial_commission_plans` 表
- **编辑计划**：更新 `initial_commission_plans` 表
- **删除计划**：删除 `initial_commission_plans` 表记录
- **指定目标用户**：管理 `initial_commission_plan_users` 表
- **计划统计**：关联查询获取参与用户数量

### 用户管理功能

- **用户列表**：查询 `user_initial_commission_configs` 关联 `users` 表
- **启用/禁用佣金**：更新 `user_initial_commission_configs.is_active`
- **用户搜索**：基于用户名和邮箱的模糊查询
- **状态筛选**：基于 `is_active` 字段筛选
- **分页显示**：使用 LIMIT 和 OFFSET

### 发放记录功能

- **发放历史**：查询 `initial_commission_payouts` 表
- **状态跟踪**：基于 `status` 字段
- **失败重试**：更新 `retry_count` 和 `status`

## 索引优化

### 查询性能优化索引

1. **用户佣金配置查询**：
   - `idx_user_initial_commission_configs_user_id`
   - `idx_user_initial_commission_configs_is_active`
   - `idx_user_initial_commission_configs_next_payout_date`

2. **发放记录查询**：
   - `idx_initial_commission_payouts_user_id`
   - `idx_initial_commission_payouts_status`
   - `idx_initial_commission_payouts_scheduled_date`

3. **计划管理查询**：
   - `idx_initial_commission_plans_is_active`
   - `idx_initial_commission_plans_trigger_type`

## 数据完整性保证

### 外键约束
- 所有关联表都设置了适当的外键约束
- 使用 `ON DELETE CASCADE` 和 `ON DELETE SET NULL` 确保数据一致性

### 唯一性约束
- `user_initial_commission_configs.user_id`：每个用户只能有一个佣金配置
- `initial_commission_plan_users(plan_id, user_id)`：防止重复添加用户到同一计划

### 检查约束
- 状态字段使用 `CHECK` 约束限制有效值
- 触发类型、发放类型等枚举字段都有相应约束

## 扩展性设计

### 未来功能扩展支持

1. **多种佣金类型**：可扩展 `payout_type` 字段支持更多触发方式
2. **复杂计算规则**：可在计划表中添加计算公式字段
3. **分级佣金**：可扩展支持基于用户等级的不同佣金率
4. **批量操作**：操作日志表支持批量操作的记录
5. **国际化**：可添加多语言支持字段

### 性能扩展

1. **分区表**：大数据量时可按时间分区
2. **读写分离**：支持主从数据库架构
3. **缓存策略**：关键统计数据可缓存

## 迁移说明

### 数据迁移步骤

1. **备份现有数据**：迁移前备份 `commission_records` 和 `commission_daily_records`
2. **执行迁移脚本**：运行 `054_redesign_initial_commission_system.sql`
3. **数据验证**：验证新表结构和默认数据
4. **功能测试**：测试页面所有功能是否正常

### 回滚方案

如需回滚，可以：
1. 删除新创建的表
2. 从备份恢复原有表结构和数据
3. 更新应用代码以使用原有表结构

## 总结

新设计的初始佣金管理系统数据表结构具有以下优势：

1. **功能完整**：完全支持页面的所有功能需求
2. **结构清晰**：表职责明确，关系清楚
3. **性能优化**：合理的索引设计保证查询效率
4. **数据安全**：完整的约束和日志记录
5. **易于维护**：良好的设计便于后续维护和扩展

该设计不仅满足当前需求，还为未来的功能扩展预留了充分的空间。