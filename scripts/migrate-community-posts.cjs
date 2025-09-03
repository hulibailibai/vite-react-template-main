// 社区帖子数据库迁移脚本
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 迁移文件路径
const migrationPath = path.join(__dirname, '../database/migration-add-community-posts.sql');

try {
  // 检查迁移文件是否存在
  if (!fs.existsSync(migrationPath)) {
    console.error('迁移文件不存在:', migrationPath);
    process.exit(1);
  }

  console.log('🚀 开始执行社区帖子数据库迁移...');
  console.log('📁 迁移文件:', migrationPath);
  
  // 使用wrangler执行迁移
  const command = `wrangler d1 execute workflow-platform --file="${migrationPath}"`;
  console.log('🔄 执行命令:', command);
  
  const output = execSync(command, { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('📋 执行结果:');
  console.log(output);
  
  console.log('\n✅ 社区帖子数据库迁移完成!');
  console.log('\n📊 已创建的表:');
  console.log('  - community_posts (社区帖子表)');
  console.log('  - community_post_likes (帖子点赞表)');
  console.log('  - community_post_replies (帖子回复表)');
  console.log('  - community_reply_likes (回复点赞表)');
  
} catch (error) {
  console.error('❌ 迁移失败:', error.message);
  if (error.stdout) {
    console.error('标准输出:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('错误输出:', error.stderr.toString());
  }
  process.exit(1);
}