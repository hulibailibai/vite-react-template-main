#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 快速命令字段数据库迁移脚本
 * 用于为coze_workflows表添加quick_commands字段
 */
async function runQuickCommandsMigration() {
  try {
    console.log('🚀 开始quick_commands字段数据库迁移...');
    
    const migrationFile = '040_add_quick_commands_to_coze_workflows.sql';
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
      console.log('\n🎉 quick_commands字段迁移完成！');
      console.log('\n📊 已完成的更改:');
      console.log('  - 为coze_workflows表添加了quick_commands字段');
      console.log('  - 字段类型: TEXT (存储JSON数组)');
      console.log('  - 示例数据: ["草船借鉴","破釜沉舟"]');
      console.log('\n💡 提示: 现在可以在coze_workflows表中存储快速命令数组了');
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runQuickCommandsMigration();
}

module.exports = { runQuickCommandsMigration };