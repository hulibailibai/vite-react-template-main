-- 为 ai_apps 表添加运行时长字段
-- 026_add_runtime_duration_field.sql
-- 添加 runtime_duration 字段用于存储AI应用的预估运行时长（分钟）

-- 为 ai_apps 表添加运行时长字段
ALTER TABLE ai_apps ADD COLUMN runtime_duration INTEGER DEFAULT NULL;

-- 添加注释说明
-- runtime_duration: AI应用预估运行时长（分钟），所有AI应用必填
-- NULL 表示未设置（历史数据兼容）
-- 正整数表示预估运行时长（分钟）