-- 清理ai_apps相关的遗留表
-- 028_cleanup_ai_apps_related_tables.sql

-- 这个迁移脚本用于删除所有与ai_apps表相关的遗留表
-- 这些表可能仍然存在并且有外键约束引用已删除的ai_apps表
-- 导致在删除用户时出现"no such table: main.ai_apps"错误

-- 删除社区帖子相关表（如果存在）
DROP TABLE IF EXISTS post_replies;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS community_posts;

-- 删除AI应用点赞表（如果存在）
DROP TABLE IF EXISTS ai_app_likes;

-- 删除AI应用收藏表（如果存在）
DROP TABLE IF EXISTS ai_app_favorites;

-- 删除AI应用运行记录表（如果存在）
DROP TABLE IF EXISTS ai_app_runs;

-- 删除AI应用评论表（如果存在）
DROP TABLE IF EXISTS ai_app_comments;

-- 删除AI应用标签关联表（如果存在）
DROP TABLE IF EXISTS ai_app_tags;

-- 删除AI应用分类关联表（如果存在）
DROP TABLE IF EXISTS ai_app_categories;

-- 删除任何其他可能引用ai_apps的表
DROP TABLE IF EXISTS ai_app_reviews;
DROP TABLE IF EXISTS ai_app_downloads;
DROP TABLE IF EXISTS ai_app_usage_logs;

-- 验证清理结果
SELECT 'AI apps related tables cleanup completed' as result;