# 管理后台部署指南

本文档介绍如何部署和访问工作流分享平台的管理后台系统。

## 概述

管理后台是一个独立的服务，运行在指定端口上，只允许管理员用户访问。通过公网IP地址和端口号可以直接访问管理后台。

## 配置信息

- **公网IP**: `8.163.27.251`
- **管理后台端口**: `8080`
- **访问地址**: `http://8.163.27.251:8080`
- **本地访问**: `http://localhost:8080`

## 文件结构

```
├── wrangler.admin.json          # 管理后台Wrangler配置
├── vite.admin.config.ts         # 管理后台Vite配置
├── src/worker/admin.ts          # 管理后台Worker入口
├── scripts/start-admin.cjs      # 管理后台启动脚本
└── docs/admin-setup.md          # 本文档
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

确保已经初始化了Cloudflare D1数据库：

```bash
# 初始化本地数据库
npm run db:setup

# 初始化远程数据库
npm run db:setup-remote
```

### 3. 启动管理后台

#### 开发模式

```bash
# 方式1: 使用npm脚本（推荐）
npm run admin:start

# 方式2: 使用dev:admin脚本
npm run dev:admin

# 方式3: 直接运行脚本
node scripts/start-admin.cjs dev
```

#### 构建生产版本

```bash
# 构建管理后台
npm run admin:build

# 部署到Cloudflare Workers
npm run deploy:admin
```

## 服务器配置

### 防火墙设置

确保服务器安全组已开放8080端口：

1. 登录服务器管理控制台
2. 找到安全组设置
3. 添加入站规则：
   - 协议：TCP
   - 端口：8080
   - 源：0.0.0.0/0（或指定IP范围）

### 网络配置

管理后台配置为监听所有网络接口（0.0.0.0），允许通过公网IP访问。

## 访问管理后台

### 1. 创建管理员账户

首先需要在数据库中创建管理员账户。可以通过以下方式：

#### 方式1: 使用数据库脚本

数据库初始化脚本已经创建了默认管理员账户：
- 用户名: `admin`
- 邮箱: `admin@example.com`
- 密码: `admin123`
- 角色: `admin`

#### 方式2: 手动创建

```sql
INSERT INTO users (username, email, password_hash, role, status) 
VALUES ('admin', 'your-email@example.com', 'hashed-password', 'admin', 'active');
```

### 2. 登录管理后台

1. 打开浏览器访问：`http://8.163.27.251:8080`
2. 系统会自动重定向到登录页面
3. 使用管理员账户登录
4. 登录成功后会重定向到管理后台首页

## 功能特性

### 权限控制

- 只有角色为 `admin` 的用户才能访问管理后台
- 所有管理页面都需要管理员权限验证
- 登录和OAuth回调页面不需要权限验证

### 路由配置

- `/` - 重定向到管理后台
- `/admin/*` - 管理后台页面（需要管理员权限）
- `/login` - 登录页面
- `/auth/*` - OAuth认证回调
- `/api/*` - API接口（继承主应用路由）
- `/health` - 健康检查

### API接口

- `GET /health` - 服务健康检查
- `GET /api/admin/check` - 管理员身份验证
- 其他API接口继承自主应用

## 开发调试

### 查看日志

```bash
# 启动时会显示详细日志
npm run admin:start
```

### 健康检查

```bash
# 检查服务状态
curl http://8.163.27.251:8080/health
```

### 验证管理员权限

```bash
# 需要先获取JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://8.163.27.251:8080/api/admin/check
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 检查端口占用
   netstat -ano | findstr :8080
   # 或使用其他端口
   ```

2. **无法访问公网IP**
   - 检查防火墙设置
   - 确认安全组规则
   - 验证服务器网络配置

3. **权限验证失败**
   - 确认用户角色为 `admin`
   - 检查JWT token是否有效
   - 验证数据库连接

4. **Wrangler CLI问题**
   ```bash
   # 重新安装Wrangler
   npm install -g wrangler
   
   # 检查版本
   wrangler --version
   ```

### 日志分析

管理后台启动时会显示：
- 服务启动信息
- 端口和IP配置
- 访问地址
- 注意事项

## 安全建议

1. **修改默认管理员密码**
   - 登录后立即修改默认密码
   - 使用强密码策略

2. **限制访问IP**
   - 在安全组中限制访问来源IP
   - 只允许必要的IP地址访问

3. **启用HTTPS**
   - 在生产环境中使用HTTPS
   - 配置SSL证书

4. **定期更新**
   - 定期更新依赖包
   - 关注安全补丁

## 部署到生产环境

### 1. 构建生产版本

```bash
npm run admin:build
```

### 2. 部署到Cloudflare Workers

```bash
npm run deploy:admin
```

### 3. 配置自定义域名（可选）

在Cloudflare Workers控制台中配置自定义域名，例如：
- `admin.yourdomain.com`

## 支持

如果遇到问题，请检查：
1. 服务器日志
2. 浏览器控制台
3. 网络连接
4. 防火墙设置

更多技术支持，请参考项目文档或联系开发团队。