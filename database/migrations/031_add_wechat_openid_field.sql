-- 为用户表添加微信openid字段
-- 创建时间: 2024-01-16
-- 描述: 添加wechat_openid字段用于存储用户的微信openid，支持微信支付转账功能

-- 添加微信openid字段
ALTER TABLE users ADD COLUMN wechat_openid TEXT;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid);

-- 添加注释说明
-- wechat_openid: 用户的微信openid，用于微信支付转账等功能
-- 该字段为可选字段，用户可以选择绑定或不绑定微信账号