import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService, createErrorResponse, createSuccessResponse } from './auth';
import { D1Database } from './database-real';
import type { Env, User, JWTPayload } from './types';
import type { Context, Next } from 'hono';

// 自定义Context类型
type AppContext = {
  Bindings: Env;
  Variables: {
    user: User;
    payload: JWTPayload;
  };
};

const app = new Hono<AppContext>();

// 认证中间件
const authMiddleware = async (c: Context<AppContext>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json(createErrorResponse(401, '未提供认证信息'), 401);
  }

  const db = new D1Database(c.env);
  const authService = new AuthService(c.env, db);
  const token = authService.extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json(createErrorResponse(401, '无效的认证格式'), 401);
  }

  const authResult = await authService.verifyPermission(token);
  if (!authResult) {
    return c.json(createErrorResponse(401, '认证失败或已过期'), 401);
  }

  c.set('user', authResult.user);
  await next();
};

// 管理员权限中间件（包括超级管理员）
const adminMiddleware = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('user');
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return c.json(createErrorResponse(403, '需要管理员权限'), 403);
  }
  await next();
};



// CORS配置
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://8.163.27.251:8080', 'https://8.163.27.251:8080'],
  credentials: true,
}));

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'workflow-platform-admin',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  });
});

// 管理员登录检查
app.get('/api/admin/check', authMiddleware, adminMiddleware, (c) => {
  const user = c.get('user');
  return c.json(createSuccessResponse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  }));
});

// 管理后台API路由 - 代理到主应用
app.all('/api/*', async (c) => {
  // 导入主应用的API路由
  const { default: mainApp } = await import('./index');
  return mainApp.fetch(c.req.raw, c.env, c.executionCtx);
});

// 根API路由
app.get('/api', async (c) => {
  const { default: mainApp } = await import('./index');
  return mainApp.fetch(c.req.raw, c.env, c.executionCtx);
});

// 管理后台页面路由 - 所有管理页面都需要管理员权限
app.get('/admin/*', authMiddleware, adminMiddleware, async (c) => {
  // 返回管理后台的HTML页面
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
    <script type="module" crossorigin src="/assets/main-Bx3A1DOe.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-DXfAJWVm.css">
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>`;
  return c.html(html);
});

app.get('/admin', authMiddleware, adminMiddleware, async (c) => {
  // 返回管理后台的HTML页面
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
    <script type="module" crossorigin src="/assets/main-Bx3A1DOe.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-DXfAJWVm.css">
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>`;
  return c.html(html);
});

// 登录页面不需要权限验证
app.get('/login', async (c) => {
  // 返回登录页面的HTML
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
    <script type="module" crossorigin src="/assets/main-Bx3A1DOe.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-DXfAJWVm.css">
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>`;
  return c.html(html);
});

app.get('/auth/*', async (c) => {
  // 返回认证页面的HTML
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
    <script type="module" crossorigin src="/assets/main-Bx3A1DOe.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/main-DXfAJWVm.css">
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>`;
  return c.html(html);
});

// 静态资源路由 - 不需要认证
app.get('/assets/*', async (_c) => {
  // 静态资源由Cloudflare Workers的assets配置处理
  // 这里返回404，让Cloudflare Workers的assets系统处理
  return new Response(null, { status: 404 });
});

app.get('/vite.svg', async (_c) => {
  // 静态资源由Cloudflare Workers的assets配置处理
  return new Response(null, { status: 404 });
});

// 根路径重定向到管理后台
app.get('/', (c) => {
  return c.redirect('/admin');
});

// 404处理
app.notFound((c) => {
  return c.json(createErrorResponse(404, '页面不存在'), 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Admin server error:', err);
  return c.json(createErrorResponse(500, '服务器内部错误'), 500);
});

export default app;