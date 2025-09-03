# 数据库设置指南

本项目使用 Cloudflare D1 数据库。以下是设置和初始化数据库的完整指南。

## 前提条件

1. 确保已安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```

2. 确保已登录到 Cloudflare 账户：
   ```bash
   wrangler auth login
   ```

## 数据库创建

如果你还没有创建 D1 数据库，请运行：

```bash
wrangler d1 create workflow-platform
```

创建成功后，你会看到类似以下的输出：
```
✅ Successfully created DB 'workflow-platform' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via point-in-time restore.

[[d1_databases]]
binding = "DB"
database_name = "workflow-platform"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**重要：** 请将输出中的 `database_id` 复制并更新到 `wrangler.json` 文件中。

## 更新配置

在 `wrangler.json` 文件中，将 `database_id` 替换为你的实际数据库 ID：

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "workflow-platform",
      "database_id": "你的实际数据库ID"
    }
  ]
}
```

## 数据库初始化

### 本地开发环境

对于本地开发，运行：

```bash
npm run db:setup
```

这将在本地 D1 数据库中创建所有必要的表和初始数据。

### 生产环境

对于生产环境（远程 D1 数据库），运行：

```bash
npm run db:setup-remote
```

**注意：** 确保在运行远程初始化之前，已经在 `wrangler.json` 中配置了正确的 `database_id`。

## 数据库架构

项目包含以下数据表：

- **users** - 用户表，存储用户信息和认证数据
- **categories** - 分类表，存储工作流分类信息
- **workflows** - 工作流表，存储工作流详细信息
- **transactions** - 交易记录表，存储购买和支付信息
- **user_workflows** - 用户工作流关系表，存储用户与工作流的关系
- **reviews** - 评价表，存储用户对工作流的评价
- **advertisements** - 广告表，存储广告信息

## 初始数据

数据库初始化时会自动插入：

- 基础分类和子分类数据
- 管理员用户账户（用户名：admin，邮箱：admin@workflow.com）

## 文件说明

- `schema.sql` - 原始 MySQL 架构文件
- `d1-schema.sql` - 适用于 Cloudflare D1 的 SQLite 架构文件
- `../scripts/setup-database.cjs` - 本地数据库初始化脚本
- `../scripts/setup-remote-database.cjs` - 远程数据库初始化脚本

## 常见问题

### Q: 如何查看数据库内容？

A: 使用 wrangler 命令查询：
```bash
# 本地数据库
wrangler d1 execute workflow-platform --command="SELECT * FROM users;"

# 远程数据库
wrangler d1 execute workflow-platform --remote --command="SELECT * FROM users;"
```

### Q: 如何重置数据库？

A: 删除并重新创建数据库：
```bash
# 删除数据库
wrangler d1 delete workflow-platform

# 重新创建
wrangler d1 create workflow-platform

# 重新初始化
npm run db:setup-remote
```

### Q: 本地和远程数据库有什么区别？

A: 
- 本地数据库用于开发测试，数据存储在 `.wrangler/state/v3/d1` 目录
- 远程数据库是 Cloudflare 云端的实际数据库，用于生产环境

## 下一步

数据库初始化完成后，你可以：

1. 运行开发服务器：`npm run dev`
2. 部署到生产环境：`npm run deploy`
3. 查看应用：访问本地开发地址或部署后的 URL