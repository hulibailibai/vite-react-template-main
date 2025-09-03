#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * AI应用相关表清理迁移脚本
 * 用于删除所有与ai_apps表相关的遗留表，解决删除用户时的"no such table: main.ai_apps"错误
 */
async function runCleanupAiAppsMigration() {
  try {
    console.log('🚀 开始AI应用相关表清理迁移...');
    
    const migrationFile = '028_cleanup_ai_apps_related_tables.sql';
    const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
    const databaseName = 'workflow-platform';
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ 迁移文件不存在: ${migrationPath}`);
      return;
    }
    
    console.log(`\n📋 执行迁移文件: ${migrationFile}`);
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
        stdio: 'pipe' 
      });
      console.log('✅ 本地数据库迁移成功:');
      console.log(output);
      success = true;
    } catch (localError) {
      console.log('⚠️  本地数据库迁移失败，尝试远程数据库...');
      console.log('本地错误:', localError.message);
      
      // 尝试远程数据库
      try {
        console.log(`🔄 执行远程命令: ${remoteCommand}`);
        const remoteOutput = execSync(remoteCommand, { 
          encoding: 'utf8', 
          stdio: 'pipe' 
        });
        console.log('✅ 远程数据库迁移成功:');
        console.log(remoteOutput);
        success = true;
      } catch (remoteError) {
        console.error('❌ 远程数据库迁移也失败了:');
        console.error('远程错误:', remoteError.message);
        
        if (remoteError.stderr) {
          console.error('错误详情:', remoteError.stderr);
        }
        
        console.log('\n📋 请手动在 Cloudflare Dashboard 中执行以下 SQL:');
        console.log('─'.repeat(50));
        console.log(migrationSQL);
        console.log('─'.repeat(50));
      }
    }
    
    if (success) {
      console.log('\n🎉 AI应用相关表清理迁移完成！');
      console.log('\n📊 已完成的更改:');
      console.log('  - 删除了所有ai_apps相关的遗留表');
      console.log('  - 清理了可能导致外键约束错误的表');
      console.log('  - 解决了删除用户时的"no such table: main.ai_apps"错误');
      console.log('\n💡 提示: 现在删除用户应该不会再出现ai_apps相关的错误了');
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runCleanupAiAppsMigration();
}

module.exports = { runCleanupAiAppsMigration };