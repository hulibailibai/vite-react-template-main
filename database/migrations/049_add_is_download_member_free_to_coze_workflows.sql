-- 为coze_workflows表添加is_download_member_free字段
-- 用于标识下载功能是否对会员免费
-- 与现有的is_member_free字段区分，后者用于运行功能的会员免费设置

-- 添加is_download_member_free字段到coze_workflows表
ALTER TABLE coze_workflows ADD COLUMN is_download_member_free BOOLEAN DEFAULT false;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_coze_workflows_is_download_member_free ON coze_workflows(is_download_member_free);

-- 注释说明：
-- is_member_free: 运行工作流是否对会员免费
-- is_download_member_free: 下载工作流是否对会员免费
-- 两个字段可以独立设置，支持灵活的会员权益配置
-- 当is_download_member_free为true时，会员可以免费下载工作流
-- 当is_member_free为true时，会员可以免费运行工作流