const fs = require('fs');
const path = require('path');

/**
 * 运行下载会员免费字段迁移
 * 添加 is_download_member_free 字段到 coze_workflows 表
 */
async function runDownloadMemberFreeMigration() {
  console.log('🚀 开始运行下载会员免费字段迁移...');
  
  const databaseName = 'workflow-platform';
  const migrationFile = '049_add_is_download_member_free_to_coze_workflows.sql';
  const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
  
  // 检查迁移文件是否存在
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ 迁移文件不存在: ${migrationPath}`);
    return;
  }
  
  console.log(`\n📋 执行迁移文件: ${migrationFile}`);
  console.log(`📁 文件路径: ${migrationPath}`);
  
  // 读取并显示迁移内容
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('\n📄 迁移内容:');
  console.log('=' .repeat(50));
  console.log(migrationSQL);
  console.log('=' .repeat(50));
  
  // 生成执行命令
  const localCommand = `npx wrangler d1 execute ${databaseName} --file="${migrationPath}"`;
  const remoteCommand = `npx wrangler d1 execute ${databaseName} --remote --file="${migrationPath}"`;
  
  console.log('\n🔧 执行命令:');
  console.log('\n📍 本地数据库:');
  console.log(localCommand);
  console.log('\n🌐 远程数据库:');
  console.log(remoteCommand);
  
  console.log('\n📝 使用说明:');
  console.log('1. 复制上面的命令到终端执行');
  console.log('2. 先在本地测试，确认无误后再执行远程命令');
  console.log('3. 执行前请确保已安装 wrangler CLI 工具');
  
  console.log('\n✅ 迁移脚本准备完成！');
  
  // 可选：自动执行本地迁移（需要用户确认）
  console.log('\n❓ 是否要自动执行本地迁移？');
  console.log('如需自动执行，请取消注释下面的代码并重新运行脚本');
  
  /*
  const { execSync } = require('child_process');
  try {
    console.log('\n🔄 正在执行本地迁移...');
    execSync(localCommand, { stdio: 'inherit' });
    console.log('\n✅ 本地迁移执行成功！');
  } catch (error) {
    console.error('\n❌ 本地迁移执行失败:', error.message);
  }
  */
}

// 如果直接运行此脚本
if (require.main === module) {
  runDownloadMemberFreeMigration();
}

module.exports = { runDownloadMemberFreeMigration };