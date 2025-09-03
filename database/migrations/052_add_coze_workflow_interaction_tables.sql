-- 添加Coze工作流用户交互相关表
-- 包括点赞、收藏、购买、下载记录表

-- 创建Coze工作流点赞表
CREATE TABLE IF NOT EXISTS coze_workflow_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES coze_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(workflow_id, user_id)
);

-- 创建Coze工作流收藏表
CREATE TABLE IF NOT EXISTS coze_workflow_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES coze_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(workflow_id, user_id)
);

-- 创建Coze工作流购买记录表
CREATE TABLE IF NOT EXISTS coze_workflow_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'wh_coins',
  status TEXT NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (workflow_id) REFERENCES coze_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建Coze工作流下载记录表
CREATE TABLE IF NOT EXISTS coze_workflow_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES coze_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflow_likes_workflow_id ON coze_workflow_likes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_likes_user_id ON coze_workflow_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_favorites_workflow_id ON coze_workflow_favorites(workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_favorites_user_id ON coze_workflow_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_purchases_workflow_id ON coze_workflow_purchases(workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_purchases_user_id ON coze_workflow_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_purchases_status ON coze_workflow_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_downloads_workflow_id ON coze_workflow_downloads(workflow_id);
CREATE INDEX IF NOT EXISTS idx_coze_workflow_downloads_user_id ON coze_workflow_downloads(user_id);

-- 注释说明：
-- coze_workflow_likes: 存储用户对工作流的点赞记录
-- coze_workflow_favorites: 存储用户对工作流的收藏记录
-- coze_workflow_purchases: 存储工作流的购买记录，包括支付方式和状态
-- coze_workflow_downloads: 存储工作流的下载记录，用于统计下载次数