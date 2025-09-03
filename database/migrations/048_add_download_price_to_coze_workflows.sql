-- 为coze_workflows表添加download_price字段
-- 用于区分下载价格和运行价格
-- price字段将用于运行工作流的价格，download_price字段用于下载工作流的价格

-- 添加download_price字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN download_price REAL DEFAULT 0.00;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_download_price ON coze_workflows(download_price);

-- 注释说明：
-- price: 运行工作流的价格
-- download_price: 下载工作流的价格
-- 两个价格字段可以独立设置，支持不同的商业模式