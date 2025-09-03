const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保admin_logs表存在的脚本
async function ensureAdminLogsTable() {
  try {
    console.log('正在检查并创建admin_logs表...');
    
    // 读取迁移文件
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '007_add_admin_logs_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('迁移文件不存在:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('迁移SQL内容:');
    console.log(migrationSQL);
    
    // 执行迁移
    console.log('\n正在执行数据库迁移...');
    
    // 使用wrangler d1 execute命令执行迁移
    const command = `npx wrangler d1 execute workflow-platform --file="${migrationPath}"`;
    console.log('执行命令:', command);
    
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      console.log('迁移执行成功:');
      console.log(output);
    } catch (execError) {
      console.error('执行迁移时出错:', execError.message);
      if (execError.stdout) {
        console.log('stdout:', execError.stdout);
      }
      if (execError.stderr) {
        console.error('stderr:', execError.stderr);
      }
    }
    
  } catch (error) {
    console.error('确保admin_logs表时出错:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  ensureAdminLogsTable();
}

module.exports = { ensureAdminLogsTable };