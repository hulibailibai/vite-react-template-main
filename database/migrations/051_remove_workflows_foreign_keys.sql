-- 移除对workflows表的外键约束
-- 由于workflows表已被删除，需要重新创建这些表以移除外键约束

-- 重新创建user_likes表，移除对workflows的外键约束
DROP TABLE user_likes;
CREATE TABLE user_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workflow_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 重新创建user_favorites表，移除对workflows的外键约束
DROP TABLE user_favorites;
CREATE TABLE user_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workflow_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 重新创建download_logs表，移除对workflows的外键约束
DROP TABLE download_logs;
CREATE TABLE download_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workflow_id INTEGER,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 重新创建user_workflows表，移除对workflows的外键约束
DROP TABLE user_workflows;
CREATE TABLE user_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  workflow_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
);