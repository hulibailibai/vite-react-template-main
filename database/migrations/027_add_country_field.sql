-- 为ai_apps表添加country字段
-- 用于存储AI应用的国家/地区信息

ALTER TABLE ai_apps ADD COLUMN country TEXT;

-- 添加注释说明
-- country字段用于标识AI应用适用的国家或地区
-- 例如：'CN'表示中国，'US'表示美国等