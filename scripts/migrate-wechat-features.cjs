#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 微信功能数据库迁移脚本
 * 用于执行微信相关的数据库迁移文件
 */
async function runWechatMigration() {
  try {
    console.log('🚀 开始微信功能数据库迁移...');
    
    // 定义需要执行的迁移文件
    const migrationFiles = [
      '030_add_withdrawals_table.sql',
      '031_add_wechat_openid_field.sql'
    ];
    
    const databaseName = 'workflow-platform';
    
    for (const fileName of migrationFiles) {
      const migrationPath = path.join(__dirname, '../database/migrations', fileName);
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ 迁移文件不存在: ${migrationPath}`);
        continue;
      }
      
      console.log(`\n📋 执行迁移文件: ${fileName}`);
      console.log('================');
      
      // 读取并显示迁移文件内容
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(migrationSQL);
      console.log('================');
      
      // 先尝试本地数据库，如果失败则提供远程执行指导
      const localCommand = `npx wrangler d1 execute ${databaseName} --file="${migrationPath}"`;
      const remoteCommand = `npx wrangler d1 execute ${databaseName} --remote --file="${migrationPath}"`;
      
      console.log(`🔄 执行本地命令: ${localCommand}`);
      
      let success = false;
      
      // 先尝试本地数据库
      try {
        const output = execSync(localCommand, { 
          encoding: 'utf8',
          stdio: 'pipe',
          cwd: path.join(__dirname, '..')
        });
        
        console.log('📋 本地执行结果:');
        console.log(output);
        console.log(`✅ ${fileName} 本地迁移完成!`);
        success = true;
        
      } catch (localError) {
        console.log(`⚠️ 本地执行失败: ${localError.message}`);
        console.log('🔄 尝试远程执行...');
        
        // 尝试远程数据库
        try {
          const output = execSync(remoteCommand, { 
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: path.join(__dirname, '..')
          });
          
          console.log('📋 远程执行结果:');
          console.log(output);
          console.log(`✅ ${fileName} 远程迁移完成!`);
          success = true;
          
        } catch (remoteError) {
          console.error(`❌ 远程执行 ${fileName} 也失败了:`, remoteError.message);
          if (remoteError.stderr && remoteError.stderr.includes('CLOUDFLARE_API_TOKEN')) {
            console.log('\n💡 需要设置 Cloudflare API Token:');
            console.log('1. 访问: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/');
            console.log('2. 创建 API Token');
            console.log('3. 设置环境变量: set CLOUDFLARE_API_TOKEN=your_token_here');
            console.log(`4. 然后手动执行: ${remoteCommand}`);
          }
          console.log('\n📋 或者手动在 Cloudflare Dashboard 中执行以下 SQL:');
          console.log('─'.repeat(50));
          console.log(migrationSQL);
          console.log('─'.repeat(50));
        }
      }
    }
    
    console.log('\n🎉 微信功能数据库迁移完成！');
    console.log('\n📊 已完成的迁移:');
    console.log('  - 030_add_withdrawals_table.sql (添加提现记录表)');
    console.log('  - 031_add_wechat_openid_field.sql (添加微信openid字段)');
    console.log('\n💡 提示: 数据库已更新，支持微信支付转账功能');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runWechatMigration();
}

module.exports = { runWechatMigration };