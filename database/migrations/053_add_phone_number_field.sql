-- 为用户表添加手机号码字段
-- 创建时间: 2024-01-20
-- 描述: 添加phone字段用于存储用户的手机号码，支持手机验证和联系功能

-- 添加手机号码字段
ALTER TABLE users ADD COLUMN phone TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 添加注释说明
-- phone: 用户的手机号码，用于身份验证、找回密码、接收通知等功能
-- 该字段为可选字段，用户可以选择绑定或不绑定手机号码
-- 建议格式：国际格式（如+86138****1234）或国内格式（如138****1234）