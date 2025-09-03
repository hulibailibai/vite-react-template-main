#!/usr/bin/env node

/**
 * 管理后台启动脚本
 * 在指定端口启动管理后台服务
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const ADMIN_PORT = 8080;
const PUBLIC_IP = '8.163.27.251';
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * 执行命令
 */
function executeCommand(command, description, options = {}) {
  console.log(`\n🔄 ${description}...`);
  console.log(`执行命令: ${command}`);
  
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      cwd: PROJECT_ROOT,
      ...options
    });
    console.log(`✅ ${description} 完成`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} 失败:`);
    console.error(error.message);
    if (!options.ignoreError) {
      process.exit(1);
    }
  }
}

/**
 * 启动开发服务器
 */
function startDevServer() {
  console.log(`\n🚀 启动管理后台开发服务器...`);
  console.log(`端口: ${ADMIN_PORT}`);
  console.log(`公网访问地址: http://${PUBLIC_IP}:${ADMIN_PORT}`);
  console.log(`本地访问地址: http://localhost:${ADMIN_PORT}`);
  
  const command = 'wrangler dev --config wrangler.admin.json --port 8080 --ip 0.0.0.0';
  
  console.log(`\n执行命令: ${command}`);
  console.log('\n📝 注意事项:');
  console.log('  1. 请确保服务器安全组已开放8080端口');
  console.log('  2. 管理后台只允许管理员用户访问');
  console.log('  3. 使用 Ctrl+C 停止服务器');
  console.log('\n' + '='.repeat(60));
  
  // 使用spawn启动服务器，保持交互式输出
  const child = spawn('wrangler', ['dev', '--config', 'wrangler.admin.json', '--port', '8080', '--ip', '0.0.0.0'], {
    cwd: PROJECT_ROOT,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`\n🛑 管理后台服务器已停止 (退出码: ${code})`);
  });
  
  // 处理进程退出
  process.on('SIGINT', () => {
    console.log('\n🛑 正在停止管理后台服务器...');
    child.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 正在停止管理后台服务器...');
    child.kill('SIGTERM');
  });
}

/**
 * 构建生产版本
 */
function buildProduction() {
  console.log('🏗️ 构建管理后台生产版本...');
  
  // 构建前端资源
  executeCommand('npm run build:admin', '构建前端资源');
  
  console.log('\n✅ 管理后台构建完成！');
  console.log('\n📦 构建产物:');
  console.log('  - dist/admin/ (前端静态资源)');
  console.log('  - src/worker/admin.ts (后端Worker)');
  console.log('\n🚀 部署命令:');
  console.log('  wrangler deploy --config wrangler.admin.json');
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'dev';
  
  console.log('🔧 工作流分享平台 - 管理后台启动器');
  console.log(`模式: ${mode}`);
  
  // 检查必要文件
  const requiredFiles = [
    'wrangler.admin.json',
    'src/worker/admin.ts',
    'vite.admin.config.ts'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 缺少必要文件: ${file}`);
      process.exit(1);
    }
  }
  
  // 检查wrangler是否已安装
  try {
    execSync('wrangler --version', { encoding: 'utf8', stdio: 'ignore' });
    console.log('✅ Wrangler CLI 已安装');
  } catch (error) {
    console.error('❌ Wrangler CLI 未安装，请先安装: npm install -g wrangler');
    process.exit(1);
  }
  
  switch (mode) {
    case 'dev':
    case 'development':
      startDevServer();
      break;
    case 'build':
    case 'production':
      buildProduction();
      break;
    default:
      console.error('❌ 无效的模式，支持的模式: dev, build');
      console.log('\n使用方法:');
      console.log('  node scripts/start-admin.cjs dev    # 启动开发服务器');
      console.log('  node scripts/start-admin.cjs build  # 构建生产版本');
      process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };