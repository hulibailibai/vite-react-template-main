#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 数据库迁移脚本
 * 用于执行缺失的数据库表创建
 */
async function runMigration() {
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '../database/migrations/029_add_task_management_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ 迁移文件不存在:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 迁移文件内容:');
    console.log('================');
    console.log(migrationSQL);
    console.log('================');
    
    console.log('\n✅ 迁移文件读取成功！');
    console.log('\n📝 请手动执行以下步骤：');
    console.log('1. 登录到 Cloudflare Dashboard');
    console.log('2. 进入 D1 数据库管理界面');
    console.log('3. 选择您的数据库');
    console.log('4. 在控制台中执行上述 SQL 语句');
    console.log('\n或者使用 wrangler CLI:');
    console.log(`wrangler d1 execute <database-name> --file=${migrationPath}`);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };