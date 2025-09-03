-- 为users表添加WH币字段
ALTER TABLE users ADD COLUMN wh_coins INTEGER DEFAULT 0;

-- 为现有用户初始化WH币余额为0
UPDATE users SET wh_coins = 0 WHERE wh_coins IS NULL;