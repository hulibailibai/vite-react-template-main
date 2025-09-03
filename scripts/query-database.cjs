#!/usr/bin/env node

/**
 * 数据库查询脚本
 * 用于查看和验证 Cloudflare D1 数据库内容
 */

const { execSync } = require('child_process');
const path = require('path');

// 配置
const DATABASE_NAME = 'workflow-platform';

/**
 * 执行查询命令
 */
function executeQuery(query, description, isRemote = false) {
  const remoteFlag = isRemote ? '--remote' : '';
  const command = `wrangler d1 execute ${DATABASE_NAME} ${remoteFlag} --command="${query}"`;
  
  console.log(`\n📊 ${description}`);
  console.log(`查询: ${query}`);
  console.log('─'.repeat(50));
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return result;
  } catch (error) {
    console.error(`❌ 查询失败: ${error.message}`);
    return null;
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote') || args.includes('-r');
  const dbType = isRemote ? '远程' : '本地';
  
  console.log(`🔍 查询${dbType}数据库内容...`);
  console.log(`数据库名称: ${DATABASE_NAME}`);
  
  // 检查wrangler是否已安装
  try {
    execSync('wrangler --version', { encoding: 'utf8', stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Wrangler CLI 未安装，请先安装: npm install -g wrangler');
    process.exit(1);
  }
  
  // 查询所有表
  executeQuery(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
    '数据库表列表',
    isRemote
  );
  
  // 查询用户数据
  executeQuery(
    'SELECT id, username, email, role, status, created_at FROM users LIMIT 10;',
    '用户表数据（前10条）',
    isRemote
  );
  
  // 查询分类数据
  executeQuery(
    'SELECT id, name, parent_id, description FROM categories ORDER BY sort_order;',
    '分类表数据',
    isRemote
  );
  
  // 查询工作流数据
  executeQuery(
    'SELECT id, title, creator_id, category_id, price, status, download_count FROM workflows LIMIT 5;',
    '工作流表数据（前5条）',
    isRemote
  );
  
  // 统计信息
  executeQuery(
    'SELECT COUNT(*) as user_count FROM users;',
    '用户总数',
    isRemote
  );
  
  executeQuery(
    'SELECT COUNT(*) as category_count FROM categories;',
    '分类总数',
    isRemote
  );
  
  executeQuery(
    'SELECT COUNT(*) as workflow_count FROM workflows;',
    '工作流总数',
    isRemote
  );
  
  console.log('\n✅ 数据库查询完成！');
  console.log('\n💡 使用说明:');
  console.log('  - 查询本地数据库: npm run db:query');
  console.log('  - 查询远程数据库: npm run db:query -- --remote');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };