#!/usr/bin/env node

/**
 * 更新管理员账户脚本
 * 用于更新 Cloudflare D1 数据库中的管理员邮箱和密码
 */

const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// 配置
const DATABASE_NAME = 'workflow-platform';
const NEW_EMAIL = 'admin@example.chaofeng.com';
const NEW_PASSWORD = 'admin@chaofeng123.jkl';

/**
 * 密码哈希函数（与auth.ts中的hashPassword方法保持一致）
 */
function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

/**
 * 执行数据库命令
 */
function executeCommand(command, description) {
  console.log(`\n📝 ${description}`);
  console.log(`命令: ${command}`);
  console.log('─'.repeat(50));
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return result;
  } catch (error) {
    console.error(`❌ 执行失败: ${error.message}`);
    return null;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔧 更新管理员账户信息...');
  console.log(`数据库名称: ${DATABASE_NAME}`);
  console.log(`新邮箱: ${NEW_EMAIL}`);
  console.log(`新密码: ${NEW_PASSWORD}`);
  
  // 检查wrangler是否已安装
  try {
    execSync('wrangler --version', { encoding: 'utf8', stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Wrangler CLI 未安装，请先安装: npm install -g wrangler');
    process.exit(1);
  }
  
  // 生成密码哈希
  const hashedPassword = hashPassword(NEW_PASSWORD);
  console.log(`\n🔐 密码哈希: ${hashedPassword}`);
  
  // 查询当前管理员信息
  executeCommand(
    `wrangler d1 execute ${DATABASE_NAME} --remote --command="SELECT id, username, email, role FROM users WHERE role='admin';"`,
    '查询当前管理员信息'
  );
  
  // 更新管理员邮箱和密码
  const updateCommand = `wrangler d1 execute ${DATABASE_NAME} --remote --command="UPDATE users SET email='${NEW_EMAIL}', password_hash='${hashedPassword}' WHERE role='admin';"`;
  executeCommand(updateCommand, '更新管理员邮箱和密码');
  
  // 验证更新结果
  executeCommand(
    `wrangler d1 execute ${DATABASE_NAME} --remote --command="SELECT id, username, email, role FROM users WHERE role='admin';"`,
    '验证更新结果'
  );
  
  console.log('\n✅ 管理员账户更新完成！');
  console.log('\n📋 新的登录信息:');
  console.log(`   邮箱: ${NEW_EMAIL}`);
  console.log(`   密码: ${NEW_PASSWORD}`);
  console.log('\n💡 现在可以使用新的邮箱和密码登录管理后台了！');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };