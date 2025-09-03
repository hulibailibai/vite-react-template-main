#!/usr/bin/env node

/**
 * 远程数据库初始化脚本
 * 用于在Cloudflare D1远程数据库中创建工作流分享平台所需的数据表
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const DATABASE_NAME = 'workflow-platform';
const SCHEMA_FILE = path.join(__dirname, '..', 'database', 'd1-schema.sql');

/**
 * 执行命令并输出结果
 */
function executeCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  console.log(`执行命令: ${command}`);
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log(`✅ ${description} 完成`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} 失败:`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * 检查文件是否存在
 */
function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${description} 不存在: ${filePath}`);
    process.exit(1);
  }
  console.log(`✅ ${description} 存在: ${filePath}`);
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始初始化工作流分享平台远程数据库...');
  console.log(`数据库名称: ${DATABASE_NAME}`);
  
  // 检查SQL文件是否存在
  checkFileExists(SCHEMA_FILE, 'SQL架构文件');
  
  // 检查wrangler是否已安装
  try {
    execSync('wrangler --version', { encoding: 'utf8' });
    console.log('✅ Wrangler CLI 已安装');
  } catch (error) {
    console.error('❌ Wrangler CLI 未安装，请先安装: npm install -g wrangler');
    process.exit(1);
  }
  
  // 执行SQL文件到远程D1数据库
  const sqlCommand = `wrangler d1 execute ${DATABASE_NAME} --remote --file="${SCHEMA_FILE}"`;
  executeCommand(sqlCommand, '执行远程数据库架构创建');
  
  console.log('\n🎉 远程数据库初始化完成！');
  console.log('\n📋 已创建的数据表:');
  console.log('  - users (用户表)');
  console.log('  - categories (分类表)');
  console.log('  - workflows (工作流表)');
  console.log('  - transactions (交易记录表)');
  console.log('  - user_workflows (用户工作流关系表)');
  console.log('  - reviews (评价表)');
  console.log('  - advertisements (广告表)');
  console.log('\n📊 已插入初始数据:');
  console.log('  - 基础分类和子分类');
  console.log('  - 管理员用户账户');
  console.log('\n💡 提示:');
  console.log('  1. 请确保在wrangler.json中配置了正确的database_id');
  console.log('  2. 你现在可以运行 npm run dev 启动开发服务器');
  console.log('  3. 部署到生产环境时使用 npm run deploy');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };