import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { Env, User, JWTPayload } from './types';
import { D1Database } from './database-real';
import { AuthService, createSuccessResponse, createErrorResponse, validateEmail, validateUsername, sanitizeInput } from './auth';
import { WechatPayService } from './wechat-pay';
import { startVideoTaskMonitor, stopVideoTaskMonitor } from './services/videoTaskMonitor';
import { getCommissionPayoutMonitor } from './services/commissionPayoutMonitor';

// 自定义Context类型
type AppContext = {
  Bindings: Env;
  Variables: {
    user: User;
    payload: JWTPayload;
  };
};

const app = new Hono<AppContext>();

// 全局监控服务状态
let monitorServicesStarted = false;

// 启动监控服务
app.use('*', async (c, next) => {
  // 在第一次请求时启动监控服务
  if (!monitorServicesStarted) {
    console.log('首次请求，启动视频任务监控服务...');
    startVideoTaskMonitor(c.env);
    
    console.log('启动佣金发放监控服务...');
    const commissionMonitor = getCommissionPayoutMonitor(c.env);
    commissionMonitor.start();
    
    monitorServicesStarted = true;
    console.log('所有监控服务已启动');
  }
  await next();
});

// 中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use('*', logger());
app.use('/api/*', prettyJSON());

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
  c.set('payload', authResult.payload);
  await next();
};

// 管理员权限中间件
const adminMiddleware = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('user');
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return c.json(createErrorResponse(403, '需要管理员权限'), 403);
  }
  await next();
};

// 创作者权限中间件
const creatorMiddleware = async (c: Context<AppContext>, next: Next) => {
  const user = c.get('user');
  if (!user || !['creator', 'admin', 'super_admin'].includes(user.role)) {
    return c.json(createErrorResponse(403, '需要创作者权限'), 403);
  }
  await next();
};

// 基础路由
app.get('/api/', (c) => {
  return c.json(createSuccessResponse({
    name: '工作流分享平台',
    version: '1.0.0',
    description: '基于React + Hono + Cloudflare Workers的工作流分享平台'
  }));
});

// 首页统计数据接口
app.get('/api/home/stats', async (c) => {
  try {
    // 获取统计数据
    const [workflowStats, userStats, usageStats] = await Promise.all([
      // 获取工作流统计（使用coze_workflows表替代workflows表）
      c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM coze_workflows 
        WHERE status = 'online'
      `).first(),
      
      // 获取用户统计（所有用户记录数）
      c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM users
      `).first(),
      
      // 获取使用量统计（工作流download_count总和）
      c.env.DB.prepare(`
        SELECT COALESCE(SUM(download_count), 0) as downloads
        FROM coze_workflows
      `).first()
    ]);
    
    const totalWorks = (workflowStats as any)?.count || 0;
    const totalUsers = (userStats as any)?.count || 0;
    const totalDownloads = (usageStats as any)?.downloads || 0;
    const totalUsage = totalDownloads;
    
    const stats = {
      totalWorks: totalWorks,
      totalUsers: totalUsers,
      totalUsage: totalUsage
    };
    
    return c.json(createSuccessResponse(stats));
   } catch (error) {
     console.error('Get home stats error:', error);
     return c.json(createErrorResponse(500, '获取首页统计数据失败', 'server', '服务器内部错误'), 500);
   }
 });


// 认证相关路由
// 发送邮箱验证码
app.post('/api/auth/send-verification-code', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(createErrorResponse(400, '缺少邮箱参数', 'email', '请提供邮箱地址'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, '邮箱格式错误', 'email', '请输入有效的邮箱地址'), 400);
    }

    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);

    const result = await authService.sendEmailVerificationCode(sanitizeInput(email));
    return c.json(result, result.code as any);
  } catch (error) {
    return c.json(createErrorResponse(500, '发送验证码失败', 'server', '服务器内部错误'), 500);
  }
});

// 验证邮箱验证码
app.post('/api/auth/verify-email-code', async (c) => {
  try {
    const body = await c.req.json();
    const { email, code } = body;

    if (!email || !code) {
      return c.json(createErrorResponse(400, '缺少必要参数', 'form', '邮箱和验证码不能为空'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, '邮箱格式错误', 'email', '请输入有效的邮箱地址'), 400);
    }

    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);

    const result = await authService.verifyEmailCode(sanitizeInput(email), sanitizeInput(code));
    return c.json(result, result.code as any);
  } catch (error) {
    return c.json(createErrorResponse(500, '验证失败', 'server', '服务器内部错误'), 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password, verificationCode, role = 'user' } = body;

    // 输入验证
    if (!username || !email || !password || !verificationCode) {
      return c.json(createErrorResponse(400, '缺少必要参数', 'form', '用户名、邮箱、密码和验证码不能为空'), 400);
    }

    if (!validateUsername(username)) {
      return c.json(createErrorResponse(400, '用户名格式错误', 'username', '用户名只能包含字母、数字、下划线和中文，长度3-20位'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, '邮箱格式错误', 'email', '请输入有效的邮箱地址'), 400);
    }

    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);

    const result = await authService.register(
      sanitizeInput(username),
      sanitizeInput(email),
      password,
      sanitizeInput(verificationCode),
      role
    );

    if (result.code === 200) {
      // 为新注册用户发送欢迎通知
      try {
        const db = new D1Database(c.env);
        await db.createNotification({
          recipient_id: result.data.user.id,
          sender_id: null, // 系统消息
          type: 'welcome',
          title: '🎉 欢迎加入工作流分享平台！',
          content: '欢迎您加入我们的平台！在这里您可以发现和分享各种实用的工作流，提高工作效率。如果您想成为创作者，可以在个人中心申请创作者权限。'
        });

// 处理佣金发放的定时任务函数
const processCommissionPayouts = async (env: Env) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 查找今天应该发放的佣金记录
    const pendingPayouts = await env.DB.prepare(`
      SELECT 
        cdr.id,
        cdr.commission_record_id,
        cdr.wh_coins_amount,
        cr.user_id
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cdr.scheduled_date = ? AND cdr.status = 'pending'
    `).bind(today).all();
    
    if (!pendingPayouts.results || pendingPayouts.results.length === 0) {
      console.log('No commission payouts to process today');
      return;
    }
    
    // 处理每个待发放的佣金
    for (const payout of pendingPayouts.results) {
      try {
        // 开始事务
        await env.DB.batch([
          // 更新佣金记录状态
          env.DB.prepare(`
            UPDATE commission_daily_records 
            SET status = 'completed', actual_date = ?, completed_at = ?
            WHERE id = ?
          `).bind(today, new Date().toISOString(), payout.id),
          
          // 更新用户余额
          env.DB.prepare(`
            UPDATE users 
            SET balance = balance + ?, total_earnings = total_earnings + ?
            WHERE id = ?
          `).bind(payout.wh_coins_amount, payout.wh_coins_amount, payout.user_id)
        ]);
        
        console.log(`Commission payout processed: ${payout.wh_coins_amount} for user ${payout.user_id}`);
      } catch (error) {
        console.error(`Failed to process commission payout for record ${payout.id}:`, error);
      }
    }
    
    console.log(`Processed ${pendingPayouts.results.length} commission payouts`);
  } catch (error) {
    console.error('Error processing commission payouts:', error);
  }
};

// 添加定时任务API端点
app.post('/api/admin/process-commission-payouts', authMiddleware, adminMiddleware, async (c) => {
  try {
    await processCommissionPayouts(c.env);
    return c.json(createSuccessResponse({ message: '佣金发放处理完成' }));
  } catch (error) {
    console.error('Process commission payouts error:', error);
    return c.json(createErrorResponse(500, '处理佣金发放失败'), 500);
  }
});

// 自动定时任务：每10秒检查一次佣金发放
let commissionPayoutInterval: number | null = null;

const startCommissionPayoutScheduler = (env: Env) => {
  if (commissionPayoutInterval) {
    clearInterval(commissionPayoutInterval);
  }
  
  commissionPayoutInterval = setInterval(async () => {
    try {
      await processCommissionPayouts(env);
    } catch (error) {
      console.error('Scheduled commission payout error:', error);
    }
  }, 10000); // 每10秒执行一次
  
  console.log('Commission payout scheduler started (every 10 seconds)');
};

const stopCommissionPayoutScheduler = () => {
  if (commissionPayoutInterval) {
    clearInterval(commissionPayoutInterval);
    commissionPayoutInterval = null;
    console.log('Commission payout scheduler stopped');
  }
};

// 启动/停止定时任务的API端点
app.post('/api/admin/start-commission-scheduler', authMiddleware, adminMiddleware, async (c) => {
  try {
    startCommissionPayoutScheduler(c.env);
    return c.json(createSuccessResponse({ message: '佣金发放定时任务已启动' }));
  } catch (error) {
    console.error('Start commission scheduler error:', error);
    return c.json(createErrorResponse(500, '启动定时任务失败'), 500);
  }
});

app.post('/api/admin/stop-commission-scheduler', authMiddleware, adminMiddleware, async (c) => {
  try {
    stopCommissionPayoutScheduler();
    return c.json(createSuccessResponse({ message: '佣金发放定时任务已停止' }));
  } catch (error) {
    console.error('Stop commission scheduler error:', error);
    return c.json(createErrorResponse(500, '停止定时任务失败'), 500);
  }
});
      } catch (notificationError) {
        console.error('Failed to send welcome notification:', notificationError);
        // 不影响注册流程，只记录错误
      }

      return c.json(createSuccessResponse(result.data, result.message));
    } else {
      return c.json(result, result.code as any);
    }
  } catch (error) {
    return c.json(createErrorResponse(500, '注册失败', 'server', '服务器内部错误'), 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json(createErrorResponse(400, '缺少必要参数', 'form', '邮箱和密码不能为空'), 400);
    }

    if (!validateEmail(email)) {
      return c.json(createErrorResponse(400, '邮箱格式错误', 'email', '请输入有效的邮箱地址'), 400);
    }

    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);

    const result = await authService.login(sanitizeInput(email), password);
    return c.json(result, result.code as any);
  } catch (error) {
    return c.json(createErrorResponse(500, '登录失败', 'server', '服务器内部错误'), 500);
  }
});

// OAuth注册/登录路由
app.post('/api/auth/oauth/:provider', async (c) => {
  try {
    const provider = c.req.param('provider') as 'github' | 'google' | 'wechat';
    const body = await c.req.json();
    const { code, role = 'user', redirectUri } = body;

    if (!['github', 'google', 'wechat'].includes(provider)) {
      return c.json(createErrorResponse(400, '不支持的OAuth提供商'), 400);
    }

    if (!code) {
      return c.json(createErrorResponse(400, '缺少授权码', 'code', '请提供OAuth授权码'), 400);
    }

    const db = new D1Database(c.env);
    const authService = new AuthService(c.env, db);

    const result = await authService.oauthRegister(provider, code, role, redirectUri);
    return c.json(result, result.code as any);
  } catch (error) {
    console.error('OAuth route error:', error);
    return c.json(createErrorResponse(500, 'OAuth认证失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取OAuth授权URL
app.get('/api/auth/oauth/:provider/url', async (c) => {
  try {
    const provider = c.req.param('provider') as 'github' | 'google' | 'wechat';
    const redirectUri = c.req.query('redirect_uri') || `https://www.chaofengq.com/auth/${provider}/callback`;

    let authUrl = '';

    if (provider === 'github') {
      const params = new URLSearchParams({
        client_id: c.env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'user:email',
        state: Math.random().toString(36).substring(7), // 简单的state参数
      });
      authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    } else if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: c.env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: Math.random().toString(36).substring(7),
      });
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    } else if (provider === 'wechat') {
      const appid = (c.env as any).WECHAT_APP_ID || 'wx44142d3284d7a350';
      const state = Math.random().toString(36).substring(7);
      
      // 使用网站应用授权登录（二维码扫码）
      const params = new URLSearchParams({
        appid: appid,
        redirect_uri: encodeURIComponent(redirectUri),
        response_type: 'code',
        scope: 'snsapi_login',
        state: state
      });
      authUrl = `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
    } else {
      return c.json(createErrorResponse(400, '不支持的OAuth提供商'), 400);
    }

    return c.json(createSuccessResponse({ authUrl }));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取授权URL失败', 'server', '服务器内部错误'), 500);
  }
});

// 用户相关路由
app.get('/api/user/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json(createSuccessResponse(user));
});

// 获取用户会员信息
app.get('/api/user/membership', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse(401, '用户未认证'), 401);
    }
    
    // 获取用户最新的会员信息
    const userInfo = await c.env.DB.prepare(`
      SELECT membership_type, membership_start_date, membership_end_date, membership_auto_renew, wh_coins
      FROM users WHERE id = ?
    `).bind(user.id).first();
    
    if (!userInfo) {
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }
    
    const membershipInfo = {
      membership_type: (userInfo as any).membership_type || 'free',
      membership_start_date: (userInfo as any).membership_start_date,
      membership_end_date: (userInfo as any).membership_end_date,
      membership_auto_renew: Boolean((userInfo as any).membership_auto_renew),
      wh_coins: parseInt((userInfo as any).wh_coins || '0'),
      is_active: false
    };
    
    // 检查会员是否有效
    if (membershipInfo.membership_end_date) {
      const endDate = new Date(membershipInfo.membership_end_date);
      const now = new Date();
      membershipInfo.is_active = endDate > now;
    }
    
    return c.json(createSuccessResponse(membershipInfo));
  } catch (error) {
    console.error('获取用户会员信息失败:', error);
    return c.json(createErrorResponse(500, '获取会员信息失败', 'server', '服务器内部错误'), 500);
  }
});

app.put('/api/user/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { username, avatar_url, avatar_filename } = body;

    const db = new D1Database(c.env);
    const updates: any = {};

    if (username && username !== user.username) {
      if (!validateUsername(username)) {
        return c.json(createErrorResponse(400, '用户名格式错误', 'username', '用户名只能包含字母、数字、下划线和中文，长度3-20位'), 400);
      }

      const existingUser = await db.getUserByUsername(username);
      if (existingUser && existingUser.id !== user.id) {
        return c.json(createErrorResponse(400, '用户名已存在', 'username', '该用户名已被使用'), 400);
      }

      updates.username = sanitizeInput(username);
    }

    // 处理头像更新
    if (avatar_url) {
      updates.avatar_url = sanitizeInput(avatar_url);

      // 如果提供了头像文件名，将预览状态的文件转为正式状态
      if (avatar_filename) {
        await c.env.DB.prepare(`
          UPDATE files 
          SET status = 'active', upload_type = 'avatar'
          WHERE user_id = ? AND filename = ? AND status = 'preview'
        `).bind(user.id, avatar_filename).run();

        // 删除该用户之前的头像文件记录（保持数据库整洁）
        await c.env.DB.prepare(`
          UPDATE files 
          SET status = 'deleted'
          WHERE user_id = ? AND upload_type = 'avatar' AND status = 'active' AND filename != ?
        `).bind(user.id, avatar_filename).run();
      }
    }

    const updatedUser = await db.updateUser(user.id, updates);
    return c.json(createSuccessResponse(updatedUser, '个人信息更新成功'));
  } catch (error) {
    return c.json(createErrorResponse(500, '更新失败', 'server', '服务器内部错误'), 500);
  }
});

// 分类相关路由
app.get('/api/categories', async (c) => {
  try {
    const db = new D1Database(c.env);
    const categories = await db.getCategories();
    return c.json(createSuccessResponse(categories));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取分类失败', 'server', '服务器内部错误'), 500);
  }
});

app.get('/api/categories/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的分类ID'), 400);
    }

    const db = new D1Database(c.env);
    const category = await db.getCategoryById(id);

    if (!category) {
      return c.json(createErrorResponse(404, '分类不存在'), 404);
    }

    return c.json(createSuccessResponse(category));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取分类失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取标签列表
app.get('/api/tags', async (c) => {
  try {
    const query = c.req.query();
    const categoryId = query.category_id ? parseInt(query.category_id) : undefined;
    const region = query.region || 'global';

    const db = new D1Database(c.env);
    const tags = await db.getTagsByRegion(region as 'global' | 'china' | 'usa', categoryId);
    return c.json(createSuccessResponse(tags));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取标签失败', 'server', '服务器内部错误'), 500);
  }
});

// 创作者为任务提交工作流
app.post('/api/creator/coze-workflows/task-submission', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { taskId, title, description, category, tags = [], price = 0, download_price = 0, type, isMemberFree = false, isDownloadMemberFree = false, fileUrl, fileName, fileSize, coverImageUrl, previewImages = [], previewVideoUrl, quickCommands = [], cozeApi } = body;

    // 输入验证
    if (!taskId || !title || !category || !fileUrl) {
      return c.json(createErrorResponse(400, '缺少必要参数', 'form', '任务ID、标题、分类和文件URL不能为空'), 400);
    }

    if (price < 0) {
      return c.json(createErrorResponse(400, '价格不能为负数', 'price', '请输入有效的价格'), 400);
    }

    // 验证任务是否存在且用户有权限提交
    const task = await c.env.DB.prepare(`
      SELECT id, title, status FROM tasks WHERE id = ?
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在'), 404);
    }

    // 检查用户是否已经为此任务提交过工作流
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows WHERE task_id = ? AND creator_id = ?
    `).bind(taskId, user.id).first();

    // 处理分类ID
    const category_id = parseInt(category) || 1;

    const now = new Date().toISOString();
    let result;

    if (existingSubmission) {
      // 如果已存在，执行更新操作
      result = await c.env.DB.prepare(`
        UPDATE coze_workflows SET
          title = ?, description = ?, category_id = ?, price = ?, download_price = ?,
          type = ?, is_member_free = ?, is_download_member_free = ?, tags = ?, workflow_file_url = ?, 
          workflow_file_name = ?, workflow_file_size = ?, cover_image_url = ?,
          preview_video_url = ?, preview_images = ?, quick_commands = ?, 
          coze_api = ?, status = 'pending', updated_at = ?
        WHERE task_id = ? AND creator_id = ?
      `).bind(
        sanitizeInput(title),
        description ? sanitizeInput(description) : '',
        category_id,
        parseFloat(price.toString()),
        parseFloat(download_price.toString()),
        type ? sanitizeInput(type) : 'coze',
        Boolean(isMemberFree),
        Boolean(isDownloadMemberFree),
        JSON.stringify(tags.map((tag: string) => sanitizeInput(tag))),
        sanitizeInput(fileUrl),
        fileName ? sanitizeInput(fileName) : null,
        fileSize ? parseInt(fileSize.toString()) : null,
        coverImageUrl ? sanitizeInput(coverImageUrl) : null,
        previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
        previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img: string) => sanitizeInput(img))) : JSON.stringify([]),
        JSON.stringify(quickCommands.map((cmd: string) => sanitizeInput(cmd))),
        cozeApi ? sanitizeInput(cozeApi) : null,
        now,
        taskId,
        user.id
      ).run();
    } else {
      // 如果不存在，执行插入操作
      result = await c.env.DB.prepare(`
        INSERT INTO coze_workflows (
          creator_id, task_id, title, description, category_id, price, download_price,
          type, is_member_free, is_download_member_free, tags, workflow_file_url, workflow_file_name, workflow_file_size,
          cover_image_url, preview_video_url, preview_images, quick_commands, coze_api,
          status, is_featured, is_official, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?, ?, ?)
      `).bind(
        user.id,
        taskId,
        sanitizeInput(title),
        description ? sanitizeInput(description) : '',
        category_id,
        parseFloat(price.toString()),
        parseFloat(download_price.toString()),
        type ? sanitizeInput(type) : 'coze',
        Boolean(isMemberFree),
        Boolean(isDownloadMemberFree),
        JSON.stringify(tags.map((tag: string) => sanitizeInput(tag))),
        sanitizeInput(fileUrl),
        fileName ? sanitizeInput(fileName) : null,
        fileSize ? parseInt(fileSize.toString()) : null,
        coverImageUrl ? sanitizeInput(coverImageUrl) : null,
        previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
        previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img: string) => sanitizeInput(img))) : JSON.stringify([]),
        JSON.stringify(quickCommands.map((cmd: string) => sanitizeInput(cmd))),
        cozeApi ? sanitizeInput(cozeApi) : null,
        user.role === 'admin' || user.role === 'super_admin',
        now,
        now
      ).run();
    }

    if (!result.success) {
      return c.json(createErrorResponse(500, '提交工作流失败'), 500);
    }

    return c.json(createSuccessResponse({
      id: existingSubmission ? existingSubmission.id : result.meta?.last_row_id,
      message: existingSubmission ? '工作流更新成功，等待审核' : '工作流提交成功，等待审核'
    }), existingSubmission ? 200 : 201);
  } catch (error) {
    console.error('Submit workflow for task error:', error);
    return c.json(createErrorResponse(500, '提交工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// 创作者直接上传工作流接口（不关联任务）
app.post('/api/creator/coze-workflows', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { title, description, category, tags = [], price = 0, download_price = 0, type = 'coze', isMemberFree = false, isDownloadMemberFree = false, fileUrl, fileName, fileSize, coverImageUrl, previewImages = [], previewVideoUrl, quickCommands = [], cozeApi } = body;

    // 输入验证
    if (!title || !category || !fileUrl) {
      return c.json(createErrorResponse(400, '缺少必要参数', 'form', '标题、分类和文件URL不能为空'), 400);
    }

    if (price < 0 || download_price < 0) {
      return c.json(createErrorResponse(400, '价格不能为负数', 'price', '请输入有效的价格'), 400);
    }

    // 处理分类ID
    const category_id = parseInt(category) || 1;

    const now = new Date().toISOString();

    // 插入新的工作流记录（task_id为null）
    const result = await c.env.DB.prepare(`
      INSERT INTO coze_workflows (
        creator_id, task_id, title, description, category_id, price, download_price,
        type, is_member_free, is_download_member_free, tags, workflow_file_url, workflow_file_name, workflow_file_size,
        cover_image_url, preview_video_url, preview_images, quick_commands, coze_api,
        status, is_featured, is_official, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', false, ?, ?, ?)
    `).bind(
      user.id,
      null, // task_id为null，表示直接上传的工作流
      sanitizeInput(title),
      description ? sanitizeInput(description) : '',
      category_id,
      parseFloat(price.toString()),
      parseFloat(download_price.toString()),
      type ? sanitizeInput(type) : 'coze',
      Boolean(isMemberFree),
      Boolean(isDownloadMemberFree),
      JSON.stringify(tags.map((tag: string) => sanitizeInput(tag))),
      sanitizeInput(fileUrl),
      fileName ? sanitizeInput(fileName) : null,
      fileSize ? parseInt(fileSize.toString()) : null,
      coverImageUrl ? sanitizeInput(coverImageUrl) : null,
      previewVideoUrl ? sanitizeInput(previewVideoUrl) : null,
      previewImages && previewImages.length > 0 ? JSON.stringify(previewImages.map((img: string) => sanitizeInput(img))) : JSON.stringify([]),
      JSON.stringify(quickCommands.map((cmd: string) => sanitizeInput(cmd))),
      cozeApi ? sanitizeInput(cozeApi) : null,
      user.role === 'admin' || user.role === 'super_admin',
      now,
      now
    ).run();

    if (!result.success) {
      return c.json(createErrorResponse(500, '上传工作流失败'), 500);
    }

    return c.json(createSuccessResponse({
      id: result.meta?.last_row_id,
      message: '工作流上传成功，等待审核'
    }), 201);
  } catch (error) {
    console.error('Upload workflow error:', error);
    return c.json(createErrorResponse(500, '上传工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// 创作者中心路由
app.get('/api/creator/coze-workflows', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      creatorId: user.id,
      status: query.status
    };

    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('获取创作者Coze工作流失败:', error);
    return c.json(createErrorResponse(500, '获取创作者Coze工作流失败', 'server', '服务器内部错误'), 500);
  }
});



app.get('/api/creator/stats', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = new D1Database(c.env);

    // 获取创作者的工作流
    const workflows = await db.getCozeWorkflows({ creatorId: user.id, pageSize: 1000 });

    // 计算工作流统计
    const workflowStats = {
      count: workflows.items.length,
      downloads: workflows.items.reduce((sum: number, w: any) => sum + w.download_count, 0),
      totalRating: workflows.items.reduce((sum: number, w: any) => sum + w.rating, 0)
    };

    // 统计数据
    const totalWorks = workflowStats.count;
    const totalDownloads = workflowStats.downloads;
    const totalRatingSum = workflowStats.totalRating;
    const averageRating = totalWorks > 0 ? totalRatingSum / totalWorks : 0;

    // 本月收益暂时设为0，因为佣金相关表已被删除
    const monthlyEarnings = 0;
    console.log('Monthly earnings set to 0 (commission tables removed)');

    const stats = {
      totalEarnings: user.total_earnings,
      monthlyEarnings: monthlyEarnings, // 基于实际的本月佣金发放记录
      workflowCount: totalWorks, // 工作流总数
      totalDownloads: totalDownloads, // 工作流下载量
      averageRating: averageRating
    };

  return c.json(createSuccessResponse(stats));
} catch (error) {
  return c.json(createErrorResponse(500, '获取创作者统计失败', 'server', '服务器内部错误'), 500);
}
});



// 管理员路由
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getDashboardStats();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取仪表盘数据失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员仪表盘统计数据接口
app.get('/api/admin/dashboard/stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getDashboardStats();
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取仪表盘统计数据失败', 'server', '服务器内部错误'), 500);
  }
});

// 用户管理路由
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      search: query.search,
      role: query.role,
      status: query.status
    };

    const db = new D1Database(c.env);
    const result = await db.getUsers(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取用户列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取包含统计数据的用户列表（用于佣金管理页面）
app.get('/api/admin/users-with-stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      search: query.search,
      role: query.role,
      status: query.status
    };

    const db = new D1Database(c.env);
    const result = await db.getUsersWithStats(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取用户统计数据失败', 'server', '服务器内部错误'), 500);
  }
});

app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    const db = new D1Database(c.env);
    const user = await db.getUserById(id);

    if (!user) {
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }

    return c.json(createSuccessResponse(user));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取用户详情失败', 'server', '服务器内部错误'), 500);
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    const body = await c.req.json();
    const { username, email, role, status, phone, realName, balance, total_earnings, wh_coins, membership_type, membership_start_date, membership_end_date, membership_auto_renew, avatar_url, oauth_provider, oauth_id, wechat_openid } = body;

    // 输入验证
    if (username && !validateUsername(username)) {
      return c.json(createErrorResponse(400, '用户名格式错误', 'username', '用户名只能包含字母、数字、下划线和中文，长度3-20位'), 400);
    }

    if (email && !validateEmail(email)) {
      return c.json(createErrorResponse(400, '邮箱格式错误', 'email', '请输入有效的邮箱地址'), 400);
    }

    if (role && !['user', 'creator', 'admin', 'advertiser', 'super_admin'].includes(role)) {
      return c.json(createErrorResponse(400, '无效的角色'), 400);
    }

    if (status && !['active', 'banned', 'pending', 'suspended', 'deleted'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的状态'), 400);
    }

    const db = new D1Database(c.env);

    // 检查用户是否存在
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }

    // 获取当前操作用户
    const currentUser = c.get('user');

    // 权限检查：只有超级管理员可以任命管理员和超级管理员
    if (role && (role === 'admin' || role === 'super_admin')) {
      if (currentUser.role !== 'super_admin') {
        return c.json(createErrorResponse(403, '只有超级管理员可以任命管理员'), 403);
      }
    }

    // 防止修改其他管理员或超级管理员的信息（除非是超级管理员操作）
    if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
      if (currentUser.role !== 'super_admin' || (existingUser.role === 'super_admin' && currentUser.id !== existingUser.id)) {
        return c.json(createErrorResponse(403, '权限不足，无法修改此用户信息'), 403);
      }
    }

    // 如果角色发生变更，使用专门的角色更新方法
    if (role && role !== existingUser.role) {
      await db.updateUserRole(id, role);
    }

    // 构建其他更新数据（排除角色）
    const updateData: any = {};
    if (username) updateData.username = sanitizeInput(username);
    if (email) updateData.email = sanitizeInput(email);
    if (status) updateData.status = status;
    if (phone !== undefined) updateData.phone = phone ? sanitizeInput(phone) : null;
    if (realName !== undefined) updateData.real_name = realName ? sanitizeInput(realName) : null;
    
    // 财务字段
    if (balance !== undefined) updateData.balance = Number(balance) || 0;
    if (total_earnings !== undefined) updateData.total_earnings = Number(total_earnings) || 0;
    if (wh_coins !== undefined) updateData.wh_coins = Number(wh_coins) || 0;
    
    // 会员字段
    if (membership_type) updateData.membership_type = membership_type;
    if (membership_start_date !== undefined) updateData.membership_start_date = membership_start_date;
    if (membership_end_date !== undefined) updateData.membership_end_date = membership_end_date;
    if (membership_auto_renew !== undefined) updateData.membership_auto_renew = Number(membership_auto_renew) || 0;
    
    // 其他字段
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (oauth_provider !== undefined) updateData.oauth_provider = oauth_provider;
    if (oauth_id !== undefined) updateData.oauth_id = oauth_id;
    if (wechat_openid !== undefined) updateData.wechat_openid = wechat_openid;

    // 如果有其他字段需要更新
    if (Object.keys(updateData).length > 0) {
      await db.updateUser(id, updateData);
    }

    // 获取最终更新后的用户信息
    const updatedUser = await db.getUserById(id);
    return c.json(createSuccessResponse(updatedUser, '用户信息更新成功'));
  } catch (error) {
    return c.json(createErrorResponse(500, '更新用户信息失败', 'server', '服务器内部错误'), 500);
  }
});

app.put('/api/admin/users/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      console.error('Invalid user ID provided:', c.req.param('id'));
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    const body = await c.req.json();
    const { status } = body;

    console.log(`Attempting to update user ${id} status to ${status}`);

    if (!['active', 'banned', 'pending', 'suspended', 'deleted'].includes(status)) {
      console.error('Invalid status value:', status);
      return c.json(createErrorResponse(400, '无效的状态值'), 400);
    }

    const db = new D1Database(c.env);

    // 检查用户是否存在
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      console.error('User not found:', id);
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }

    console.log('Current user status:', existingUser.status);

    // 获取当前操作用户
    const currentUser = c.get('user');

    // 权限检查：防止修改管理员或超级管理员的状态（除非是超级管理员操作）
    if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
      if (currentUser.role !== 'super_admin') {
        console.error('Insufficient permissions to modify admin/super_admin status');
        return c.json(createErrorResponse(403, '权限不足，无法修改管理员状态'), 403);
      }
    }

    const user = await db.updateUserStatus(id, status);

    if (!user) {
      console.error('Failed to update user status - user not found after update');
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }

    console.log('User status updated successfully:', user);
    return c.json(createSuccessResponse(user, '用户状态更新成功'));
  } catch (error) {
    console.error('Error in updateUserStatus endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return c.json(createErrorResponse(500, '更新用户状态失败', 'server', `服务器内部错误: ${errorMessage}`), 500);
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    const db = new D1Database(c.env);

    // 检查用户是否存在
    const existingUser = await db.getUserById(id);
    if (!existingUser) {
      return c.json(createErrorResponse(404, '用户不存在'), 404);
    }

    // 获取当前操作用户
    const currentUser = c.get('user');

    // 防止删除管理员和超级管理员账户
    if (existingUser.role === 'admin' || existingUser.role === 'super_admin') {
      // 只有超级管理员可以删除管理员，但不能删除超级管理员
      if (currentUser.role !== 'super_admin' || existingUser.role === 'super_admin') {
        return c.json(createErrorResponse(403, '不能删除管理员或超级管理员账户'), 403);
      }
    }

    const success = await db.deleteUser(id);
    if (!success) {
      return c.json(createErrorResponse(500, '删除用户失败'), 500);
    }

    return c.json(createSuccessResponse(null, '用户删除成功'));
  } catch (error) {
    return c.json(createErrorResponse(500, '删除用户失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员获取coze工作流列表
app.get('/api/admin/coze-workflows', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      status: query.status,
      search: query.search,
      category: query.category ? parseInt(query.category) : undefined,
      sortBy: query.sortBy,
      startDate: query.startDate,
      endDate: query.endDate
    };

    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get coze workflows error:', error);
    return c.json(createErrorResponse(500, '获取Coze工作流列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员创建coze工作流
app.post('/api/admin/coze-workflows', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const currentUser = c.get('user');
    
    const workflowData = {
      ...body,
      creator_id: body.creator_id || currentUser.id,
      status: 'pending'
    };

    const db = new D1Database(c.env);
    const workflow = await db.createCozeWorkflow(workflowData);
    
    return c.json(createSuccessResponse(workflow, 'Coze工作流创建成功'), 201);
  } catch (error) {
    console.error('Create coze workflow error:', error);
    return c.json(createErrorResponse(500, '创建Coze工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员更新coze工作流
app.put('/api/admin/coze-workflows/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的工作流ID'), 400);
    }

    const body = await c.req.json();
    const currentUser = c.get('user');
    const db = new D1Database(c.env);
    
    const workflow = await db.updateCozeWorkflow(id, body);
    if (!workflow) {
      return c.json(createErrorResponse(404, '工作流不存在'), 404);
    }

    // 记录管理员操作日志
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: 'update_coze_workflow',
        target_type: 'coze_workflow',
        target_id: id,
        details: `更新Coze工作流: ${workflow.title}`
      });
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
    }

    return c.json(createSuccessResponse(workflow, 'Coze工作流更新成功'));
  } catch (error) {
    console.error('Update coze workflow error:', error);
    return c.json(createErrorResponse(500, '更新Coze工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员更新coze工作流状态
app.put('/api/admin/coze-workflows/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的工作流ID'), 400);
    }

    const body = await c.req.json();
    const { status, reason } = body;

    if (!['pending', 'approved', 'rejected', 'offline'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的状态值'), 400);
    }

    const currentUser = c.get('user');
    const db = new D1Database(c.env);
    const workflow = await db.updateCozeWorkflowStatus(id, status, reason);

    if (!workflow) {
      return c.json(createErrorResponse(404, '工作流不存在'), 404);
    }

    // 记录管理员操作日志
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: 'update_coze_workflow_status',
        target_type: 'coze_workflow',
        target_id: id,
        details: `更新Coze工作流状态: ${workflow.title} -> ${status}${reason ? ` (${reason})` : ''}`
      });
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
    }

    return c.json(createSuccessResponse(workflow, 'Coze工作流状态更新成功'));
  } catch (error) {
    console.error('Update coze workflow status error:', error);
    return c.json(createErrorResponse(500, '更新Coze工作流状态失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员删除coze工作流
app.delete('/api/admin/coze-workflows/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的工作流ID'), 400);
    }

    const db = new D1Database(c.env);

    // 检查工作流是否存在
    const existingWorkflow = await db.getCozeWorkflowById(id);
    if (!existingWorkflow) {
      return c.json(createErrorResponse(404, '工作流不存在'), 404);
    }

    // 获取当前操作用户
    const currentUser = c.get('user');

    // 删除工作流
    console.log(`开始删除Coze工作流 ${id}: ${existingWorkflow.title}`);
    try {
      const success = await db.deleteCozeWorkflow(id);
      if (!success) {
        console.error(`Failed to delete coze workflow ${id}: deleteCozeWorkflow returned false`);
        console.error(`工作流信息:`, {
          id: existingWorkflow.id,
          title: existingWorkflow.title,
          creator_id: existingWorkflow.creator_id,
          status: existingWorkflow.status
        });
        return c.json(createErrorResponse(500, '删除工作流失败：数据库操作返回失败'), 500);
      }
      console.log(`Coze工作流 ${id} 删除成功`);
    } catch (deleteError) {
      console.error('Delete coze workflow database error:', deleteError);
      console.error('删除错误详情:', {
        workflowId: id,
        workflowTitle: existingWorkflow.title,
        errorType: deleteError instanceof Error ? deleteError.constructor.name : typeof deleteError,
        errorMessage: deleteError instanceof Error ? deleteError.message : String(deleteError),
        errorStack: deleteError instanceof Error ? deleteError.stack : undefined
      });
      
      // 检查工作流是否实际已被删除
      try {
        const checkWorkflow = await db.getCozeWorkflowById(id);
        if (!checkWorkflow) {
          // 工作流已被删除，尽管有错误，仍然认为操作成功
          console.log(`Coze workflow ${id} was successfully deleted despite error`);
        } else {
          // 工作流仍然存在，删除确实失败了
          const errorMessage = deleteError instanceof Error ? deleteError.message : '删除工作流失败';
          console.error(`工作流 ${id} 删除失败，工作流仍然存在于数据库中`);
          return c.json(createErrorResponse(500, `删除工作流失败：${errorMessage}`), 500);
        }
      } catch (checkError) {
        console.error('Error checking workflow after delete:', checkError);
        console.error('检查工作流是否存在时发生错误:', {
          checkErrorType: checkError instanceof Error ? checkError.constructor.name : typeof checkError,
          checkErrorMessage: checkError instanceof Error ? checkError.message : String(checkError)
        });
        return c.json(createErrorResponse(500, '删除工作流失败：无法验证删除结果'), 500);
      }
    }

    // 记录管理员操作日志
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: 'delete_coze_workflow',
        target_type: 'coze_workflow',
        target_id: id,
        details: `删除Coze工作流: ${existingWorkflow.title}`
      });
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
      // 日志记录失败不影响删除操作的成功
    }

    return c.json(createSuccessResponse(null, 'Coze工作流删除成功'));
  } catch (error) {
    console.error('Delete coze workflow error:', error);
    const errorMessage = error instanceof Error ? error.message : '删除Coze工作流失败';
    return c.json(createErrorResponse(500, errorMessage, 'server', '服务器内部错误'), 500);
  }
});

// 管理员删除工作流（旧版本，保留兼容性）
app.delete('/api/admin/coze-workflows-legacy/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的工作流ID'), 400);
    }

    const db = new D1Database(c.env);

    // 检查工作流是否存在
    const existingWorkflow = await db.getCozeWorkflowById(id);
    if (!existingWorkflow) {
      return c.json(createErrorResponse(404, '工作流不存在'), 404);
    }

    // 获取当前操作用户
    const currentUser = c.get('user');

    // 删除工作流
    const success = await db.deleteCozeWorkflow(id);
    if (!success) {
      return c.json(createErrorResponse(500, '删除工作流失败'), 500);
    }

    // 记录管理员操作日志 - 添加错误处理
    try {
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: 'delete_workflow',
        target_type: 'workflow',
        target_id: id,
        details: `删除工作流: ${existingWorkflow.title}`
      });
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
      // 不因为日志记录失败而影响删除操作的成功响应
    }

    return c.json(createSuccessResponse(null, '工作流删除成功'));
  } catch (error) {
    console.error('Delete workflow error:', error);
    return c.json(createErrorResponse(500, '删除工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员获取创作者申请列表
app.get('/api/admin/creator-applications', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      status: query.status
    };

    const db = new D1Database(c.env);
    const result = await db.getCreatorApplications(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取创作者申请列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员审核创作者申请
app.put('/api/admin/creator-applications/:id/review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { status, admin_comment } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }

    const currentUser = c.get('user');
    const db = new D1Database(c.env);
    const application = await db.reviewCreatorApplication(id, {
      status,
      admin_comment,
      reviewed_by: currentUser.id
    });

    if (!application) {
      return c.json(createErrorResponse(404, '创作者申请不存在'), 404);
    }

    return c.json(createSuccessResponse(application, '审核完成'));
  } catch (error) {
    return c.json(createErrorResponse(500, '审核创作者申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 通用文件上传路由
app.post('/api/upload', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string || 'document';

    if (!file) {
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 根据上传类型验证文件
    if (uploadType === 'avatar') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return c.json(createErrorResponse(400, '头像仅支持 JPEG、PNG、GIF、WebP 格式'), 400);
      }
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return c.json(createErrorResponse(400, '头像文件大小不能超过 2MB'), 400);
      }
    } else {
      // 其他文件类型限制更宽松
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return c.json(createErrorResponse(400, '文件大小不能超过 50MB'), 400);
      }
    }

    // 获取当前用户
    const user = c.get('user');

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${uploadType}s/${uploadType}_${timestamp}_${randomStr}.${fileExtension}`;

    // 将文件上传到 R2 存储桶
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 生成文件访问URL
    const fileUrl = `/api/files/${fileName}`;

    // 将文件信息存储到D1数据库
    const result = await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      uploadType
    ).run();

    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      url: fileUrl,
      filename: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    }, '文件上传成功'));
  } catch (error) {
    console.error('Upload error:', error);
    return c.json(createErrorResponse(500, '文件上传失败', 'server', '服务器内部错误'), 500);
  }
});

// 专门的头像上传预览路由（不保存到用户表）
app.post('/api/upload/avatar-preview', authMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json(createErrorResponse(400, '头像仅支持 JPEG、PNG、GIF、WebP 格式'), 400);
    }

    // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, '头像文件大小不能超过 2MB'), 400);
    }

    // 获取当前用户
    const user = c.get('user');

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `avatars/avatar_preview_${timestamp}_${randomStr}.${fileExtension}`;

    // 将文件上传到 R2 存储桶
    const fileBuffer = await file.arrayBuffer();

    // 检查R2_BUCKET是否存在
    if (!c.env.R2_BUCKET) {
      console.error('R2_BUCKET binding not found');
      return c.json(createErrorResponse(500, 'R2存储桶未配置', 'server', 'R2存储桶绑定未找到'), 500);
    }

    console.log('Uploading file to R2:', fileName);
    const uploadResult = await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    if (!uploadResult) {
      console.error('Failed to upload file to R2:', fileName);
      return c.json(createErrorResponse(500, '文件上传到R2失败', 'server', 'R2上传失败'), 500);
    }

    console.log('File uploaded to R2 successfully:', fileName);

    // 生成文件访问URL
    const previewUrl = `/api/files/${fileName}`;

    // 临时存储文件信息（用于预览）
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'preview')
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      previewUrl,
      'avatar'
    ).run();

    console.log('File record saved to database:', fileName);

    return c.json(createSuccessResponse({
      url: previewUrl,
      filename: fileName
    }, '头像预览上传成功'));
  } catch (error) {
    console.error('Avatar preview upload error:', error);
    return c.json(createErrorResponse(500, '头像预览上传失败', 'server', '服务器内部错误'), 500);
  }
});

// 授权验证函数
function authorizeFileRequest(filePath: string, user?: any): boolean {
  // 管理员和超级管理员可以访问所有文件（用于审核）
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return true;
  }

  // 公开文件类型允许列表（如头像、封面图、预览视频、预览图片等）
  const publicFileTypes = ['avatars/', 'covers/', 'videos/', 'images/'];

  // 检查是否为公开文件类型
  for (const publicType of publicFileTypes) {
    if (filePath.startsWith(publicType)) {
      return true;
    }
  }

  // 敏感文件类型需要额外验证
  const sensitiveFileTypes = ['documents/', 'workflows/', 'private/'];
  for (const sensitiveType of sensitiveFileTypes) {
    if (filePath.startsWith(sensitiveType)) {
      // 敏感文件需要用户登录且文件属于该用户
      return !!user;
    }
  }

  // 其他文件需要用户登录
  return !!user;
}

// 文件访问路由（添加授权验证）
app.get('/api/files/*', async (c) => {
  try {
    // 从URL路径中提取文件路径
    const fullUrl = c.req.url;
    const pathname = new URL(fullUrl).pathname;
    const filePath = pathname.replace('/api/files/', '');

    console.log('=== FILE ACCESS DEBUG ===');
    console.log('Full URL:', fullUrl);
    console.log('Pathname:', pathname);
    console.log('File path extracted:', filePath);
    console.log('Request method:', c.req.method);
    console.log('========================');

    if (!filePath || filePath === '') {
      console.log('ERROR: No file path provided');
      return c.json(createErrorResponse(404, '文件不存在'), 404);
    }

    // 尝试获取用户信息（不强制要求认证）
    let user = null;
    try {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const db = new D1Database(c.env);
        const authService = new AuthService(c.env, db);
        const payload = await authService.verifyToken(token);
        if (payload) {
          user = await db.getUserById(payload.userId);
          console.log('User authenticated:', { id: user?.id, username: user?.username, role: user?.role });
        }
      }
    } catch (error) {
      console.log('Auth check failed, continuing as anonymous user:', error);
    }

    console.log('Authorization check - filePath:', filePath, 'user:', user ? { id: user.id, role: user.role } : 'null');
    
    // 授权验证
    const isAuthorized = authorizeFileRequest(filePath, user);
    console.log('Authorization result:', isAuthorized);
    
    if (!isAuthorized) {
      console.log('Access denied for file:', filePath, 'user:', user ? { id: user.id, role: user.role } : 'null');
      return c.json(createErrorResponse(403, '无权限访问此文件'), 403);
    }

    // 对于需要所有权验证的文件，检查文件是否属于当前用户（管理员和超级管理员除外）
    const sensitiveFileTypes = ['documents/', 'workflows/', 'private/'];
    const needsOwnershipCheck = sensitiveFileTypes.some(type => filePath.startsWith(type));

    if (needsOwnershipCheck && user && user.role !== 'admin' && user.role !== 'super_admin') {
      try {
        const db = new D1Database(c.env);
        const fileRecord = await db.getFileByPath(filePath);
        if (fileRecord && fileRecord.user_id !== user.id) {
          return c.json(createErrorResponse(403, '无权限访问此文件'), 403);
        }
      } catch (error) {
        console.log('File ownership check failed:', error);
        // 如果无法验证所有权，允许访问（向后兼容）
      }
    }

    // 检查R2_BUCKET是否存在
    if (!c.env.R2_BUCKET) {
      console.error('R2_BUCKET binding not found');
      return c.json(createErrorResponse(500, 'R2存储桶未配置', 'server', 'R2存储桶绑定未找到'), 500);
    }

    console.log('Attempting to get file from R2:', filePath);
    // 从 R2 存储桶获取文件
    const object = await c.env.R2_BUCKET.get(filePath);

    if (!object) {
      console.log('File not found in R2:', filePath);
      return c.json(createErrorResponse(404, '文件不存在'), 404);
    }

    console.log('File found, returning content');
    // 返回文件内容
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000'); // 缓存一年

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('File access error:', error);
    return c.json(createErrorResponse(500, '文件访问失败', 'server', '服务器内部错误'), 500);
  }
});

// 消息通知相关路由
// 获取用户通知列表
app.get('/api/notifications', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();

    const params = {
      recipient_id: user.id,
      is_read: query.is_read === 'true' ? true : query.is_read === 'false' ? false : undefined,
      type: query.type,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20
    };

    const db = new D1Database(c.env);
    const result = await db.getNotifications(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json(createErrorResponse(500, '获取通知失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取未读通知数量
app.get('/api/notifications/unread-count', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = new D1Database(c.env);
    const count = await db.getUnreadNotificationCount(user.id);
    return c.json(createSuccessResponse({ count }));
  } catch (error) {
    console.error('Get unread count error:', error);
    return c.json(createErrorResponse(500, '获取未读数量失败', 'server', '服务器内部错误'), 500);
  }
});

// 标记单个通知为已读
app.put('/api/notifications/:id/read', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const notificationId = parseInt(c.req.param('id'));

    // 验证通知是否属于当前用户
    const db = new D1Database(c.env);
    const notifications = await db.getNotifications({
      recipient_id: user.id,
      page: 1,
      pageSize: 1
    });

    const notification = notifications.items.find(n => n.id === notificationId);
    if (!notification) {
      return c.json(createErrorResponse(404, '通知不存在或无权限访问'), 404);
    }

    const success = await db.markNotificationAsRead(notificationId);
    if (success) {
      return c.json(createSuccessResponse({ message: '标记成功' }));
    } else {
      return c.json(createErrorResponse(500, '标记失败'), 500);
    }
  } catch (error) {
    console.error('Mark notification read error:', error);
    return c.json(createErrorResponse(500, '标记失败', 'server', '服务器内部错误'), 500);
  }
});

// 标记所有通知为已读
app.put('/api/notifications/read-all', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = new D1Database(c.env);
    const success = await db.markAllNotificationsAsRead(user.id);

    if (success) {
      return c.json(createSuccessResponse({ message: '全部标记成功' }));
    } else {
      return c.json(createErrorResponse(500, '标记失败'), 500);
    }
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return c.json(createErrorResponse(500, '标记失败', 'server', '服务器内部错误'), 500);
  }
});

// 删除通知
app.delete('/api/notifications/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const notificationId = parseInt(c.req.param('id'));

    // 验证通知是否属于当前用户
    const db = new D1Database(c.env);
    const notifications = await db.getNotifications({
      recipient_id: user.id,
      page: 1,
      pageSize: 1
    });

    const notification = notifications.items.find(n => n.id === notificationId);
    if (!notification) {
      return c.json(createErrorResponse(404, '通知不存在或无权限访问'), 404);
    }

    const success = await db.deleteNotification(notificationId);
    if (success) {
      return c.json(createSuccessResponse({ message: '删除成功' }));
    } else {
      return c.json(createErrorResponse(500, '删除失败'), 500);
    }
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json(createErrorResponse(500, '删除失败', 'server', '服务器内部错误'), 500);
  }
});

// 用户设置相关路由
// 获取用户设置
app.get('/api/user/settings', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = new D1Database(c.env);
    const settings = await db.getUserSettings(user.id);

    if (!settings) {
      // 如果没有设置记录，创建默认设置
      const defaultSettings = await db.createOrUpdateUserSettings(user.id, {
        email_notifications: true,
        push_notifications: true,
        welcome_shown: false
      });
      return c.json(createSuccessResponse(defaultSettings));
    }

    return c.json(createSuccessResponse(settings));
  } catch (error) {
    console.error('Get user settings error:', error);
    return c.json(createErrorResponse(500, '获取设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新用户设置
app.put('/api/user/settings', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const db = new D1Database(c.env);
    const settings = await db.createOrUpdateUserSettings(user.id, body);

    return c.json(createSuccessResponse(settings));
  } catch (error) {
    console.error('Update user settings error:', error);
    return c.json(createErrorResponse(500, '更新设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 用户偏好设置相关路由
// 获取用户偏好设置
app.get('/api/user/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // 获取用户的所有偏好设置
    const preferences = await c.env.DB.prepare(`
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = ?
    `).bind(user.id).all();

    // 转换为键值对对象
    const preferencesObj: Record<string, string> = {};
    preferences.results.forEach((pref: any) => {
      preferencesObj[pref.preference_key] = pref.preference_value;
    });

    // 设置默认值
    const defaultPreferences = {
      theme: 'dark',
      language: 'zh',
      notifications: 'enabled'
    };

    const finalPreferences = { ...defaultPreferences, ...preferencesObj };
    return c.json(createSuccessResponse(finalPreferences));
  } catch (error) {
    console.error('Get user preferences error:', error);
    return c.json(createErrorResponse(500, '获取偏好设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新用户偏好设置
app.put('/api/user/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // 支持的偏好设置键
    const allowedKeys = ['theme', 'language', 'notifications'];
    
    // 批量更新偏好设置
    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        await c.env.DB.prepare(`
          INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, preference_key) 
          DO UPDATE SET preference_value = ?, updated_at = datetime('now')
        `).bind(user.id, key, value, value).run();
      }
    }

    // 返回更新后的偏好设置
    const preferences = await c.env.DB.prepare(`
      SELECT preference_key, preference_value 
      FROM user_preferences 
      WHERE user_id = ?
    `).bind(user.id).all();

    const preferencesObj: Record<string, string> = {};
    preferences.results.forEach((pref: any) => {
      preferencesObj[pref.preference_key] = pref.preference_value;
    });

    return c.json(createSuccessResponse(preferencesObj));
  } catch (error) {
    console.error('Update user preferences error:', error);
    return c.json(createErrorResponse(500, '更新偏好设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取单个偏好设置
app.get('/api/user/preferences/:key', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const key = c.req.param('key');
    
    const preference = await c.env.DB.prepare(`
      SELECT preference_value 
      FROM user_preferences 
      WHERE user_id = ? AND preference_key = ?
    `).bind(user.id, key).first();

    if (!preference) {
      // 返回默认值
      const defaultValues: Record<string, string> = {
        theme: 'dark',
        language: 'zh',
        notifications: 'enabled'
      };
      return c.json(createSuccessResponse({ [key]: defaultValues[key] || null }));
    }

    return c.json(createSuccessResponse({ [key]: preference.preference_value }));
  } catch (error) {
    console.error('Get user preference error:', error);
    return c.json(createErrorResponse(500, '获取偏好设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新单个偏好设置
app.put('/api/user/preferences/:key', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const key = c.req.param('key');
    const body = await c.req.json();
    const value = body.value;
    
    if (!value) {
      return c.json(createErrorResponse(400, '偏好设置值不能为空'), 400);
    }
    
    // 支持的偏好设置键
    const allowedKeys = ['theme', 'language', 'notifications'];
    if (!allowedKeys.includes(key)) {
      return c.json(createErrorResponse(400, '不支持的偏好设置键'), 400);
    }

    await c.env.DB.prepare(`
      INSERT INTO user_preferences (user_id, preference_key, preference_value, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, preference_key) 
      DO UPDATE SET preference_value = ?, updated_at = datetime('now')
    `).bind(user.id, key, value, value).run();

    return c.json(createSuccessResponse({ [key]: value }));
  } catch (error) {
    console.error('Update user preference error:', error);
    return c.json(createErrorResponse(500, '更新偏好设置失败', 'server', '服务器内部错误'), 500);
  }
});

// 创作者申请相关路由
// 提交创作者申请
app.post('/api/creator/apply', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // 验证必填字段
    const { country, experience, reason, skills } = body;
    if (!country || !experience || !reason || !skills) {
      return c.json(createErrorResponse(400, '请填写所有必填字段'), 400);
    }

    // 检查是否已有申请
    const existingApplication = await c.env.DB.prepare(`
      SELECT id FROM creator_applications WHERE user_id = ?
    `).bind(user.id).first();

    if (existingApplication) {
      return c.json(createErrorResponse(400, '您已经提交过申请，请勿重复提交'), 400);
    }

    // 插入申请记录
    const result = await c.env.DB.prepare(`
      INSERT INTO creator_applications (user_id, country, linkedin, experience, portfolio, reason, skills, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(
      user.id,
      country,
      body.linkedin || null,
      experience,
      body.portfolio || null,
      reason,
      skills
    ).run();

    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      status: 'pending',
      message: '申请提交成功，请等待审核'
    }), 201);
  } catch (error) {
    console.error('Creator application error:', error);
    return c.json(createErrorResponse(500, '申请提交失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取用户的创作者申请状态
app.get('/api/creator/application', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE user_id = ?
    `).bind(user.id).first();

    if (!application) {
      return c.json(createSuccessResponse(null));
    }

    return c.json(createSuccessResponse(application));
  } catch (error) {
    console.error('Get application error:', error);
    return c.json(createErrorResponse(500, '获取申请状态失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新创作者申请
app.put('/api/creator/application/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const applicationId = parseInt(c.req.param('id'));
    const body = await c.req.json();

    // 验证申请是否属于当前用户
    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).first();

    if (!application) {
      return c.json(createErrorResponse(404, '申请不存在或无权限修改'), 404);
    }

    // 验证必填字段
    const { country, experience, reason, skills } = body;
    if (!country || !experience || !reason || !skills) {
      return c.json(createErrorResponse(400, '请填写所有必填字段'), 400);
    }

    // 更新申请记录，重置状态为pending
    await c.env.DB.prepare(`
      UPDATE creator_applications 
      SET country = ?, linkedin = ?, experience = ?, portfolio = ?, reason = ?, skills = ?, 
          status = 'pending', admin_comment = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(
      country,
      body.linkedin || null,
      experience,
      body.portfolio || null,
      reason,
      skills,
      applicationId,
      user.id
    ).run();

    return c.json(createSuccessResponse({ message: '申请更新成功，请等待重新审核' }));
  } catch (error) {
    console.error('Update application error:', error);
    return c.json(createErrorResponse(500, '申请更新失败', 'server', '服务器内部错误'), 500);
  }
});

// 撤回创作者申请
app.delete('/api/creator/application/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const applicationId = parseInt(c.req.param('id'));

    // 验证申请是否属于当前用户
    const application = await c.env.DB.prepare(`
      SELECT * FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).first();

    if (!application) {
      return c.json(createErrorResponse(404, '申请不存在或无权限删除'), 404);
    }

    // 删除申请记录
    await c.env.DB.prepare(`
      DELETE FROM creator_applications WHERE id = ? AND user_id = ?
    `).bind(applicationId, user.id).run();

    return c.json(createSuccessResponse({ message: '申请已撤回' }));
  } catch (error) {
    console.error('Withdraw application error:', error);
    return c.json(createErrorResponse(500, '撤回申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 创作者上传路由
// 上传工作流文件
app.post('/api/creator/upload/workflow', authMiddleware, creatorMiddleware, async (c) => {
  try {
    // 检查R2存储桶是否配置
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, '文件存储服务未配置，请联系管理员'), 500);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 验证文件类型和大小
    const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.zip')) {
      return c.json(createErrorResponse(400, '工作流文件仅支持ZIP格式'), 400);
    }

    const maxSize = 100 * 1024; // 100KB
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, '工作流文件大小不能超过100KB'), 400);
    }

    const user = c.get('user');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `workflows/workflow_${timestamp}_${randomStr}.zip`;

    // 上传到R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `/api/files/${fileName}`;

    // 保存文件记录
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      'workflow'
    ).run();

    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, '工作流文件上传成功'));
  } catch (error) {
    console.error('Workflow upload error:', error);
    return c.json(createErrorResponse(500, '工作流文件上传失败', 'server', '服务器内部错误'), 500);
  }
});

// 上传AI应用文件
app.post('/api/creator/upload/ai-app', authMiddleware, creatorMiddleware, async (c) => {
  try {
    // 检查R2存储桶是否配置
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, '文件存储服务未配置，请联系管理员'), 500);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 验证文件类型和大小
    const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.zip')) {
      return c.json(createErrorResponse(400, 'AI应用文件仅支持ZIP格式'), 400);
    }

    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, 'AI应用文件大小不能超过1GB'), 400);
    }

    const user = c.get('user');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `ai-apps/aiapp_${timestamp}_${randomStr}.zip`;

    // 上传到R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `/api/files/${fileName}`;

    // 保存文件记录
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      'document'
    ).run();

    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, 'AI应用文件上传成功'));
  } catch (error) {
    console.error('AI app upload error:', error);
    return c.json(createErrorResponse(500, 'AI应用文件上传失败', 'server', '服务器内部错误'), 500);
  }
});

// 上传封面图片
app.post('/api/creator/upload/cover', authMiddleware, creatorMiddleware, async (c) => {
  try {
    console.log('Cover upload request received');

    // 检查R2存储桶是否配置
    if (!c.env.R2_BUCKET) {
      console.error('R2_BUCKET not configured');
      return c.json(createErrorResponse(500, '文件存储服务未配置，请联系管理员'), 500);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    console.log('File info:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size
    });

    if (!file) {
      console.error('No file found in form data');
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      return c.json(createErrorResponse(400, `封面图片仅支持 JPEG、PNG、GIF、WebP 格式，当前文件类型：${file.type}`), 400);
    }

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return c.json(createErrorResponse(400, `封面图片大小不能超过1MB，当前文件大小：${(file.size / 1024 / 1024).toFixed(2)}MB`), 400);
    }

    const user = c.get('user');
    console.log('User info:', { id: user?.id, username: user?.username, role: user?.role });

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `covers/cover_${timestamp}_${randomStr}.${fileExtension}`;

    console.log('Generated filename:', fileName);

    // 上传到R2
    console.log('Starting R2 upload...');
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    console.log('R2 upload completed');

    const fileUrl = `/api/files/${fileName}`;

    // 保存文件记录
    console.log('Saving file record to database...');
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      'preview'
    ).run();
    console.log('File record saved successfully');

    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName
    }, '封面图片上传成功'));
  } catch (error) {
    console.error('Cover upload error:', error);

    // 提供更详细的错误信息
    let errorMessage = '封面图片上传失败';
    let statusCode = 500;

    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // 检查是否是特定的错误类型
      if (error.message.includes('Invalid JWT') || error.message.includes('token')) {
        errorMessage = '认证失败，请重新登录';
        statusCode = 401;
      } else if (error.message.includes('permission') || error.message.includes('role')) {
        errorMessage = '权限不足，需要创作者权限';
        statusCode = 403;
      } else if (error.message.includes('file') || error.message.includes('upload')) {
        errorMessage = `文件上传失败：${error.message}`;
        statusCode = 400;
      }
    }

    return c.json(createErrorResponse(statusCode, errorMessage, 'server', error instanceof Error ? error.message : '服务器内部错误'), statusCode as any);
  }
});

// 上传预览视频
app.post('/api/creator/upload/preview-video', authMiddleware, creatorMiddleware, async (c) => {
  try {
    // 检查R2存储桶是否配置
    if (!c.env.R2_BUCKET) {
      return c.json(createErrorResponse(500, '文件存储服务未配置，请联系管理员'), 500);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json(createErrorResponse(400, '未找到上传文件'), 400);
    }

    // 验证文件类型
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.type)) {
      return c.json(createErrorResponse(400, '预览视频仅支持 MP4、WebM、OGG、AVI、MOV 格式'), 400);
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return c.json(createErrorResponse(400, '预览视频大小不能超过50MB'), 400);
    }

    const user = c.get('user');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'mp4';
    const fileName = `videos/video_${timestamp}_${randomStr}.${fileExtension}`;

    // 上传到R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `/api/files/${fileName}`;

    // 保存文件记录
    await c.env.DB.prepare(`
      INSERT INTO files (user_id, filename, original_name, file_type, file_size, file_url, upload_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      fileName,
      file.name,
      file.type,
      file.size,
      fileUrl,
      'preview'
    ).run();

    return c.json(createSuccessResponse({
      url: fileUrl,
      filename: fileName,
      compressed: false
    }, '预览视频上传成功'));
  } catch (error) {
    console.error('Video upload error:', error);
    return c.json(createErrorResponse(500, '预览视频上传失败', 'server', '服务器内部错误'), 500);
  }
});



// 取消推广
app.delete('/api/creator/promotions/:id', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const promotionId = parseInt(c.req.param('id'));

    if (!promotionId || isNaN(promotionId)) {
      return c.json(createErrorResponse(400, '无效的推广ID'), 400);
    }

    // 检查推广是否存在且属于当前用户
    const promotion = await c.env.DB.prepare(`
      SELECT id, status FROM advertisements 
      WHERE id = ? AND advertiser_id = ?
    `).bind(promotionId, user.id).first();

    if (!promotion) {
      return c.json(createErrorResponse(404, '推广不存在'), 404);
    }

    // 只有pending状态的推广可以取消
    if ((promotion as any).status !== 'pending') {
      return c.json(createErrorResponse(400, '只有待审核状态的推广可以取消'), 400);
    }

    // 更新状态为已取消（使用paused状态表示取消）
    const result = await c.env.DB.prepare(`
      UPDATE advertisements 
      SET status = 'paused', updated_at = ?
      WHERE id = ? AND advertiser_id = ?
    `).bind(new Date().toISOString(), promotionId, user.id).run();

    if (!result.success) {
      return c.json(createErrorResponse(500, '取消推广失败'), 500);
    }

    return c.json(createSuccessResponse(null, '推广已取消'));
  } catch (error) {
    return c.json(createErrorResponse(500, '取消推广失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取推广统计
app.get('/api/creator/promotion-stats', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // 获取推广统计数据
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_promotions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_promotions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_promotions,
        SUM(budget) as total_budget,
        SUM(spent) as total_spent,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks
      FROM advertisements 
      WHERE advertiser_id = ?
    `).bind(user.id).first();

    const statsData = {
      total_promotions: (stats as any)?.total_promotions || 0,
      active_promotions: (stats as any)?.active_promotions || 0,
      pending_promotions: (stats as any)?.pending_promotions || 0,
      total_budget: parseFloat((stats as any)?.total_budget || '0'),
      total_spent: parseFloat((stats as any)?.total_spent || '0'),
      total_impressions: (stats as any)?.total_impressions || 0,
      total_clicks: (stats as any)?.total_clicks || 0,
      click_rate: (stats as any)?.total_impressions > 0
        ? ((stats as any)?.total_clicks / (stats as any)?.total_impressions * 100).toFixed(2) + '%'
        : '0%'
    };

    return c.json(createSuccessResponse(statsData));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取推广统计失败', 'server', '服务器内部错误'), 500);
  }
});

// 用户交易记录API
app.get('/api/user/transactions', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const offset = (page - 1) * pageSize;

    // 获取总数
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM transactions WHERE user_id = ?
    `).bind(user.id).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据
    // workflows 表已移除，不再关联工作流标题
    const transactions = await c.env.DB.prepare(`
      SELECT 
        t.*,
        NULL as workflow_title
      FROM transactions t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, pageSize, offset).all();

    const items = (transactions.results as any[])?.map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      status: row.status,
      payment_method: row.payment_method,
      description: row.description || (row.workflow_title ? `购买工作流: ${row.workflow_title}` : ''),
      created_at: row.created_at,
      workflow_id: row.workflow_id,
      workflow_title: row.workflow_title
    })) || [];

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    return c.json(createErrorResponse(500, '获取交易记录失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取用户购买记录
app.get('/api/user/purchases', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const offset = (page - 1) * pageSize;

    // 获取总数
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM user_workflows uw
      WHERE uw.user_id = ? AND uw.action = 'purchase'
    `).bind(user.id).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据 - workflows 表已移除，不再关联工作流详细信息
    const purchases = await c.env.DB.prepare(`
      SELECT 
        uw.id,
        uw.user_id,
        uw.workflow_id,
        uw.action,
        uw.created_at,
        NULL as title,
        NULL as description,
        NULL as price,
        NULL as preview_images,
        NULL as category_id,
        NULL as category_name
      FROM user_workflows uw
      WHERE uw.user_id = ? AND uw.action = 'purchase'
      ORDER BY uw.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(user.id, pageSize, offset).all();

    const items = (purchases.results as any[])?.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      workflow_id: row.workflow_id,
      action: row.action,
      created_at: row.created_at,
      workflow_title: row.title,
      workflow_description: row.description,
      workflow_price: row.price,
      workflow_preview_images: row.preview_images ? JSON.parse(row.preview_images) : [],
      category_name: row.category_name
    })) || [];

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('获取购买记录失败:', error);
    return c.json(createErrorResponse(500, '获取购买记录失败', 'server', '服务器内部错误'), 500);
  }
});

// ==================== 用户任务相关API ====================

// 获取可参与的任务列表
app.get('/api/tasks', async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || '';
    const category = query.category || '';

    let whereConditions = ["t.status = 'active'"];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereConditions.push('t.category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取总数，排除已被领取的任务
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM tasks t 
      LEFT JOIN task_claims tc ON t.id = tc.task_id AND tc.status = 'claimed'
      WHERE ${whereClause} AND tc.id IS NULL
    `).bind(...params).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据，排除已被领取的任务
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN task_claims tc ON t.id = tc.task_id AND tc.status = 'claimed'
      WHERE ${whereClause} AND tc.id IS NULL
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const items = (tasks.results as any[])?.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      submission_types: row.submission_types ? JSON.parse(row.submission_types) : ["ai_app", "workflow"],
      reward_amount: row.reward_amount,
      reward_type: row.reward_type,
      max_submissions: row.max_submissions,
      start_date: row.start_date,
      end_date: row.end_date,
      status: row.status,
      priority: row.priority,
      category: row.category,
      tags: row.tags,
      attachment_urls: row.attachment_urls,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_username: row.creator_username,
      submission_count: row.submission_count || 0
    })) || [];

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json(createErrorResponse(500, '获取任务列表失败'), 500);
  }
});

// 获取任务详情
app.get('/api/tasks/:id', async (c) => {
  try {
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND t.status = 'published'
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在或未发布'), 404);
    }

    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error('Get task detail error:', error);
    return c.json(createErrorResponse(500, '获取任务详情失败'), 500);
  }
});

// 提交任务
app.post('/api/tasks/:id/submit', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const body = await c.req.json();
    const { content, attachments } = body;

    if (!content) {
      return c.json(createErrorResponse(400, '提交内容不能为空'), 400);
    }

    // 检查任务是否存在且可提交
    const task = await c.env.DB.prepare(`
      SELECT * FROM tasks WHERE id = ? AND status = 'published'
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在或未发布'), 404);
    }

    // 检查截止时间
    if ((task as any).deadline && new Date((task as any).deadline) < new Date()) {
      return c.json(createErrorResponse(400, '任务已截止'), 400);
    }

    // 检查是否已提交过
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();

    if (existingSubmission) {
      return c.json(createErrorResponse(400, '您已提交过该任务'), 400);
    }

    // 检查是否已领取该任务
    const taskClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();

    if (!taskClaim) {
      return c.json(createErrorResponse(400, '您需要先领取该任务才能提交'), 400);
    }

    // 检查参与人数限制（基于task_claims和task_submissions的总数）
    if ((task as any).max_participants) {
      const totalParticipants = await c.env.DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM task_claims WHERE task_id = ?) +
          (SELECT COUNT(*) FROM task_submissions WHERE task_id = ?) as count
      `).bind(taskId, taskId).first();

      if ((totalParticipants as any)?.count >= (task as any).max_participants) {
        return c.json(createErrorResponse(400, '任务参与人数已满'), 400);
      }
    }

    // 创建提交记录
    const result = await c.env.DB.prepare(`
      INSERT INTO task_submissions (task_id, user_id, content, attachments, status, submitted_at)
      VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      taskId,
      user.id,
      content,
      attachments ? JSON.stringify(attachments) : null
    ).run();

    // 删除对应的task_claims记录（因为已经提交了）
    await c.env.DB.prepare(`
      DELETE FROM task_claims WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).run();

    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      message: '任务提交成功，等待审核'
    }));
  } catch (error) {
    console.error('Submit task error:', error);
    return c.json(createErrorResponse(500, '提交任务失败'), 500);
  }
});

// 获取我的任务提交记录
app.get('/api/my-task-submissions', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const offset = (page - 1) * pageSize;
    const status = query.status || '';
    const task_id = query.task_id ? parseInt(query.task_id) : null;

    let items: any[] = [];
    let total = 0;

    if (status === 'claimed') {
      // 只查询已领取但未提交工作流的任务
      let claimQuery = `
        SELECT 
          tc.id as claim_id,
          tc.task_id,
          tc.claimed_at,
          tc.status as claim_status,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types
        FROM task_claims tc
        LEFT JOIN tasks t ON tc.task_id = t.id
        LEFT JOIN coze_workflows cw ON tc.task_id = cw.task_id AND cw.creator_id = tc.user_id
        WHERE tc.user_id = ? AND tc.status = 'claimed' AND cw.id IS NULL
      `;
      
      let params = [user.id];
      
      if (task_id) {
        claimQuery += ' AND tc.task_id = ?';
        params.push(task_id);
      }
      
      // 获取总数
      const countQuery = claimQuery.replace('SELECT \n          tc.id as claim_id,\n          tc.task_id,\n          tc.claimed_at,\n          tc.status as claim_status,\n          t.title as task_title,\n          t.description as task_description,\n          t.reward_amount,\n          t.end_date,\n          t.submission_types', 'SELECT COUNT(*) as total');
      const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
      total = ((countResult as any)?.total as number) || 0;
      
      // 获取分页数据
      claimQuery += ' ORDER BY tc.claimed_at DESC LIMIT ? OFFSET ?';
      const results = await c.env.DB.prepare(claimQuery).bind(...params, pageSize, offset).all();
      
      items = (results.results as any[])?.map((row: any) => ({
        id: row.claim_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: '',
        status: 'claimed',
        review_comment: null,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: row.claimed_at,
        submitted_at: row.claimed_at,
        created_at: row.claimed_at,
        updated_at: row.claimed_at,
        submission_types: row.submission_types,
        submission_type: null
      })) || [];
      
    } else if (status && status !== 'claimed') {
      // 查询特定状态的工作流提交记录（从coze_workflows表）
      let workflowQuery = `
        SELECT 
          cw.id as workflow_id,
          cw.task_id,
          cw.title as workflow_title,
          cw.description as workflow_description,
          cw.status as workflow_status,
          cw.created_at as workflow_created_at,
          cw.updated_at as workflow_updated_at,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.creator_id = ? AND cw.task_id IS NOT NULL AND cw.status = ?
      `;
      
      let params = [user.id, status];
      
      if (task_id) {
        workflowQuery += ' AND cw.task_id = ?';
        params.push(task_id);
      }
      
      // 获取总数
      const countQuery = workflowQuery.replace('SELECT \n          cw.id as workflow_id,\n          cw.task_id,\n          cw.title as workflow_title,\n          cw.description as workflow_description,\n          cw.status as workflow_status,\n          cw.created_at as workflow_created_at,\n          cw.updated_at as workflow_updated_at,\n          t.title as task_title,\n          t.description as task_description,\n          t.reward_amount,\n          t.end_date,\n          t.submission_types', 'SELECT COUNT(*) as total');
      const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
      total = ((countResult as any)?.total as number) || 0;
      
      // 获取分页数据
      workflowQuery += ' ORDER BY cw.created_at DESC LIMIT ? OFFSET ?';
      const results = await c.env.DB.prepare(workflowQuery).bind(...params, pageSize, offset).all();
      
      items = (results.results as any[])?.map((row: any) => ({
        id: row.workflow_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: row.workflow_description || '',
        status: row.workflow_status === 'online' ? 'approved' : row.workflow_status,
        review_comment: null,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: null,
        submitted_at: row.workflow_created_at,
        created_at: row.workflow_created_at,
        updated_at: row.workflow_updated_at,
        submission_types: row.submission_types,
        submission_type: 'workflow'
      })) || [];
      
    } else {
      // 查询所有任务（已领取未提交的和已提交工作流的）
      // 先查询已领取但未提交工作流的任务
      const claimQuery = `
        SELECT 
          tc.id as claim_id,
          tc.task_id,
          tc.claimed_at,
          'claimed' as status,
          NULL as review_comment,
          tc.claimed_at as submission_created_at,
          NULL as submission_type,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types,
          tc.claimed_at as sort_date
        FROM task_claims tc
        LEFT JOIN tasks t ON tc.task_id = t.id
        LEFT JOIN coze_workflows cw ON tc.task_id = cw.task_id AND cw.creator_id = tc.user_id
        WHERE tc.user_id = ? AND tc.status = 'claimed' AND cw.id IS NULL
      `;
      
      // 再查询已提交的工作流
      const workflowQuery = `
        SELECT 
          cw.id as workflow_id,
          cw.task_id,
          cw.description as workflow_description,
          cw.status,
          NULL as review_comment,
          cw.created_at as submission_created_at,
          'workflow' as submission_type,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.end_date,
          t.submission_types,
          cw.created_at as sort_date
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.creator_id = ? AND cw.task_id IS NOT NULL
      `;
      
      let params = [user.id];
      let taskFilter = '';
      
      if (task_id) {
        taskFilter = ' AND tc.task_id = ?';
        params.push(task_id);
      }
      
      // 使用UNION合并两个查询结果
      const unionQuery = `
        SELECT * FROM (
          ${claimQuery}${taskFilter}
          UNION ALL
          ${workflowQuery}${task_id ? ' AND cw.task_id = ?' : ''}
        ) combined
        ORDER BY sort_date DESC
      `;
      
      let unionParams = [user.id];
      if (task_id) {
        unionParams.push(task_id, user.id, task_id);
      } else {
        unionParams.push(user.id);
      }
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM (${unionQuery.replace('ORDER BY sort_date DESC', '')}) counted`;
      const countResult = await c.env.DB.prepare(countQuery).bind(...unionParams).first();
      total = ((countResult as any)?.total as number) || 0;
      
      // 获取分页数据
      const paginatedQuery = unionQuery + ' LIMIT ? OFFSET ?';
      const results = await c.env.DB.prepare(paginatedQuery).bind(...unionParams, pageSize, offset).all();
      
      items = (results.results as any[])?.map((row: any) => ({
        id: row.workflow_id || row.claim_id,
        task_id: row.task_id,
        task_title: row.task_title,
        task_description: row.task_description,
        content: row.workflow_description || '',
        status: row.status === 'online' ? 'approved' : row.status,
        review_comment: row.review_comment,
        task_reward_amount: row.reward_amount,
        task_end_date: row.end_date,
        end_date: row.end_date,
        claimed_at: row.status === 'claimed' ? row.submission_created_at : null,
        submitted_at: row.submission_created_at,
        created_at: row.submission_created_at,
        updated_at: row.submission_created_at,
        submission_types: row.submission_types,
        submission_type: row.submission_type
      })) || [];
    }

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('Get my task submissions error:', error);
    return c.json(createErrorResponse(500, '获取我的任务记录失败'), 500);
  }
});

// 获取我的提交详情
app.get('/api/my-task-submissions/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const submissionId = parseInt(c.req.param('id'));
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, '无效的提交ID'), 400);
    }

    const submission = await c.env.DB.prepare(`
      SELECT 
        ts.*,
        t.title as task_title,
        t.description as task_description,
        t.reward_amount,
        t.requirements,
        t.submission_format
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = ? AND ts.user_id = ?
    `).bind(submissionId, user.id).first();

    if (!submission) {
      return c.json(createErrorResponse(404, '提交记录不存在'), 404);
    }

    const result = {
      ...submission,
      attachments: (submission as any).attachments ? JSON.parse((submission as any).attachments) : []
    };

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get my task submission detail error:', error);
    return c.json(createErrorResponse(500, '获取提交详情失败'), 500);
  }
});

// 更新我的提交
app.put('/api/my-task-submissions/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const submissionId = parseInt(c.req.param('id'));
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, '无效的提交ID'), 400);
    }

    const body = await c.req.json();
    const { content, attachments } = body;

    if (!content) {
      return c.json(createErrorResponse(400, '提交内容不能为空'), 400);
    }

    // 检查提交是否存在且属于当前用户
    const submission = await c.env.DB.prepare(`
      SELECT ts.*, t.deadline FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      WHERE ts.id = ? AND ts.user_id = ?
    `).bind(submissionId, user.id).first();

    if (!submission) {
      return c.json(createErrorResponse(404, '提交记录不存在'), 404);
    }

    if ((submission as any).status !== 'pending') {
      return c.json(createErrorResponse(400, '只能修改待审核的提交'), 400);
    }

    // 检查截止时间
    if ((submission as any).deadline && new Date((submission as any).deadline) < new Date()) {
      return c.json(createErrorResponse(400, '任务已截止，无法修改'), 400);
    }

    // 更新提交
    await c.env.DB.prepare(`
      UPDATE task_submissions SET
        content = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      content,
      attachments ? JSON.stringify(attachments) : null,
      submissionId
    ).run();

    return c.json(createSuccessResponse({ message: '提交更新成功' }));
  } catch (error) {
    console.error('Update my task submission error:', error);
    return c.json(createErrorResponse(500, '更新提交失败'), 500);
  }
});

// 撤回我的提交
app.delete('/api/my-task-submissions/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    // 检查是否有领取记录
    const claim = await c.env.DB.prepare(`
      SELECT * FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();

    if (!claim) {
      return c.json(createErrorResponse(404, '任务记录不存在'), 404);
    }

    // 检查是否有工作流提交记录
    const workflow = await c.env.DB.prepare(`
      SELECT * FROM coze_workflows WHERE task_id = ? AND creator_id = ?
    `).bind(taskId, user.id).first();

    if (workflow && (workflow as any).status !== 'pending') {
      return c.json(createErrorResponse(400, '只能撤回待审核的提交'), 400);
    }

    // 删除task_claims记录
    await c.env.DB.prepare('DELETE FROM task_claims WHERE task_id = ? AND user_id = ?').bind(taskId, user.id).run();

    // 删除coze_workflows记录（如果存在）
    if (workflow) {
      await c.env.DB.prepare('DELETE FROM coze_workflows WHERE task_id = ? AND creator_id = ?').bind(taskId, user.id).run();
    }

    return c.json(createSuccessResponse({ message: '提交撤回成功' }));
  } catch (error) {
    console.error('Withdraw my task submission error:', error);
    return c.json(createErrorResponse(500, '撤回提交失败'), 500);
  }
});

// 检查任务参与状态
app.get('/api/tasks/:id/participation', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const submission = await c.env.DB.prepare(`
      SELECT id, status FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();

    if (submission) {
      return c.json(createSuccessResponse({
        participated: true,
        submission_id: (submission as any).id,
        status: (submission as any).status
      }));
    } else {
      return c.json(createSuccessResponse({
        participated: false
      }));
    }
  } catch (error) {
    console.error('Check task participation error:', error);
    return c.json(createErrorResponse(500, '检查参与状态失败'), 500);
  }
});

// 获取任务的工作流数据（用于重新提交时的数据回填）
app.get('/api/tasks/:id/workflow', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    // 查询用户为该任务提交的工作流数据，返回所有字段
    const workflow = await c.env.DB.prepare(`
      SELECT * FROM coze_workflows 
      WHERE task_id = ? AND creator_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(taskId, user.id).first();

    if (!workflow) {
      return c.json(createSuccessResponse(null));
    }

    // 返回完整的数据库字段，包括所有字段
    const workflowData = {
      id: (workflow as any).id,
      creator_id: (workflow as any).creator_id,
      title: (workflow as any).title,
      description: (workflow as any).description || '',
      category_id: (workflow as any).category_id,
      subcategory_id: (workflow as any).subcategory_id,
      price: (workflow as any).price || 0,
      is_member_free: Boolean((workflow as any).is_member_free),
      workflow_file_url: (workflow as any).workflow_file_url,
      workflow_file_name: (workflow as any).workflow_file_name,
      workflow_file_size: (workflow as any).workflow_file_size,
      cover_image_url: (workflow as any).cover_image_url,
      preview_video_url: (workflow as any).preview_video_url,
      preview_images: (workflow as any).preview_images ? JSON.parse((workflow as any).preview_images) : [],
      tags: (workflow as any).tags ? JSON.parse((workflow as any).tags) : [],
      like_count: (workflow as any).like_count || 0,
      favorite_count: (workflow as any).favorite_count || 0,
      download_count: (workflow as any).download_count || 0,
      view_count: (workflow as any).view_count || 0,
      comment_count: (workflow as any).comment_count || 0,
      status: (workflow as any).status,
      is_featured: Boolean((workflow as any).is_featured),
      is_official: Boolean((workflow as any).is_official),
      created_at: (workflow as any).created_at,
      updated_at: (workflow as any).updated_at,
      coze_api: (workflow as any).coze_api,
      task_id: (workflow as any).task_id,
      quick_commands: (workflow as any).quick_commands ? JSON.parse((workflow as any).quick_commands) : [],
      type: (workflow as any).type || 'coze',
      download_price: (workflow as any).download_price || 0,
      is_download_member_free: Boolean((workflow as any).is_download_member_free)
    };

    return c.json(createSuccessResponse(workflowData));
  } catch (error) {
    console.error('Get task workflow error:', error);
    return c.json(createErrorResponse(500, '获取工作流数据失败'), 500);
  }
});

// 领取任务
app.post('/api/tasks/:id/claim', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    // 检查任务是否存在且可领取
    const task = await c.env.DB.prepare(`
      SELECT * FROM tasks WHERE id = ? AND status = 'active'
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在或不可领取'), 404);
    }

    // 检查任务是否已过期
    if ((task as any).end_date && new Date((task as any).end_date) < new Date()) {
      return c.json(createErrorResponse(400, '任务已过期'), 400);
    }

    // 检查是否已经领取过（检查task_claims表）
    const existingClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();

    if (existingClaim) {
      return c.json(createErrorResponse(400, '您已经领取过该任务'), 400);
    }

    // 检查任务参与人数限制（基于task_claims表）
    if ((task as any).max_submissions) {
      const claimCount = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM task_claims WHERE task_id = ? AND status = 'claimed'
      `).bind(taskId).first();

      if ((claimCount as any)?.count >= (task as any).max_submissions) {
        return c.json(createErrorResponse(400, '任务参与人数已满'), 400);
      }
    }

    // 创建任务领取记录
    const result = await c.env.DB.prepare(`
      INSERT INTO task_claims (task_id, user_id, status, claimed_at, created_at, updated_at)
      VALUES (?, ?, 'claimed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(taskId, user.id).run();

    return c.json(createSuccessResponse({
      success: true,
      message: '任务领取成功！请及时提交任务内容',
      claim_id: result.meta.last_row_id
    }));
  } catch (error) {
    console.error('Claim task error:', error);
    return c.json(createErrorResponse(500, '领取任务失败'), 500);
  }
});

// 取消任务领取
app.delete('/api/tasks/:id/claim', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    // 检查是否已经领取该任务
    const existingClaim = await c.env.DB.prepare(`
      SELECT id FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).first();

    if (!existingClaim) {
      return c.json(createErrorResponse(404, '您尚未领取该任务'), 404);
    }

    // 检查是否已经提交了任务
    const existingSubmission = await c.env.DB.prepare(`
      SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ?
    `).bind(taskId, user.id).first();

    if (existingSubmission) {
      return c.json(createErrorResponse(400, '任务已提交，无法取消领取'), 400);
    }

    // 直接删除任务领取记录
    await c.env.DB.prepare(`
      DELETE FROM task_claims WHERE task_id = ? AND user_id = ? AND status = 'claimed'
    `).bind(taskId, user.id).run();

    return c.json(createSuccessResponse({
      success: true,
      message: '任务领取已取消，任务重新开放给其他用户'
    }));
  } catch (error) {
    console.error('Cancel task claim error:', error);
    return c.json(createErrorResponse(500, '取消任务领取失败'), 500);
  }
});

// 获取任务统计信息
app.get('/api/my-task-stats', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_participated,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_submissions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_submissions,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_submissions,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN (SELECT reward_amount FROM tasks WHERE id = ts.task_id) ELSE 0 END), 0) as total_earnings
      FROM task_submissions ts
      WHERE ts.user_id = ?
    `).bind(user.id).first();

    return c.json(createSuccessResponse({
      total_participated: (stats as any)?.total_participated || 0,
      pending_submissions: (stats as any)?.pending_submissions || 0,
      approved_submissions: (stats as any)?.approved_submissions || 0,
      rejected_submissions: (stats as any)?.rejected_submissions || 0,
      total_earnings: (stats as any)?.total_earnings || 0
    }));
  } catch (error) {
    console.error('Get my task stats error:', error);
    return c.json(createErrorResponse(500, '获取任务统计失败'), 500);
  }
});




// ==================== Coze工作流 API ====================

// 获取Coze工作流列表
app.get('/api/coze-workflows', async (c) => {
  try {
    const query = c.req.query();
    const params = {
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 20,
      category: query.category ? parseInt(query.category) : undefined,
      status: query.status || 'approved',
      featured: query.featured === 'true' ? true : undefined,
      search: query.search,
      sortBy: query.sortBy || 'hot'
    };

    const db = new D1Database(c.env);
    const result = await db.getCozeWorkflows(params);
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('获取Coze工作流列表失败:', error);
    return c.json(createErrorResponse(500, '获取Coze工作流列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取单个Coze工作流详情
app.get('/api/coze-workflows/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    const db = new D1Database(c.env);
    const workflow = await db.getCozeWorkflowById(id);

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 检查用户权限和工作流状态
    const authHeader = c.req.header('Authorization');
    let user = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const auth = new AuthService(c.env, db);
        const authResult = await auth.verifyToken(token);
        if (authResult) {
          user = await db.getUserById(authResult.userId);
        }
      } catch (error) {
        // 忽略认证错误，继续处理
      }
    }

    // 如果工作流不是在线状态，检查用户权限
    if (workflow.status !== 'online') {
      // 未登录用户无法查看审核中的工作流
      if (!user) {
        return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
      }

      // 检查是否有权限查看审核中的工作流
      const canViewPending =
        user.role === 'admin' ||
        user.role === 'super_admin' ||
        (user.role === 'creator' && workflow.creator_id === user.id);

      if (!canViewPending) {
        return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
      }
    }

    return c.json(createSuccessResponse(workflow));
  } catch (error) {
    console.error('获取Coze工作流详情失败:', error);
    return c.json(createErrorResponse(500, '获取Coze工作流详情失败', 'server', '服务器内部错误'), 500);
  }
});

// 记录Coze工作流浏览量
app.post('/api/coze-workflows/:id/view', async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 增加浏览量
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      UPDATE coze_workflows 
      SET view_count = view_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(now, workflowId).run();

    // 获取更新后的浏览量
    const updatedWorkflow = await c.env.DB.prepare(`
      SELECT view_count FROM coze_workflows WHERE id = ?
    `).bind(workflowId).first();

    return c.json(createSuccessResponse({
      success: true,
      message: 'Coze工作流浏览量记录成功',
      view_count: (updatedWorkflow as any)?.view_count || 0
    }));
  } catch (error) {
    console.error('Record coze workflow view error:', error);
    return c.json(createErrorResponse(500, '记录Coze工作流浏览量失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取用户对Coze工作流的状态（点赞、收藏、购买）
app.get('/api/coze-workflows/:id/status', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id, price, download_price, is_member_free, is_download_member_free FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 检查点赞状态
    const likeRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_likes 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();

    // 检查收藏状态
    const favoriteRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_favorites 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();

    // 检查购买状态
    const purchaseRecord = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_purchases 
      WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
    `).bind(workflowId, user.id).first();

    // 判断是否已购买（免费或已付费）
    const workflowData = workflow as any;
    const isDownloadFree = workflowData.is_download_member_free || (workflowData.download_price || 0) === 0;
    const isPurchased = !!purchaseRecord || isDownloadFree;

    return c.json(createSuccessResponse({
      liked: !!likeRecord,
      favorited: !!favoriteRecord,
      purchased: isPurchased
    }));
  } catch (error) {
    console.error('获取用户Coze工作流状态失败:', error);
    return c.json(createErrorResponse(500, '获取用户状态失败', 'server', '服务器内部错误'), 500);
  }
});

// 点赞Coze工作流
app.post('/api/coze-workflows/:id/like', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 检查是否已点赞
    const existingLike = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_likes 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();

    const now = new Date().toISOString();
    let liked = false;

    if (existingLike) {
      // 取消点赞
      await c.env.DB.prepare(`
        DELETE FROM coze_workflow_likes 
        WHERE workflow_id = ? AND user_id = ?
      `).bind(workflowId, user.id).run();

      // 减少点赞数
      await c.env.DB.prepare(`
        UPDATE coze_workflows 
        SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END, updated_at = ?
        WHERE id = ?
      `).bind(now, workflowId).run();

      liked = false;
    } else {
      // 添加点赞
      await c.env.DB.prepare(`
        INSERT INTO coze_workflow_likes (workflow_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).bind(workflowId, user.id, now).run();

      // 增加点赞数
      await c.env.DB.prepare(`
        UPDATE coze_workflows 
        SET like_count = like_count + 1, updated_at = ?
        WHERE id = ?
      `).bind(now, workflowId).run();

      liked = true;
    }

    return c.json(createSuccessResponse({
      success: true,
      message: liked ? 'Coze工作流点赞成功' : 'Coze工作流取消点赞成功',
      liked: liked
    }));
  } catch (error) {
    console.error('Coze工作流点赞操作失败:', error);
    return c.json(createErrorResponse(500, '点赞操作失败', 'server', '服务器内部错误'), 500);
  }
});

// 收藏Coze工作流
app.post('/api/coze-workflows/:id/favorite', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 检查是否已收藏
    const existingFavorite = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_favorites 
      WHERE workflow_id = ? AND user_id = ?
    `).bind(workflowId, user.id).first();

    const now = new Date().toISOString();
    let favorited = false;

    if (existingFavorite) {
      // 取消收藏
      await c.env.DB.prepare(`
        DELETE FROM coze_workflow_favorites 
        WHERE workflow_id = ? AND user_id = ?
      `).bind(workflowId, user.id).run();

      favorited = false;
    } else {
      // 添加收藏
      await c.env.DB.prepare(`
        INSERT INTO coze_workflow_favorites (workflow_id, user_id, created_at)
        VALUES (?, ?, ?)
      `).bind(workflowId, user.id, now).run();

      favorited = true;
    }

    return c.json(createSuccessResponse({
      success: true,
      message: favorited ? 'Coze工作流收藏成功' : 'Coze工作流取消收藏成功',
      favorited: favorited
    }));
  } catch (error) {
    console.error('Coze工作流收藏操作失败:', error);
    return c.json(createErrorResponse(500, '收藏操作失败', 'server', '服务器内部错误'), 500);
  }
});

// 购买Coze工作流
app.post('/api/coze-workflows/:id/purchase', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();
    const paymentMethod = body.payment_method || 'wh_coins';

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 获取工作流信息
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, download_price, is_download_member_free, creator_id 
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    const workflowData = workflow as any;
    const downloadPrice = workflowData.download_price || 0;
    const isDownloadFree = workflowData.is_download_member_free || downloadPrice === 0;

    // 检查是否已购买
    const existingPurchase = await c.env.DB.prepare(`
      SELECT id FROM coze_workflow_purchases 
      WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
    `).bind(workflowId, user.id).first();

    if (existingPurchase || isDownloadFree) {
      return c.json(createSuccessResponse({
        success: true,
        message: '工作流已购买或免费',
        wh_coins_used: 0,
        remaining_balance: 0
      }));
    }

    // 检查用户余额
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();

    const currentBalance = (userBalance as any)?.wh_coins || 0;
    if (currentBalance < downloadPrice) {
      return c.json(createErrorResponse(400, 'WH币余额不足'), 400);
    }

    const now = new Date().toISOString();

    // 开始事务处理
    try {
      // 扣除用户余额
      await c.env.DB.prepare(`
        UPDATE users 
        SET wh_coins = wh_coins - ?, updated_at = ?
        WHERE id = ?
      `).bind(downloadPrice, now, user.id).run();

      // 记录购买记录
      const purchaseResult = await c.env.DB.prepare(`
        INSERT INTO coze_workflow_purchases (workflow_id, user_id, amount, payment_method, status, created_at)
        VALUES (?, ?, ?, ?, 'completed', ?)
      `).bind(workflowId, user.id, downloadPrice, paymentMethod, now).run();

      // 记录交易记录
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, status, created_at)
        VALUES (?, 'purchase', ?, ?, 'completed', ?)
      `).bind(user.id, downloadPrice, `购买Coze工作流: ${workflowData.title}`, now).run();

      // 给创作者分成（如果不是自己购买自己的作品）
      if (workflowData.creator_id !== user.id) {
        const commission = Math.floor(downloadPrice * 0.7); // 70%分成
        await c.env.DB.prepare(`
          UPDATE users 
          SET wh_coins = wh_coins + ?, updated_at = ?
          WHERE id = ?
        `).bind(commission, now, workflowData.creator_id).run();

        // 记录分成记录
        await c.env.DB.prepare(`
          INSERT INTO transactions (user_id, type, amount, description, status, created_at)
          VALUES (?, 'commission', ?, ?, 'completed', ?)
        `).bind(workflowData.creator_id, commission, `Coze工作流销售分成: ${workflowData.title}`, now).run();
      }

      // 获取更新后的余额
      const updatedBalance = await c.env.DB.prepare(`
        SELECT wh_coins FROM users WHERE id = ?
      `).bind(user.id).first();

      return c.json(createSuccessResponse({
        success: true,
        message: '购买成功',
        transaction_id: purchaseResult.meta.last_row_id,
        wh_coins_used: downloadPrice,
        remaining_balance: (updatedBalance as any)?.wh_coins || 0,
        workflow_title: workflowData.title
      }));
    } catch (transactionError) {
      console.error('购买事务处理失败:', transactionError);
      return c.json(createErrorResponse(500, '购买处理失败，请稍后重试'), 500);
    }
  } catch (error) {
    console.error('Coze工作流购买失败:', error);
    return c.json(createErrorResponse(500, '购买失败', 'server', '服务器内部错误'), 500);
  }
});

// 下载Coze工作流
app.post('/api/coze-workflows/:id/download', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!workflowId || isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 获取工作流信息
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, file_url, file_name, download_price, is_download_member_free 
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    const workflowData = workflow as any;
    const downloadPrice = workflowData.download_price || 0;
    const isDownloadFree = workflowData.is_download_member_free || downloadPrice === 0;

    // 检查是否有下载权限
    if (!isDownloadFree) {
      const purchaseRecord = await c.env.DB.prepare(`
        SELECT id FROM coze_workflow_purchases 
        WHERE workflow_id = ? AND user_id = ? AND status = 'completed'
      `).bind(workflowId, user.id).first();

      if (!purchaseRecord) {
        return c.json(createErrorResponse(403, '请先购买此工作流'), 403);
      }
    }

    // 检查文件是否存在
    if (!workflowData.file_url) {
      return c.json(createErrorResponse(404, '文件不存在'), 404);
    }

    // 记录下载次数
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      UPDATE coze_workflows 
      SET download_count = download_count + 1, updated_at = ?
      WHERE id = ?
    `).bind(now, workflowId).run();

    // 记录下载历史
    await c.env.DB.prepare(`
      INSERT INTO coze_workflow_downloads (workflow_id, user_id, created_at)
      VALUES (?, ?, ?)
    `).bind(workflowId, user.id, now).run();

    return c.json(createSuccessResponse({
      success: true,
      message: '下载链接获取成功',
      download_url: workflowData.file_url,
      filename: workflowData.file_name || `${workflowData.title}.zip`
    }));
  } catch (error) {
    console.error('Coze工作流下载失败:', error);
    return c.json(createErrorResponse(500, '下载失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取Coze工作流评论
app.get('/api/coze-workflows/:id/comments', async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 获取评论列表
    const comments = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.username,
        u.avatar_url,
        (
          SELECT COUNT(*) FROM coze_workflow_comments 
          WHERE parent_id = c.id
        ) as reply_count
      FROM coze_workflow_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.coze_workflow_id = ? AND c.parent_id IS NULL
      ORDER BY c.created_at DESC
      LIMIT 50
    `).bind(workflowId).all();

    const formattedComments = comments.results.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      like_count: comment.like_count || 0,
      reply_count: comment.reply_count || 0,
      created_at: comment.created_at,
      user: {
        username: comment.username || '匿名用户',
        avatar_url: comment.avatar_url
      }
    }));

    return c.json(createSuccessResponse({
      posts: formattedComments
    }));
  } catch (error) {
    console.error('获取Coze工作流评论失败:', error);
    return c.json(createErrorResponse(500, '获取评论失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建Coze工作流评论
app.post('/api/coze-workflows/:id/comments', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();
    const { content, parent_id } = body;

    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的Coze工作流ID'), 400);
    }

    if (!content || !content.trim()) {
      return c.json(createErrorResponse(400, '评论内容不能为空'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在'), 404);
    }

    // 如果是回复评论，检查父评论是否存在
    if (parent_id) {
      const parentComment = await c.env.DB.prepare(`
        SELECT id FROM coze_workflow_comments 
        WHERE id = ? AND coze_workflow_id = ?
      `).bind(parent_id, workflowId).first();

      if (!parentComment) {
        return c.json(createErrorResponse(404, '父评论不存在'), 404);
      }
    }

    const now = new Date().toISOString();

    // 创建评论
    const result = await c.env.DB.prepare(`
      INSERT INTO coze_workflow_comments (coze_workflow_id, user_id, content, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(workflowId, user.id, content.trim(), parent_id || null, now, now).run();

    // 获取创建的评论详情
    const newComment = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.content,
        c.like_count,
        c.created_at,
        u.username,
        u.avatar_url
      FROM coze_workflow_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).bind(result.meta.last_row_id).first();

    const formattedComment = {
      id: (newComment as any).id,
      content: (newComment as any).content,
      like_count: (newComment as any).like_count || 0,
      reply_count: 0,
      created_at: (newComment as any).created_at,
      user: {
        username: (newComment as any).username || '匿名用户',
        avatar_url: (newComment as any).avatar_url
      }
    };

    return c.json(createSuccessResponse(formattedComment));
  } catch (error) {
    console.error('创建Coze工作流评论失败:', error);
    return c.json(createErrorResponse(500, '创建评论失败', 'server', '服务器内部错误'), 500);
  }
});

// ==================== 微信支付 API ====================

// 微信H5支付API
app.post('/api/wechat/pay/h5', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log('微信H5支付请求:', body);
    
    // 解析订单信息
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name || body.description || '工作流购买',
      description: body.description,
      price: body.price || 0.01 // 前端传递的价格已经是以元为单位
    };
    
    return await WechatPayService.handleH5Payment(c, orderInfo);
  } catch (error) {
    console.error('微信H5支付API错误:', error);
    return c.json(createErrorResponse(500, '微信H5支付失败', 'server', '服务器内部错误'), 500);
  }
});

// 微信Native支付API
app.post('/api/wechat/pay/native', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log('微信Native支付请求:', body);
    
    // 解析订单信息
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name || body.description || '工作流购买',
      description: body.description,
      price: body.price || 0.01 // 前端传递的价格已经是以元为单位
    };
    
    return await WechatPayService.handleNativePayment(c, orderInfo);
  } catch (error) {
    console.error('微信Native支付API错误:', error);
    return c.json(createErrorResponse(500, '微信Native支付失败', 'server', '服务器内部错误'), 500);
  }
});

// 微信支付回调API
app.post('/api/wechat/pay/notify', async (c) => {
  return await WechatPayService.handlePaymentNotify(c);
});

// 查询支付状态API
app.get('/api/wechat/pay/query/:tradeNo', authMiddleware, async (c) => {
  try {
    const tradeNo = c.req.param('tradeNo');
    return await WechatPayService.handlePaymentQuery(c, tradeNo);
  } catch (error) {
    console.error('查询支付状态错误:', error);
    return c.json(createErrorResponse(500, '查询支付状态失败', 'server', '服务器内部错误'), 500);
  }
});

// 统一微信支付API（自动选择H5或Native）
app.post('/api/wechat/pay/unified', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    console.log('统一微信支付请求:', body);
    
    // 获取用户信息
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse(401, '用户未认证'), 401);
    }
    
    // 验证必要字段
    if (!body.price || body.price <= 0) {
      return c.json(createErrorResponse(400, '价格信息无效', 'price', '价格必须大于0'), 400);
    }
    
    // 转换会员周期字段
    const normalizeMembershipPeriod = (period: string): string => {
      if (period === '月' || period === 'month') return 'month';
      if (period === '年' || period === 'year') return 'year';
      return 'month'; // 默认值
    };
    
    // 从planId中提取会员类型和周期，并映射到数据库允许的值
    const extractMembershipInfo = (planId: string) => {
      // planId格式: 'light', 'basic', 'professional', 'light-yearly', 'basic-yearly', etc.
      let membershipType = 'basic'; // 默认值，数据库允许的值
      let period = 'month';
      
      // 映射前端planId到数据库允许的membership_type值
      // 数据库只允许: 'basic', 'premium', 'enterprise'
      if (planId.includes('light')) {
        membershipType = 'basic'; // light系列映射到basic
      } else if (planId.includes('basic')) {
        membershipType = 'basic'; // basic系列保持basic
      } else if (planId.includes('professional')) {
        membershipType = 'premium'; // professional系列映射到premium
      }
      
      if (planId.includes('yearly')) {
        period = 'year';
      }
      
      return { membershipType, period };
    };
    
    // 解析会员信息
    const membershipInfo = extractMembershipInfo(body.id || body.membership_type || 'basic');
    const finalMembershipType = body.membership_type || membershipInfo.membershipType;
    const finalPeriod = body.membership_period || body.period || membershipInfo.period;
    
    console.log('会员信息解析:', {
      planId: body.id,
      extractedInfo: membershipInfo,
      finalMembershipType,
      finalPeriod
    });
    
    // 解析订单信息
    const orderInfo = {
      id: body.out_trade_no || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.description || body.name || '工作流购买',
      description: body.description || `${body.name || '工作流'}购买`,
      price: body.price // 前端传递的价格已经是转换后的人民币金额（元）
    };
    
    console.log('处理后的订单信息:', orderInfo);
    
    // 保存订单到数据库
    const now = new Date().toISOString();
    await c.env.DB.prepare(`
      INSERT INTO orders (
        user_id, out_trade_no, order_type, membership_type, membership_period,
        amount, currency, payment_status, order_title, order_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      orderInfo.id,
      body.order_type || 'membership',
      finalMembershipType,
      normalizeMembershipPeriod(finalPeriod),
      orderInfo.price,
      'CNY',
      'pending',
      orderInfo.name,
      orderInfo.description,
      now,
      now
    ).run();
    
    console.log('订单已保存到数据库:', { outTradeNo: orderInfo.id, userId: user.id });
    
    return await WechatPayService.handleAutoPayment(c, orderInfo);
  } catch (error) {
    console.error('统一微信支付API错误:', error);
    return c.json(createErrorResponse(500, '微信支付失败', 'server', '服务器内部错误'), 500);
  }
});

// ==================== 管理员订单管理 API ====================

// 获取订单列表
app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const status = c.req.query('status');
    const orderType = c.req.query('orderType');
    const search = c.req.query('search');
    
    // 构建查询条件
    const conditions: string[] = [];
    const bindings: any[] = [];
    
    if (status && status !== 'all') {
      conditions.push('o.payment_status = ?');
      bindings.push(status);
    }
    
    if (orderType && orderType !== 'all') {
      conditions.push('o.order_type = ?');
      bindings.push(orderType);
    }
    
    if (search) {
      conditions.push('(o.out_trade_no LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 获取总数
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `).bind(...bindings).first();
    
    const total = ((countResult as any)?.total as number) || 0;
    
    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const orders = await c.env.DB.prepare(`
      SELECT 
        o.*,
        u.username,
        u.email,
        u.avatar_url
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();
    
    const items = (orders.results as any[])?.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      out_trade_no: row.out_trade_no,
      transaction_id: row.transaction_id,
      order_type: row.order_type,
      membership_type: row.membership_type,
      membership_period: row.membership_period,
      amount: parseFloat(row.amount || '0'),
      currency: row.currency,
      payment_status: row.payment_status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        email: row.email,
        avatar_url: row.avatar_url
      }
    })) || [];
    
    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return c.json(createErrorResponse(500, '获取订单列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取订单详情
app.get('/api/admin/orders/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    
    if (!orderId || isNaN(orderId)) {
      return c.json(createErrorResponse(400, '无效的订单ID'), 400);
    }
    
    const order = await c.env.DB.prepare(`
      SELECT 
        o.*,
        u.username,
        u.email,
        u.avatar_url,
        u.membership_type as current_membership_type,
        u.membership_start_date as current_membership_start_date,
        u.membership_end_date as current_membership_end_date
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).bind(orderId).first();
    
    if (!order) {
      return c.json(createErrorResponse(404, '订单不存在'), 404);
    }
    
    const row = order as any;
    const orderDetail = {
      id: row.id,
      user_id: row.user_id,
      out_trade_no: row.out_trade_no,
      transaction_id: row.transaction_id,
      order_type: row.order_type,
      membership_type: row.membership_type,
      membership_period: row.membership_period,
      amount: parseFloat(row.amount || '0'),
      currency: row.currency,
      payment_status: row.payment_status,
      paid_at: row.paid_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        email: row.email,
        avatar_url: row.avatar_url,
        current_membership_type: row.current_membership_type,
        current_membership_start_date: row.current_membership_start_date,
        current_membership_end_date: row.current_membership_end_date
      }
    };
    
    return c.json(createSuccessResponse(orderDetail));
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return c.json(createErrorResponse(500, '获取订单详情失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新订单状态
app.put('/api/admin/orders/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const orderId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    
    if (!orderId || isNaN(orderId)) {
      return c.json(createErrorResponse(400, '无效的订单ID'), 400);
    }
    
    const { status, payment_status } = body;
    const finalStatus = status || payment_status; // 兼容前端传递的status字段
    if (!finalStatus || !['pending', 'paid', 'failed', 'cancelled', 'refunded'].includes(finalStatus)) {
      return c.json(createErrorResponse(400, '无效的支付状态'), 400);
    }
    
    // 检查订单是否存在
    const existingOrder = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).bind(orderId).first();
    
    if (!existingOrder) {
      return c.json(createErrorResponse(404, '订单不存在'), 404);
    }
    
    const now = new Date().toISOString();
    
    // 更新订单状态
    await c.env.DB.prepare(`
      UPDATE orders 
      SET payment_status = ?, updated_at = ?
      WHERE id = ?
    `).bind(finalStatus, now, orderId).run();
    
    // 如果状态改为已支付，且是会员订单，更新用户会员状态
    if (finalStatus === 'paid' && (existingOrder as any).order_type === 'membership') {
      await WechatPayService.updateUserMembership(
        c, 
        (existingOrder as any).user_id, 
        (existingOrder as any).membership_type, 
        (existingOrder as any).membership_period
      );
    }
    
    return c.json(createSuccessResponse({ message: '订单状态更新成功' }));
  } catch (error) {
    console.error('更新订单状态失败:', error);
    return c.json(createErrorResponse(500, '更新订单状态失败', 'server', '服务器内部错误'), 500);
  }
});











// ==================== 服务器管理相关接口 ====================

// 获取服务器列表
app.get('/api/admin/servers', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const search = c.req.query('search') || '';
    const server_type = c.req.query('server_type');
    const status = c.req.query('status');

    const db = new D1Database(c.env);
    const result = await db.getServers({
      page,
      pageSize,
      search,
      server_type,
      status
    });

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('获取服务器列表失败:', error);
    return c.json(createErrorResponse(500, '获取服务器列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取服务器详情
app.get('/api/admin/servers/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param('id'));
    
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, '无效的服务器ID'), 400);
    }

    const db = new D1Database(c.env);
    const server = await db.getServerById(serverId);

    if (!server) {
      return c.json(createErrorResponse(404, '服务器不存在'), 404);
    }

    return c.json(createSuccessResponse(server));
  } catch (error) {
    console.error('获取服务器详情失败:', error);
    return c.json(createErrorResponse(500, '获取服务器详情失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建服务器
app.post('/api/admin/servers', authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const {
      name,
      url,
      description,
      server_type,
      location,
      max_users,
      cpu_cores,
      memory_gb,
      storage_gb,
      bandwidth_mbps
    } = body;

    // 验证必填字段
    if (!name || !url || !server_type) {
      return c.json(createErrorResponse(400, '缺少必填字段'), 400);
    }

    const db = new D1Database(c.env);
    const serverId = await db.createServer({
      name: sanitizeInput(name),
      url: sanitizeInput(url),
      description: sanitizeInput(description || ''),
      server_type,
      location: sanitizeInput(location || ''),
      max_users: parseInt(max_users || '0'),
      cpu_cores: parseInt(cpu_cores || '0'),
      memory_gb: parseInt(memory_gb || '0'),
      storage_gb: parseInt(storage_gb || '0'),
      bandwidth_mbps: parseInt(bandwidth_mbps || '0'),
      created_by: user.id
    });

    return c.json(createSuccessResponse({
      id: serverId,
      message: '服务器创建成功'
    }));
  } catch (error) {
    console.error('创建服务器失败:', error);
    return c.json(createErrorResponse(500, '创建服务器失败', 'server', '服务器内部错误'), 500);
  }
});

// 更新服务器
app.put('/api/admin/servers/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param('id'));
    
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, '无效的服务器ID'), 400);
    }

    const body = await c.req.json();
    const {
      name,
      url,
      description,
      status,
      server_type,
      location,
      max_users,
      current_users,
      cpu_cores,
      memory_gb,
      storage_gb,
      bandwidth_mbps
    } = body;

    const db = new D1Database(c.env);
    const success = await db.updateServer(serverId, {
      name: name ? sanitizeInput(name) : undefined,
      url: url ? sanitizeInput(url) : undefined,
      description: description !== undefined ? sanitizeInput(description) : undefined,
      status,
      server_type,
      location: location !== undefined ? sanitizeInput(location) : undefined,
      max_users: max_users !== undefined ? parseInt(max_users) : undefined,
      current_users: current_users !== undefined ? parseInt(current_users) : undefined,
      cpu_cores: cpu_cores !== undefined ? parseInt(cpu_cores) : undefined,
      memory_gb: memory_gb !== undefined ? parseInt(memory_gb) : undefined,
      storage_gb: storage_gb !== undefined ? parseInt(storage_gb) : undefined,
      bandwidth_mbps: bandwidth_mbps !== undefined ? parseInt(bandwidth_mbps) : undefined
    });

    if (!success) {
      return c.json(createErrorResponse(404, '服务器不存在'), 404);
    }

    return c.json(createSuccessResponse({ message: '服务器更新成功' }));
  } catch (error) {
    console.error('更新服务器失败:', error);
    return c.json(createErrorResponse(500, '更新服务器失败', 'server', '服务器内部错误'), 500);
  }
});

// 删除服务器
app.delete('/api/admin/servers/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const serverId = parseInt(c.req.param('id'));
    
    if (!serverId || isNaN(serverId)) {
      return c.json(createErrorResponse(400, '无效的服务器ID'), 400);
    }

    const db = new D1Database(c.env);
    const success = await db.deleteServer(serverId);

    if (!success) {
      return c.json(createErrorResponse(404, '服务器不存在'), 404);
    }

    return c.json(createSuccessResponse({ message: '服务器删除成功' }));
  } catch (error) {
    console.error('删除服务器失败:', error);
    return c.json(createErrorResponse(500, '删除服务器失败', 'server', '服务器内部错误'), 500);
  }
});

// ==================== 社区帖子相关接口 ====================

// 获取AI应用的社区帖子列表
app.get('/api/ai-apps/:id/posts', async (c) => {
  try {
    const aiAppId = parseInt(c.req.param('id'));
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    if (!aiAppId || isNaN(aiAppId)) {
      return c.json(createErrorResponse(400, '无效的AI应用ID'), 400);
    }

    const db = new D1Database(c.env);
    const result = await db.getCommunityPosts(aiAppId, page, limit);

    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || '操作失败'), 500);
    }

    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error('Get community posts error:', error);
    return c.json(createErrorResponse(500, '获取帖子列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建社区帖子
app.post('/api/ai-apps/:id/posts', authMiddleware, async (c) => {
  try {
    const aiAppId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();
    const { content } = body;

    if (!aiAppId || isNaN(aiAppId)) {
      return c.json(createErrorResponse(400, '无效的AI应用ID'), 400);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return c.json(createErrorResponse(400, '帖子内容不能为空'), 400);
    }

    if (content.trim().length > 1000) {
      return c.json(createErrorResponse(400, '帖子内容不能超过1000字符'), 400);
    }

    const db = new D1Database(c.env);
    const result = await db.createCommunityPost(aiAppId, user.id, content.trim());

    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || '创建帖子失败'), 500);
    }

    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error('Create community post error:', error);
    return c.json(createErrorResponse(500, '创建帖子失败', 'server', '服务器内部错误'), 500);
  }
});

// 点赞/取消点赞帖子
app.post('/api/community/posts/:id/like', authMiddleware, async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));
    const user = c.get('user');

    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, '无效的帖子ID'), 400);
    }

    const db = new D1Database(c.env);
    const result = await db.togglePostLike(postId, user.id);

    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || '操作失败'), 500);
    }

    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error('Toggle post like error:', error);
    return c.json(createErrorResponse(500, '操作失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取帖子回复列表
app.get('/api/community/posts/:id/replies', async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, '无效的帖子ID'), 400);
    }

    const db = new D1Database(c.env);
    const result = await db.getPostReplies(postId, page, limit);

    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || '获取回复列表失败'), 500);
    }

    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error('Get post replies error:', error);
    return c.json(createErrorResponse(500, '获取回复列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建帖子回复
app.post('/api/community/posts/:id/replies', authMiddleware, async (c) => {
  try {
    const postId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();
    const { content } = body;

    if (!postId || isNaN(postId)) {
      return c.json(createErrorResponse(400, '无效的帖子ID'), 400);
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return c.json(createErrorResponse(400, '回复内容不能为空'), 400);
    }

    if (content.trim().length > 500) {
      return c.json(createErrorResponse(400, '回复内容不能超过500字符'), 400);
    }

    const db = new D1Database(c.env);
    const result = await db.createPostReply(postId, user.id, content.trim());

    if (!result.success) {
      return c.json(createErrorResponse(500, result.message || '创建回复失败'), 500);
    }

    return c.json(createSuccessResponse(result.data));
  } catch (error) {
    console.error('Create post reply error:', error);
    return c.json(createErrorResponse(500, '创建回复失败', 'server', '服务器内部错误'), 500);
  }
});

// 解绑微信账号
app.delete('/api/user/wechat-binding', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    
    // 更新用户的微信openid为null
    await c.env.DB.prepare(`
      UPDATE users SET wechat_openid = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run();
    
    return c.json(createSuccessResponse('微信账号解绑成功'));
  } catch (error) {
    console.error('微信解绑失败:', error);
    return c.json(createErrorResponse(500, '微信解绑失败'), 500);
  }
});

// 获取用户钱包余额
app.get('/api/wallet/balance', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse(401, '用户未认证'), 401);
    }

    // 查询用户WH币余额
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();

    const whCoins = (userBalance as any)?.wh_coins || 0;

    return c.json(createSuccessResponse({
      wh_balance: whCoins, // 保持兼容性
      wh_coins: whCoins,
      membership_active: true // 可以根据实际会员状态逻辑调整
    }));
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return c.json(createErrorResponse(500, '获取钱包余额失败', 'server', '服务器内部错误'), 500);
  }
});

// 提现申请API
app.post('/api/wallet/withdraw', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse(401, '用户未认证'), 401);
    }

    const { amount, wechat_account, payment_method = 'wechat' } = await c.req.json();

    // 转换并验证提现金额
    const withdrawAmount = parseFloat(amount);
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return c.json(createErrorResponse(400, '提现金额必须大于0元'), 400);
    }

    // 验证支付方式
    if (payment_method !== 'wechat') {
      return c.json(createErrorResponse(400, '目前仅支持微信提现'), 400);
    }

    // 验证微信账号
    if (!wechat_account || wechat_account.trim() === '') {
      return c.json(createErrorResponse(400, '请输入微信账号'), 400);
    }

    // 查询用户余额
    const userBalance = await c.env.DB.prepare(`
      SELECT balance FROM users WHERE id = ?
    `).bind(user.id).first();

    const currentBalance = (userBalance as any)?.balance || 0;
    if (currentBalance < withdrawAmount) {
      return c.json(createErrorResponse(400, '余额不足'), 400);
    }

    // 创建提现记录
    const withdrawalId = `WD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    await c.env.DB.prepare(`
      INSERT INTO withdrawals (id, user_id, amount, wechat_account, payment_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(withdrawalId, user.id, withdrawAmount, wechat_account, payment_method).run();

    // 扣除用户余额
    await c.env.DB.prepare(`
      UPDATE users SET balance = balance - ? WHERE id = ?
    `).bind(withdrawAmount, user.id).run();

    // 创建交易记录
    await c.env.DB.prepare(`
      INSERT INTO transactions (user_id, type, transaction_type, amount, description, created_at)
      VALUES (?, 'withdrawal', 'withdrawal', ?, ?, datetime('now'))
    `).bind(
      user.id,
      -withdrawAmount,
      `提现申请 - ${withdrawalId}`
    ).run();

    return c.json(createSuccessResponse({
      withdrawal_id: withdrawalId,
      amount,
      status: 'pending',
      message: '提现申请已提交，请等待审核'
    }));
  } catch (error) {
    console.error('Withdraw error:', error);
    return c.json(createErrorResponse(500, '提现申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取提现记录API
app.get('/api/wallet/withdrawals', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json(createErrorResponse(401, '用户未认证'), 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    const withdrawals = await c.env.DB.prepare(`
      SELECT id, amount, wechat_account, status, created_at, processed_at
      FROM withdrawals
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const total = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM withdrawals WHERE user_id = ?
    `).bind(user.id).first();

    return c.json(createSuccessResponse({
      withdrawals: withdrawals.results,
      pagination: {
        page,
        limit,
        total: (total as any)?.count || 0,
        pages: Math.ceil(((total as any)?.count || 0) / limit)
      }
    }));
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return c.json(createErrorResponse(500, '获取提现记录失败', 'server', '服务器内部错误'), 500);
  }
});

// 地区分类管理API
// 获取指定地区的分类列表
app.get('/api/categories/:region', async (c) => {
  try {
    const region = c.req.param('region') as 'global' | 'china' | 'usa';
    
    if (!['global', 'china', 'usa'].includes(region)) {
      return c.json(createErrorResponse(400, '无效的地区参数'), 400);
    }
    
    const db = new D1Database(c.env);
    const categories = await db.getCategoriesByRegion(region);
    
    return c.json(createSuccessResponse(categories));
  } catch (error) {
    console.error('Get categories by region error:', error);
    return c.json(createErrorResponse(500, '获取分类列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取指定地区的标签列表
app.get('/api/tags/:region', async (c) => {
  try {
    const region = c.req.param('region') as 'global' | 'china' | 'usa';
    const query = c.req.query();
    const categoryId = query.categoryId ? parseInt(query.categoryId) : undefined;
    
    if (!['global', 'china', 'usa'].includes(region)) {
      return c.json(createErrorResponse(400, '无效的地区参数'), 400);
    }
    
    const db = new D1Database(c.env);
    const tags = await db.getTagsByRegion(region, categoryId);
    
    return c.json(createSuccessResponse(tags));
  } catch (error) {
    console.error('Get tags by region error:', error);
    return c.json(createErrorResponse(500, '获取标签列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 获取国家/地区列表
app.get('/api/countries', async (c) => {
  try {
    const db = new D1Database(c.env);
    const countries = await db.getCountries();
    
    return c.json(createSuccessResponse(countries));
  } catch (error) {
    console.error('Get countries error:', error);
    return c.json(createErrorResponse(500, '获取国家列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建分类申请
app.post('/api/category-requests', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name, parent_id, region, description, reason } = body;
    
    // 验证必填字段
    if (!name || !region || !reason) {
      return c.json(createErrorResponse(400, '分类名称、地区和申请理由为必填项'), 400);
    }
    
    if (!['china', 'usa'].includes(region)) {
      return c.json(createErrorResponse(400, '地区只能是china或usa'), 400);
    }
    
    const db = new D1Database(c.env);
    const request = await db.createCategoryRequest({
      user_id: user.id,
      name: sanitizeInput(name),
      parent_id: parent_id || undefined,
      region,
      description: description ? sanitizeInput(description) : undefined,
      reason: sanitizeInput(reason)
    });
    
    return c.json(createSuccessResponse(request));
  } catch (error) {
    console.error('Create category request error:', error);
    return c.json(createErrorResponse(500, '创建分类申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 创建标签申请
app.post('/api/tag-requests', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { name, category_id, region, color, description, reason } = body;
    
    // 验证必填字段
    if (!name || !region || !reason) {
      return c.json(createErrorResponse(400, '标签名称、地区和申请理由为必填项'), 400);
    }
    
    if (!['china', 'usa'].includes(region)) {
      return c.json(createErrorResponse(400, '地区只能是china或usa'), 400);
    }
    
    const db = new D1Database(c.env);
    const request = await db.createTagRequest({
      user_id: user.id,
      name: sanitizeInput(name),
      category_id: category_id || undefined,
      region,
      color: color || '#3B82F6',
      description: description ? sanitizeInput(description) : undefined,
      reason: sanitizeInput(reason)
    });
    
    return c.json(createSuccessResponse(request));
  } catch (error) {
    console.error('Create tag request error:', error);
    return c.json(createErrorResponse(500, '创建标签申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员API - 获取分类申请列表
app.get('/api/admin/category-requests', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const status = query.status;
    const region = query.region;
    
    const db = new D1Database(c.env);
    const result = await db.getCategoryRequests({
      page,
      pageSize,
      status,
      region
    });
    
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get category requests error:', error);
    return c.json(createErrorResponse(500, '获取分类申请列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员API - 获取标签申请列表
app.get('/api/admin/tag-requests', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const status = query.status;
    const region = query.region;
    
    const db = new D1Database(c.env);
    const result = await db.getTagRequests({
      page,
      pageSize,
      status,
      region
    });
    
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get tag requests error:', error);
    return c.json(createErrorResponse(500, '获取标签申请列表失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员API - 审核分类申请
app.put('/api/admin/category-requests/:id/review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const requestId = parseInt(c.req.param('id'));
    const admin = c.get('user');
    const body = await c.req.json();
    const { status, admin_comment } = body;
    
    if (!requestId || isNaN(requestId)) {
      return c.json(createErrorResponse(400, '无效的申请ID'), 400);
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }
    
    const db = new D1Database(c.env);
    const result = await db.reviewCategoryRequest(requestId, admin.id, status, admin_comment);
    
    if (result.success) {
      return c.json(createSuccessResponse({ message: result.message }));
    } else {
      return c.json(createErrorResponse(400, result.message), 400);
    }
  } catch (error) {
    console.error('Review category request error:', error);
    return c.json(createErrorResponse(500, '审核分类申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员API - 审核标签申请
app.put('/api/admin/tag-requests/:id/review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const requestId = parseInt(c.req.param('id'));
    const admin = c.get('user');
    const body = await c.req.json();
    const { status, admin_comment } = body;
    
    if (!requestId || isNaN(requestId)) {
      return c.json(createErrorResponse(400, '无效的申请ID'), 400);
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }
    
    const db = new D1Database(c.env);
    const result = await db.reviewTagRequest(requestId, admin.id, status, admin_comment);
    
    if (result.success) {
      return c.json(createSuccessResponse({ message: result.message }));
    } else {
      return c.json(createErrorResponse(400, result.message), 400);
    }
  } catch (error) {
    console.error('Review tag request error:', error);
    return c.json(createErrorResponse(500, '审核标签申请失败', 'server', '服务器内部错误'), 500);
  }
});

// 管理员API - 佣金管理
// ==================== 任务管理相关API ====================

// 获取任务列表
app.get('/api/admin/tasks', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || '';
    const status = query.status || '';
    const sort_by = query.sort_by || 'created_at';
    const order = query.order === 'asc' ? 'ASC' : 'DESC';

    let whereConditions = ['1=1'];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取总数
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}
    `).bind(...params).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据
    const tasks = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id) as submission_count,
        (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = t.id AND ts.status = 'pending') as pending_count
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE ${whereClause}
      ORDER BY ${sort_by} ${order}
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    const items = (tasks.results as any[])?.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      reward_amount: row.reward_amount,
      end_date: row.end_date,
      status: row.status,
      submission_format: row.submission_format,
      category: row.category,
      created_by: row.created_by,
      creator_username: row.creator_username,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submission_count: row.submission_count || 0,
      pending_count: row.pending_count || 0
    })) || [];

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('Get admin tasks error:', error);
    return c.json(createErrorResponse(500, '获取任务列表失败'), 500);
  }
});

// 获取任务详情
app.get('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const task = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.username as creator_username,
        u.email as creator_email
      FROM tasks t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在'), 404);
    }

    // 过滤掉不需要的字段
    const { requirements, ...filteredTask } = task as any;

    return c.json(createSuccessResponse(filteredTask));
  } catch (error) {
    console.error('Get admin task detail error:', error);
    return c.json(createErrorResponse(500, '获取任务详情失败'), 500);
  }
});

// 创建任务
app.post('/api/admin/tasks', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const body = await c.req.json();
    const {
      title,
      description,
      reward, // 前端发送的字段名
      reward_amount, // 兼容直接使用数据库字段名的情况
      deadline, // 前端发送的字段名
      end_date, // 兼容直接使用数据库字段名的情况
      submission_types,
      status = 'draft',
      category
    } = body;

    // 字段验证
    if (!title || !description) {
      return c.json(createErrorResponse(400, '标题和描述不能为空', 'form', '请填写完整的任务信息'), 400);
    }

    // 处理奖励金额字段映射
    const finalRewardAmount = reward_amount || reward;
    if (!finalRewardAmount || finalRewardAmount <= 0) {
      return c.json(createErrorResponse(400, '奖励金额必须大于0', 'reward', '请设置有效的奖励金额'), 400);
    }



    // 处理截止时间字段映射
    const finalEndDate = end_date || deadline;
    if (!finalEndDate) {
      return c.json(createErrorResponse(400, '截止时间不能为空', 'deadline', '请设置任务截止时间'), 400);
    }

    // 验证截止时间格式和有效性
    const endDateTime = new Date(finalEndDate);
    if (isNaN(endDateTime.getTime())) {
      return c.json(createErrorResponse(400, '截止时间格式无效', 'deadline', '请使用有效的日期格式'), 400);
    }

    if (endDateTime <= new Date()) {
      return c.json(createErrorResponse(400, '截止时间必须晚于当前时间', 'deadline', '请设置未来的截止时间'), 400);
    }

    // 设置开始时间为当前时间
    const startDate = new Date().toISOString();

    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (
        title, description, submission_types, reward_amount, reward_type,
        start_date, end_date, status, category, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      title,
      description,
      submission_types || '["ai_app", "workflow"]',
      finalRewardAmount,
      'coins', // 默认奖励类型
      startDate,
      finalEndDate,
      status,
      category || null,
      admin.id
    ).run();

    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      message: '任务创建成功'
    }));
  } catch (error) {
    console.error('Create admin task error:', error);
    // 检查是否是数据库约束错误
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return c.json(createErrorResponse(400, '创建者ID无效', 'user', '用户信息异常，请重新登录'), 400);
      }
      if (error.message.includes('CHECK constraint failed')) {
        return c.json(createErrorResponse(400, '数据格式错误', 'form', '请检查任务状态、优先级等字段的值'), 400);
      }
    }
    return c.json(createErrorResponse(500, '创建任务失败，请重试', 'server', '服务器内部错误'), 500);
  }
});

// 更新任务
app.put('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const body = await c.req.json();
    const {
      title,
      description,
      reward_amount,
      reward, // 前端发送的字段名
      deadline, // 前端发送的字段名
      end_date, // 兼容直接使用数据库字段名的情况
      submission_types,
      status
    } = body;

    // 处理字段映射
    const finalRewardAmount = reward_amount || reward;
    const finalEndDate = end_date || deadline;

    await c.env.DB.prepare(`
      UPDATE tasks SET
        title = ?, description = ?, reward_amount = ?, end_date = ?,
        submission_types = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description,
      finalRewardAmount,
      finalEndDate || null,
      submission_types || '["ai_app", "workflow"]',
      status || 'draft',
      taskId
    ).run();

    return c.json(createSuccessResponse({ message: '任务更新成功' }));
  } catch (error) {
    console.error('Update admin task error:', error);
    return c.json(createErrorResponse(500, '更新任务失败'), 500);
  }
});

// 删除任务
app.delete('/api/admin/tasks/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    // 检查任务是否存在
    const task = await c.env.DB.prepare(`
      SELECT id, title FROM tasks WHERE id = ?
    `).bind(taskId).first();

    if (!task) {
      return c.json(createErrorResponse(404, '任务不存在'), 404);
    }

    // 检查是否有提交记录
    const submissionCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM task_submissions WHERE task_id = ?
    `).bind(taskId).first();

    const count = (submissionCount as any)?.count || 0;
    if (count > 0) {
      return c.json(createErrorResponse(400, `该任务已有 ${count} 条提交记录，无法删除。请先处理所有提交记录后再删除任务。`, 'validation', '任务删除失败'), 400);
    }

    // 使用事务删除任务及相关数据
    const batch = [
      // 1. 删除任务领取记录
      c.env.DB.prepare('DELETE FROM task_claims WHERE task_id = ?').bind(taskId),
      // 2. 删除任务提交记录（虽然上面已经检查过，但为了保险起见）
      c.env.DB.prepare('DELETE FROM task_submissions WHERE task_id = ?').bind(taskId),
      // 3. 更新coze_workflows表中关联的task_id为NULL（如果有的话）
      c.env.DB.prepare('UPDATE coze_workflows SET task_id = NULL WHERE task_id = ?').bind(taskId),
      // 4. 最后删除任务本身
      c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId)
    ];

    const results = await c.env.DB.batch(batch);
    
    // 检查任务是否被成功删除（最后一个操作）
    const taskDeleteResult = results[results.length - 1];
    if (taskDeleteResult.changes === 0) {
      return c.json(createErrorResponse(404, '任务不存在或已被删除'), 404);
    }

    // 记录管理员操作日志
    const currentUser = c.get('user');
    try {
      const db = new D1Database(c.env);
      await db.addAdminLog({
        admin_id: currentUser.id,
        action: 'delete_task',
        target_type: 'task',
        target_id: taskId,
        details: `删除任务: ${(task as any).title}`
      });
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
      // 不因为日志记录失败而影响删除操作的成功响应
    }

    return c.json(createSuccessResponse({ message: '任务删除成功' }));
  } catch (error) {
    console.error('Delete admin task error:', error);
    return c.json(createErrorResponse(500, '删除任务失败，请稍后重试', 'server', '服务器内部错误'), 500);
  }
});

// 更新任务状态
app.put('/api/admin/tasks/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const taskId = parseInt(c.req.param('id'));
    if (isNaN(taskId)) {
      return c.json(createErrorResponse(400, '无效的任务ID'), 400);
    }

    const body = await c.req.json();
    const { status } = body;

    if (!['draft', 'published', 'completed', 'cancelled'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的状态值'), 400);
    }

    await c.env.DB.prepare(`
      UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(status, taskId).run();

    return c.json(createSuccessResponse({ message: '任务状态更新成功' }));
  } catch (error) {
    console.error('Update admin task status error:', error);
    return c.json(createErrorResponse(500, '更新任务状态失败'), 500);
  }
});

// 获取任务提交列表
app.get('/api/admin/task-submissions', authMiddleware, adminMiddleware, async (c) => {
  try {
    const query = c.req.query();
    const page = parseInt(query.page || '1');
    const pageSize = Math.min(parseInt(query.pageSize || '20'), 100);
    const offset = (page - 1) * pageSize;
    const search = query.search || '';
    const status = query.status || '';
    const task_id = query.task_id ? parseInt(query.task_id) : null;
    const sort_by = query.sort_by || 'created_at';
    const order = query.order === 'asc' ? 'ASC' : 'DESC';

    let whereConditions = ['1=1'];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(t.title LIKE ? OR u.username LIKE ? OR ts.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('ts.status = ?');
      params.push(status);
    }

    if (task_id) {
      whereConditions.push('ts.task_id = ?');
      params.push(task_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // 获取task_submissions总数
    const taskCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN users u ON ts.user_id = u.id
      WHERE ${whereClause}
    `).bind(...params).first();

    // 获取coze_workflows总数（带有task_id的）
    const workflowCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM coze_workflows cw
      LEFT JOIN tasks t ON cw.task_id = t.id
      LEFT JOIN users u ON cw.creator_id = u.id
      WHERE cw.task_id IS NOT NULL ${task_id ? 'AND cw.task_id = ?' : ''} ${search ? 'AND (t.title LIKE ? OR u.username LIKE ? OR cw.title LIKE ?)' : ''} ${status ? 'AND cw.status = ?' : ''}
    `).bind(...(task_id ? [task_id] : []), ...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []), ...(status ? [status] : [])).first();

    const taskTotal = ((taskCountResult as any)?.total as number) || 0;
    const workflowTotal = ((workflowCountResult as any)?.total as number) || 0;
    const total = taskTotal + workflowTotal;

    // 获取task_submissions数据
    const taskSubmissions = await c.env.DB.prepare(`
      SELECT 
        ts.*,
        t.title as task_title,
        t.reward_amount,
        u.username,
        u.email as user_email,
        'task_submission' as submission_type
      FROM task_submissions ts
      LEFT JOIN tasks t ON ts.task_id = t.id
      LEFT JOIN users u ON ts.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sort_by} ${order}
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();

    // 获取coze_workflows数据（带有task_id的）
    const workflowSubmissions = await c.env.DB.prepare(`
      SELECT 
        cw.id,
        cw.creator_id,
        cw.title,
        cw.description,
        cw.category_id,
        cw.subcategory_id,
        cw.price,
        cw.is_member_free,
        cw.download_price,
        cw.is_download_member_free,
        cw.workflow_file_url,
        cw.workflow_file_name,
        cw.workflow_file_size,
        cw.cover_image_url,
        cw.preview_video_url,
        cw.preview_images,
        cw.tags,
        cw.like_count,
        cw.favorite_count,
        cw.download_count,
        cw.view_count,
        cw.comment_count,
        cw.status,
        cw.is_featured,
        cw.is_official,
        cw.created_at,
        cw.updated_at,
        cw.coze_api,
        cw.task_id,
        cw.quick_commands,
        cw.type,
        t.title as task_title,
        t.reward_amount,
        u.username,
        u.email as user_email,
        cat.name as category_name,
        'workflow_submission' as submission_type
      FROM coze_workflows cw
      LEFT JOIN tasks t ON cw.task_id = t.id
      LEFT JOIN users u ON cw.creator_id = u.id
      LEFT JOIN categories cat ON cw.category_id = cat.id
      WHERE cw.task_id IS NOT NULL ${task_id ? 'AND cw.task_id = ?' : ''} ${search ? 'AND (t.title LIKE ? OR u.username LIKE ? OR cw.title LIKE ?)' : ''} ${status ? 'AND cw.status = ?' : ''}
      ORDER BY cw.created_at ${order}
      LIMIT ? OFFSET ?
    `).bind(...(task_id ? [task_id] : []), ...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []), ...(status ? [status] : []), pageSize, offset).all();

    // 合并两种类型的提交数据
    const taskItems = (taskSubmissions.results as any[])?.map((row: any) => ({
      id: row.id,
      task_id: row.task_id,
      task_title: row.task_title,
      user_id: row.user_id,
      username: row.username,
      user_email: row.user_email,
      content: row.submission_content,
      attachments: row.attachment_urls ? JSON.parse(row.attachment_urls) : [],
      status: row.status,
      admin_feedback: row.admin_feedback,
      reward_amount: row.reward_amount,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submission_type: 'task_submission'
    })) || [];

    const workflowItems = (workflowSubmissions.results as any[])?.map((row: any) => ({
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      category_name: row.category_name,
      subcategory_id: row.subcategory_id,
      price: row.price,
      is_member_free: row.is_member_free,
      download_price: row.download_price,
      is_download_member_free: row.is_download_member_free,
      workflow_file_url: row.workflow_file_url,
      workflow_file_name: row.workflow_file_name,
      workflow_file_size: row.workflow_file_size,
      cover_image_url: row.cover_image_url,
      preview_video_url: row.preview_video_url,
      preview_images: row.preview_images,
      tags: row.tags,
      like_count: row.like_count,
      favorite_count: row.favorite_count,
      download_count: row.download_count,
      view_count: row.view_count,
      comment_count: row.comment_count,
      status: row.status,
      is_featured: row.is_featured,
      is_official: row.is_official,
      created_at: row.created_at,
      updated_at: row.updated_at,
      coze_api: row.coze_api,
      task_id: row.task_id,
      quick_commands: row.quick_commands,
      type: row.type,
      // 保持前端兼容性的字段映射
      task_title: row.task_title,
      user_id: row.creator_id,
      username: row.username,
      user_email: row.user_email,
      content: row.description,
      reward_amount: row.reward_amount,
      submission_type: 'workflow_submission'
    })) || [];

    // 合并并按创建时间排序
    const items = [...taskItems, ...workflowItems].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === 'DESC' ? dateB - dateA : dateA - dateB;
    });

    return c.json(createSuccessResponse({
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }));
  } catch (error) {
    console.error('Get admin task submissions error:', error);
    return c.json(createErrorResponse(500, '获取任务提交列表失败'), 500);
  }
});

// 获取任务提交详情
app.get('/api/admin/task-submissions/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param('id'));
    const submissionType = c.req.query('type') || 'task_submission';
    
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, '无效的提交ID'), 400);
    }

    let submission;
    
    if (submissionType === 'workflow_submission') {
      // 从coze_workflows表获取数据
      submission = await c.env.DB.prepare(`
        SELECT 
          cw.*,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.requirements,
          t.submission_format,
          u.username,
          u.email as user_email
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        LEFT JOIN users u ON cw.creator_id = u.id
        WHERE cw.id = ?
      `).bind(submissionId).first();
    } else {
      // 从task_submissions表获取数据
      submission = await c.env.DB.prepare(`
        SELECT 
          ts.*,
          t.title as task_title,
          t.description as task_description,
          t.reward_amount,
          t.requirements,
          t.submission_format,
          u.username,
          u.email as user_email
        FROM task_submissions ts
        LEFT JOIN tasks t ON ts.task_id = t.id
        LEFT JOIN users u ON ts.user_id = u.id
        WHERE ts.id = ?
      `).bind(submissionId).first();
    }

    if (!submission) {
      return c.json(createErrorResponse(404, '提交记录不存在'), 404);
    }

    let result;
    if (submissionType === 'workflow_submission') {
      result = {
        ...submission,
        submission_type: 'workflow_submission',
        user_id: (submission as any).creator_id,
        content: (submission as any).description
      };
    } else {
      result = {
        ...submission,
        submission_type: 'task_submission',
        attachments: (submission as any).attachment_urls ? JSON.parse((submission as any).attachment_urls) : []
      };
    }

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get admin task submission detail error:', error);
    return c.json(createErrorResponse(500, '获取提交详情失败'), 500);
  }
});

// 审核任务提交
app.put('/api/admin/task-submissions/:id/review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const submissionId = parseInt(c.req.param('id'));
    const submissionType = c.req.query('type') || 'task_submission';
    
    if (isNaN(submissionId)) {
      return c.json(createErrorResponse(400, '无效的提交ID'), 400);
    }

    const admin = c.get('user');
    const body = await c.req.json();
    const { status, admin_feedback } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }

    let submission;
    let userId;
    
    if (submissionType === 'workflow_submission') {
      // 获取coze_workflows提交详情
      submission = await c.env.DB.prepare(`
        SELECT cw.*, t.reward_amount, t.title as task_title
        FROM coze_workflows cw
        LEFT JOIN tasks t ON cw.task_id = t.id
        WHERE cw.id = ?
      `).bind(submissionId).first();
      userId = (submission as any)?.creator_id;
    } else {
      // 获取task_submissions提交详情
      submission = await c.env.DB.prepare(`
        SELECT ts.*, t.reward_amount, t.title as task_title
        FROM task_submissions ts
        LEFT JOIN tasks t ON ts.task_id = t.id
        WHERE ts.id = ?
      `).bind(submissionId).first();
      userId = (submission as any)?.user_id;
    }

    if (!submission) {
      return c.json(createErrorResponse(404, '提交记录不存在'), 404);
    }

    if ((submission as any).status !== 'pending') {
      return c.json(createErrorResponse(400, '该提交已被审核'), 400);
    }

    // 更新提交状态
    if (submissionType === 'workflow_submission') {
      await c.env.DB.prepare(`
        UPDATE coze_workflows SET
          status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, admin_feedback || '', admin.id, submissionId).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE task_submissions SET
          status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, admin_feedback || '', admin.id, submissionId).run();
    }

    // 如果审核通过，给用户发放奖励
    if (status === 'approved' && (submission as any).reward_amount > 0 && userId) {
      await c.env.DB.prepare(`
        UPDATE users SET 
          balance = balance + ?, 
          total_earnings = total_earnings + ?
        WHERE id = ?
      `).bind(
        (submission as any).reward_amount,
        (submission as any).reward_amount,
        userId
      ).run();
    }

    return c.json(createSuccessResponse({ 
      message: status === 'approved' ? '审核通过，奖励已发放' : '审核完成'
    }));
  } catch (error) {
    console.error('Review task submission error:', error);
    return c.json(createErrorResponse(500, '审核提交失败'), 500);
  }
});

// 审核通过并发放奖励的综合API
app.post('/api/admin/submissions/approve-with-rewards', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { submission_id, workflow_id, user_id, reward_amount, comment } = body;

    if (!submission_id || !user_id) {
      return c.json(createErrorResponse(400, '缺少必要参数'), 400);
    }

    // 首先尝试从task_submissions表获取task_id
    let submissionResult = await c.env.DB.prepare(`
      SELECT task_id FROM task_submissions WHERE id = ?
    `).bind(submission_id).first();
    
    let task_id = null;
    
    if (submissionResult) {
      // 如果在task_submissions表中找到了记录
      task_id = submissionResult.task_id;
    } else {
      // 如果在task_submissions表中没找到，尝试从coze_workflows表获取task_id
      const workflowResult = await c.env.DB.prepare(`
        SELECT task_id FROM coze_workflows WHERE id = ?
      `).bind(submission_id).first();
      
      if (workflowResult && workflowResult.task_id) {
        task_id = workflowResult.task_id;
      } else {
        return c.json(createErrorResponse(404, '提交记录不存在'), 404);
      }
    }

    // 开始事务处理
    const now = new Date().toISOString();
    
    try {
      // 1. task_claims状态保持不变（已经是claimed状态）
      // 只更新updated_at时间戳
      await c.env.DB.prepare(`
        UPDATE task_claims SET 
          updated_at = ?
        WHERE task_id = ? AND user_id = ?
      `).bind(now, task_id, user_id).run();

      // 2. 更新tasks表状态为completed
      await c.env.DB.prepare(`
        UPDATE tasks SET 
          status = 'completed',
          updated_at = ?
        WHERE id = ?
      `).bind(now, task_id).run();

      // 3. 更新coze_workflows状态为online
      if (workflow_id) {
        await c.env.DB.prepare(`
          UPDATE coze_workflows SET 
            status = 'online', 
            updated_at = ?
          WHERE id = ?
        `).bind(now, workflow_id).run();
      }

      // 4. 更新用户余额
      if (reward_amount > 0) {
        await c.env.DB.prepare(`
          UPDATE users SET 
            balance = balance + ?, 
            total_earnings = total_earnings + ?
          WHERE id = ?
        `).bind(reward_amount, reward_amount, user_id).run();

        // 5. 添加交易记录
        await c.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, workflow_id, type, transaction_type, amount, status, description, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user_id, 
          null, // workflow_id设置为null，因为这是佣金交易，不关联workflows表
          'commission',
          'commission', // transaction_type字段也设置为commission
          reward_amount, 
          'completed',
          comment || '任务审核通过，佣金奖励', 
          now
        ).run();
      }

      // 6. 获取用户最新余额
      const userResult = await c.env.DB.prepare(`
        SELECT balance FROM users WHERE id = ?
      `).bind(user_id).first();

      const newBalance = (userResult as any)?.balance || 0;

      return c.json(createSuccessResponse({
        success: true,
        message: '审核通过，奖励已发放',
        transaction_id: null, // 可以从上面的插入操作获取
        new_balance: newBalance
      }));
    } catch (dbError) {
      console.error('Database transaction error:', dbError);
      console.error('Error details:', {
        submission_id,
        workflow_id,
        user_id,
        reward_amount,
        task_id,
        error: dbError
      });
      return c.json(createErrorResponse(500, '数据库操作失败: ' + (dbError as any)?.message || 'Unknown error'), 500);
    }
  } catch (error) {
    console.error('Approve submission with rewards error:', error);
    return c.json(createErrorResponse(500, '审核处理失败'), 500);
  }
});

// 批量审核任务提交
app.put('/api/admin/task-submissions/batch-review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const body = await c.req.json();
    const { submission_ids, status, admin_feedback } = body;

    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      return c.json(createErrorResponse(400, '请选择要审核的提交'), 400);
    }

    if (!['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const submissionId of submission_ids) {
      try {
        // 获取提交详情
        const submission = await c.env.DB.prepare(`
          SELECT ts.*, t.reward_amount
          FROM task_submissions ts
          LEFT JOIN tasks t ON ts.task_id = t.id
          WHERE ts.id = ? AND ts.status = 'pending'
        `).bind(submissionId).first();

        if (!submission) {
          errorCount++;
          continue;
        }

        // 更新提交状态
        await c.env.DB.prepare(`
          UPDATE task_submissions SET
            status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(status, admin_feedback || '', admin.id, submissionId).run();

        // 如果审核通过，给用户发放奖励
        if (status === 'approved' && (submission as any).reward_amount > 0) {
          await c.env.DB.prepare(`
            UPDATE users SET 
              balance = balance + ?, 
              total_earnings = total_earnings + ?
            WHERE id = ?
          `).bind(
            (submission as any).reward_amount,
            (submission as any).reward_amount,
            (submission as any).user_id
          ).run();
        }

        successCount++;
      } catch (error) {
        console.error(`批量审核提交 ${submissionId} 失败:`, error);
        errorCount++;
      }
    }

    return c.json(createSuccessResponse({
      message: `批量审核完成，成功 ${successCount} 个，失败 ${errorCount} 个`,
      success_count: successCount,
      error_count: errorCount
    }));
  } catch (error) {
    console.error('Batch review task submissions error:', error);
    return c.json(createErrorResponse(500, '批量审核失败'), 500);
  }
});

// ==================== 佣金管理相关API ====================

// 获取佣金记录列表（用于进度查看）
app.get('/api/admin/commission/records', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const search = c.req.query('search') || '';
    const status = c.req.query('status');
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 'WHERE 1=1';
    let params = [];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all') {
      whereClause += ' AND cr.status = ?';
      params.push(status);
    }
    
    // 获取佣金记录列表
    const recordsQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const records = await c.env.DB.prepare(recordsQuery)
      .bind(...params, pageSize, offset)
      .all();
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await c.env.DB.prepare(countQuery)
      .bind(...params)
      .first();
    
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    return c.json(createSuccessResponse({
      items: records.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error('Get commission records error:', error);
    return c.json(createErrorResponse(500, '获取佣金记录失败'), 500);
  }
});

// 获取佣金记录详情（包括每日记录）
app.get('/api/admin/commission/records/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param('id'));
    
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, '无效的记录ID'), 400);
    }
    
    // 获取佣金记录基本信息
    const recordQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      WHERE cr.id = ?
    `;
    
    const record = await c.env.DB.prepare(recordQuery)
      .bind(recordId)
      .first();
    
    if (!record) {
      return c.json(createErrorResponse(404, '佣金记录不存在'), 404);
    }
    
    // 获取每日记录
    const dailyRecordsQuery = `
      SELECT 
        id,
        commission_record_id,
        day_number,
        wh_coins_amount as rmb_amount,
        reason,
        scheduled_date,
        actual_date,
        transaction_id,
        status
      FROM commission_daily_records
      WHERE commission_record_id = ?
      ORDER BY day_number ASC
    `;
    
    const dailyRecords = await c.env.DB.prepare(dailyRecordsQuery)
      .bind(recordId)
      .all();
    
    const result = {
      ...record,
      daily_records: dailyRecords.results
    };
    
    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get commission record detail error:', error);
    return c.json(createErrorResponse(500, '获取佣金记录详情失败'), 500);
  }
});

// 获取可编辑的佣金记录列表
app.get('/api/admin/commission/editable-records', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const search = c.req.query('search') || '';
    const status = c.req.query('status');
    const offset = (page - 1) * pageSize;

    // 构建查询条件 - 只显示可编辑的记录（pending和in_progress状态）
    let whereClause = "WHERE cr.status IN ('pending', 'in_progress')";
    let params = [];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all' && status !== 'editable') {
      whereClause += ' AND cr.status = ?';
      params.push(status);
    }
    
    // 获取可编辑的佣金记录列表
    const recordsQuery = `
      SELECT 
        cr.id,
        cr.user_id,
        u.username,
        u.email,
        cr.admin_id,
        admin.username as admin_username,
        cr.total_wh_coins as total_rmb_amount,
        cr.days,
        cr.status,
        cr.created_at,
        cr.completed_at
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      LEFT JOIN users admin ON cr.admin_id = admin.id
      ${whereClause}
      ORDER BY cr.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const records = await c.env.DB.prepare(recordsQuery)
      .bind(...params, pageSize, offset)
      .all();
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_records cr
      JOIN users u ON cr.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await c.env.DB.prepare(countQuery)
      .bind(...params)
      .first();
    
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    return c.json(createSuccessResponse({
      items: records.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error('Get editable commission records error:', error);
    return c.json(createErrorResponse(500, '获取可编辑佣金记录失败'), 500);
  }
});

// 更新佣金记录
app.put('/api/admin/commission/records/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { total_rmb_amount, days, daily_records } = body;
    const admin = c.get('user');
    
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, '无效的记录ID'), 400);
    }
    
    // 检查记录是否存在且可编辑
    const existingRecord = await c.env.DB.prepare(`
      SELECT * FROM commission_records 
      WHERE id = ? AND status IN ('pending', 'in_progress')
    `).bind(recordId).first();
    
    if (!existingRecord) {
      return c.json(createErrorResponse(404, '佣金记录不存在或不可编辑'), 404);
    }
    
    // 更新佣金记录基本信息
    await c.env.DB.prepare(`
      UPDATE commission_records 
      SET total_wh_coins = ?, days = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(total_rmb_amount, days, recordId).run();
    
    // 如果提供了每日记录，更新每日记录
    if (daily_records && Array.isArray(daily_records)) {
      for (const dailyRecord of daily_records) {
        await c.env.DB.prepare(`
          UPDATE commission_daily_records 
          SET wh_coins_amount = ?, reason = ?, scheduled_date = ?
          WHERE id = ? AND commission_record_id = ? AND status = 'pending'
        `).bind(
          dailyRecord.rmb_amount,
          dailyRecord.reason,
          dailyRecord.scheduled_date,
          dailyRecord.id,
          recordId
        ).run();
      }
    }
    
    // 记录管理员操作日志
    try {
      await c.env.DB.prepare(`
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES (?, 'update_commission_record', 'commission_record', ?, ?)
      `).bind(
        admin.id,
        recordId,
        `修改佣金记录: 总金额${total_rmb_amount}元，天数${days}天`
      ).run();
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
    }
    
    return c.json(createSuccessResponse({ message: '佣金记录更新成功' }));
  } catch (error) {
    console.error('Update commission record error:', error);
    return c.json(createErrorResponse(500, '更新佣金记录失败'), 500);
  }
});

// 取消佣金记录
app.put('/api/admin/commission/records/:id/cancel', authMiddleware, adminMiddleware, async (c) => {
  try {
    const recordId = parseInt(c.req.param('id'));
    const admin = c.get('user');
    
    if (isNaN(recordId)) {
      return c.json(createErrorResponse(400, '无效的记录ID'), 400);
    }
    
    // 检查记录是否存在且可取消
    const existingRecord = await c.env.DB.prepare(`
      SELECT * FROM commission_records 
      WHERE id = ? AND status IN ('pending', 'in_progress')
    `).bind(recordId).first();
    
    if (!existingRecord) {
      return c.json(createErrorResponse(404, '佣金记录不存在或不可取消'), 404);
    }
    
    // 更新佣金记录状态为已取消
    await c.env.DB.prepare(`
      UPDATE commission_records 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(recordId).run();
    
    // 取消所有未发放的每日记录
    await c.env.DB.prepare(`
      UPDATE commission_daily_records 
      SET status = 'cancelled'
      WHERE commission_record_id = ? AND status = 'pending'
    `).bind(recordId).run();
    
    // 记录管理员操作日志
    try {
      await c.env.DB.prepare(`
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
        VALUES (?, 'cancel_commission_record', 'commission_record', ?, ?)
      `).bind(
        admin.id,
        recordId,
        `取消佣金记录: 总金额${existingRecord.total_wh_coins}元`
      ).run();
    } catch (logError) {
      console.error('Failed to add admin log:', logError);
    }
    
    return c.json(createSuccessResponse({ message: '佣金记录已取消' }));
  } catch (error) {
    console.error('Cancel commission record error:', error);
    return c.json(createErrorResponse(500, '取消佣金记录失败'), 500);
  }
});

// 获取创作者佣金用户列表
app.get('/api/admin/commission/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || 'creator'; // 默认只显示创作者
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    let whereClause = 'WHERE u.role = ?';
    let params = [role];
    
    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // 获取用户列表及其作品统计
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.role,
        u.status,
        u.total_earnings,
        u.created_at,
        'pending' as earnings_status,
        0 as workflow_count,
        0 as ai_app_count
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const users = await c.env.DB.prepare(usersQuery)
      .bind(...params, pageSize, offset)
      .all();
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const totalResult = await c.env.DB.prepare(countQuery)
      .bind(...params) // 使用相同的查询参数，不包含LIMIT和OFFSET
      .first();
    
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    return c.json(createSuccessResponse({
      items: users.results,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error('Get commission users error:', error);
    return c.json(createErrorResponse(500, '获取佣金用户列表失败'), 500);
  }
});

// 获取佣金统计数据
app.get('/api/admin/commission/stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    // 获取统计数据
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'active') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'creator' AND status = 'active') as total_creators,
        0 as total_workflows
    `;
    
    const stats = await c.env.DB.prepare(statsQuery).first();
    
    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error('Get commission stats error:', error);
    return c.json(createErrorResponse(500, '获取佣金统计失败'), 500);
  }
});

// ==================== 初始佣金管理系统 API ====================

// 获取初始佣金计划列表
app.get('/api/admin/initial-commission/plans', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const status = c.req.query('status');

    const db = new D1Database(c.env);
    const result = await db.getInitialCommissionPlans({ page, pageSize, status });

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get initial commission plans error:', error);
    return c.json(createErrorResponse(500, '获取佣金计划列表失败'), 500);
  }
});

// 创建初始佣金计划
app.post('/api/admin/initial-commission/plans', authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    const {
      name,
      description,
      trigger_type,
      amount_type,
      amount_value,
      max_amount,
      valid_days,
      max_uses_per_user,
      total_budget,
      status,
      workflow_threshold,
      auto_trigger
    } = body;

    // 验证必填字段
    if (!name || !trigger_type || !amount_type || amount_value === undefined) {
      return c.json(createErrorResponse(400, '缺少必填字段'), 400);
    }

    const db = new D1Database(c.env);
    const plan = await db.createInitialCommissionPlan({
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
      trigger_type,
      amount_type,
      amount_value: parseFloat(amount_value),
      max_amount: max_amount ? parseFloat(max_amount) : undefined,
      valid_days: valid_days ? parseInt(valid_days) : undefined,
      max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : undefined,
      total_budget: total_budget ? parseFloat(total_budget) : undefined,
      status: status || 'active',
      workflow_threshold: workflow_threshold ? parseInt(workflow_threshold) : undefined,
      auto_trigger: auto_trigger || false,
      created_by: user.id
    });

    return c.json(createSuccessResponse(plan));
  } catch (error) {
    console.error('Create initial commission plan error:', error);
    return c.json(createErrorResponse(500, '创建佣金计划失败'), 500);
  }
});

// 更新初始佣金计划
app.put('/api/admin/initial-commission/plans/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const planId = parseInt(c.req.param('id'));
    const body = await c.req.json();

    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, '无效的计划ID'), 400);
    }

    const updates: any = { updated_by: user.id };
    
    // 只更新提供的字段，映射前端字段名到数据库字段名
    if (body.name !== undefined) updates.name = sanitizeInput(body.name);
    if (body.description !== undefined) updates.description = sanitizeInput(body.description);
    if (body.fixed_amount !== undefined) updates.fixed_amount = parseFloat(body.fixed_amount);
    // 处理前端发送的amount_value字段，映射到数据库的fixed_amount字段
    if (body.amount_value !== undefined) updates.fixed_amount = parseFloat(body.amount_value);
    if (body.payout_cycle !== undefined) updates.payout_cycle = parseInt(body.payout_cycle);
    if (body.trigger_type !== undefined) updates.trigger_type = body.trigger_type;
    if (body.workflow_threshold !== undefined) updates.workflow_threshold = parseInt(body.workflow_threshold);
    if (body.auto_trigger !== undefined) updates.auto_trigger = body.auto_trigger;
    if (body.target_user_type !== undefined) updates.target_user_type = body.target_user_type;
    if (body.status !== undefined) {
      // 将前端的status转换为数据库的is_active字段
      updates.is_active = body.status === 'active';
    }

    const db = new D1Database(c.env);
    const plan = await db.updateInitialCommissionPlan(planId, updates);

    return c.json(createSuccessResponse(plan));
  } catch (error) {
    console.error('Update initial commission plan error:', error);
    return c.json(createErrorResponse(500, '更新佣金计划失败'), 500);
  }
});

// 获取单个初始佣金计划
app.get('/api/admin/initial-commission/plans/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const planId = parseInt(c.req.param('id'));

    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, '无效的计划ID'), 400);
    }

    const db = new D1Database(c.env);
    const plan = await db.getInitialCommissionPlan(planId);

    if (plan) {
      return c.json(createSuccessResponse(plan));
    } else {
      return c.json(createErrorResponse(404, '计划不存在'), 404);
    }
  } catch (error) {
    console.error('Get initial commission plan error:', error);
    return c.json(createErrorResponse(500, '获取佣金计划失败'), 500);
  }
});

// 删除初始佣金计划
app.delete('/api/admin/initial-commission/plans/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const planId = parseInt(c.req.param('id'));

    if (isNaN(planId)) {
      return c.json(createErrorResponse(400, '无效的计划ID'), 400);
    }

    const db = new D1Database(c.env);
    const success = await db.deleteInitialCommissionPlan(planId, user.id);

    if (success) {
      return c.json(createSuccessResponse({ message: '删除成功' }));
    } else {
      return c.json(createErrorResponse(404, '计划不存在或删除失败'), 404);
    }
  } catch (error) {
    console.error('Delete initial commission plan error:', error);
    return c.json(createErrorResponse(500, '删除佣金计划失败'), 500);
  }
});

// 获取用户佣金配置列表
app.get('/api/admin/initial-commission/users', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const planId = c.req.query('planId') ? parseInt(c.req.query('planId')!) : undefined;

    const db = new D1Database(c.env);
    const result = await db.getUserInitialCommissionConfigs({ 
      page, 
      pageSize, 
      search, 
      status, 
      planId 
    });

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get user commission configs error:', error);
    return c.json(createErrorResponse(500, '获取用户佣金配置失败'), 500);
  }
});

// 获取用户佣金配置及发放进度列表
app.get('/api/admin/initial-commission/users-with-payouts', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const search = c.req.query('search');
    const status = c.req.query('status');
    const planId = c.req.query('planId') ? parseInt(c.req.query('planId')!) : undefined;

    const db = new D1Database(c.env);
    const result = await db.getUserInitialCommissionWithPayouts({ 
      page, 
      pageSize, 
      search, 
      status, 
      planId 
    });

    return c.json(createSuccessResponse(result));
  } catch (error) {
    console.error('Get user commission configs with payouts error:', error);
    return c.json(createErrorResponse(500, '获取用户佣金配置及发放进度失败'), 500);
  }
});

// 更新用户佣金状态
app.put('/api/admin/initial-commission/users/:userId/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const userId = parseInt(c.req.param('userId'));
    const body = await c.req.json();
    const { is_active } = body;

    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    // 接受数字类型（0或1）并转换为布尔值
    let isActiveBoolean: boolean;
    if (typeof is_active === 'number') {
      if (is_active === 0) {
        isActiveBoolean = false;
      } else if (is_active === 1) {
        isActiveBoolean = true;
      } else {
        return c.json(createErrorResponse(400, '无效的is_active值，必须是0或1'), 400);
      }
    } else if (typeof is_active === 'boolean') {
      isActiveBoolean = is_active;
    } else {
      return c.json(createErrorResponse(400, '无效的is_active值，必须是数字（0或1）或布尔类型'), 400);
    }

    const db = new D1Database(c.env);
    const success = await db.updateUserCommissionStatus(userId, isActiveBoolean, admin.id);

    if (success) {
      // 获取更新后的用户佣金配置信息
      const userConfig = await c.env.DB.prepare(
        'SELECT is_active FROM user_initial_commission_configs WHERE user_id = ?'
      ).bind(userId).first();
      
      if (userConfig) {
        return c.json(createSuccessResponse({ 
          message: '更新成功',
          user: {
            id: userId,
            is_active: userConfig.is_active
          }
        }));
      } else {
        return c.json(createErrorResponse(404, '用户佣金配置不存在'), 404);
      }
    } else {
      return c.json(createErrorResponse(500, '更新失败'), 500);
    }
  } catch (error) {
    console.error('Update user commission status error:', error);
    return c.json(createErrorResponse(500, '更新用户佣金状态失败'), 500);
  }
});

// 获取用户符合条件的初始佣金计划
app.get('/api/admin/initial-commission/users/:userId/eligible-plans', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));

    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }

    const db = new D1Database(c.env);
    const eligiblePlans = await db.getEligibleCommissionPlansForUser(userId);

    return c.json(createSuccessResponse(eligiblePlans));
  } catch (error) {
    console.error('Get eligible commission plans error:', error);
    return c.json(createErrorResponse(500, '获取用户符合条件的计划失败'), 500);
  }
});

// 获取初始佣金统计数据
app.get('/api/admin/initial-commission/stats', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = new D1Database(c.env);
    const stats = await db.getCommissionStats();

    return c.json(createSuccessResponse(stats));
  } catch (error) {
    console.error('Get initial commission stats error:', error);
    return c.json(createErrorResponse(500, '获取佣金统计数据失败'), 500);
  }
});

// 为用户分配佣金计划
app.post('/api/admin/initial-commission/plans/:planId/assign', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const planId = parseInt(c.req.param('planId'));
    const body = await c.req.json();
    const { userId } = body;

    if (isNaN(planId) || isNaN(userId)) {
      return c.json(createErrorResponse(400, '无效的计划ID或用户ID'), 400);
    }

    const db = new D1Database(c.env);
    const success = await db.assignCommissionPlanToUser(planId, userId, admin.id);

    if (success) {
      return c.json(createSuccessResponse({ message: '分配成功' }));
    } else {
      return c.json(createErrorResponse(400, '用户已分配该计划或分配失败'), 400);
    }
  } catch (error) {
    console.error('Assign commission plan error:', error);
    return c.json(createErrorResponse(500, '分配佣金计划失败'), 500);
  }
});

// 移除用户的佣金计划
app.delete('/api/admin/initial-commission/plans/:planId/users/:userId', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const planId = parseInt(c.req.param('planId'));
    const userId = parseInt(c.req.param('userId'));

    if (isNaN(planId) || isNaN(userId)) {
      return c.json(createErrorResponse(400, '无效的计划ID或用户ID'), 400);
    }

    const db = new D1Database(c.env);
    const success = await db.removeCommissionPlanFromUser(planId, userId, admin.id);

    if (success) {
      return c.json(createSuccessResponse({ message: '移除成功' }));
    } else {
      return c.json(createErrorResponse(404, '分配关系不存在或移除失败'), 404);
    }
  } catch (error) {
    console.error('Remove commission plan error:', error);
    return c.json(createErrorResponse(500, '移除佣金计划失败'), 500);
  }
});

// 获取初始佣金发放记录
app.get('/api/admin/initial-commission/payouts', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const userId = c.req.query('userId') ? parseInt(c.req.query('userId')!) : undefined;
    const status = c.req.query('status');
    const payoutType = c.req.query('payoutType');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    const offset = (page - 1) * pageSize;
    let whereConditions = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`p.user_id = ?${paramIndex++}`);
      params.push(userId);
    }

    if (status) {
      whereConditions.push(`p.status = ?${paramIndex++}`);
      params.push(status);
    }

    if (payoutType) {
      whereConditions.push(`p.payout_type = ?${paramIndex++}`);
      params.push(payoutType);
    }

    if (startDate) {
      whereConditions.push(`DATE(p.created_at) >= ?${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`DATE(p.created_at) <= ?${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM initial_commission_payouts p
      LEFT JOIN users u ON p.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // 获取分页数据
    const dataQuery = `
      SELECT 
        p.*,
        u.username,
        u.email,
        plan.name as plan_name,
        config.fixed_amount as config_amount,
        config.payout_cycle
      FROM initial_commission_payouts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN initial_commission_plans plan ON p.plan_id = plan.id
      LEFT JOIN user_initial_commission_configs config ON p.config_id = config.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ?${paramIndex++} OFFSET ?${paramIndex++}
    `;
    
    params.push(pageSize, offset);
    const payouts = await c.env.DB.prepare(dataQuery).bind(...params).all();

    return c.json(createSuccessResponse({
      items: payouts.results || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }));
  } catch (error) {
    console.error('Get initial commission payouts error:', error);
    return c.json(createErrorResponse(500, '获取佣金发放记录失败'), 500);
  }
});

// 手动发放佣金
app.post('/api/admin/initial-commission/manual-payout', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const body = await c.req.json();
    const { userId, amount, reason } = body;

    if (!userId || !amount || amount <= 0) {
      return c.json(createErrorResponse(400, '无效的用户ID或金额'), 400);
    }

    // 获取用户佣金配置
    const configQuery = `
      SELECT * FROM user_initial_commission_configs 
      WHERE user_id = ?1 AND is_active = TRUE
    `;
    
    const config = await c.env.DB.prepare(configQuery).bind(userId).first();
    
    if (!config) {
      return c.json(createErrorResponse(404, '用户佣金配置不存在或未激活'), 404);
    }

    // 创建发放记录
    const payoutQuery = `
      INSERT INTO initial_commission_payouts (
        user_id, config_id, plan_id, amount, payout_type, 
        trigger_reason, scheduled_date, status, created_at, updated_at, processed_by
      ) VALUES (?1, ?2, ?3, ?4, 'manual', ?5, DATE('now'), 'pending', DATETIME('now'), DATETIME('now'), ?6)
    `;
    
    const result = await c.env.DB.prepare(payoutQuery).bind(
      userId,
      config.id,
      config.plan_id,
      amount,
      reason || '管理员手动发放',
      admin.id
    ).run();

    if (result.success) {
      // 记录操作日志
      const logQuery = `
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, user_id, operator_id,
          operation_data, description, created_at
        ) VALUES (
          'manual_payout', 'payout', ?1, ?2, ?3, ?4, ?5, DATETIME('now')
        )
      `;
      
      await c.env.DB.prepare(logQuery).bind(
        result.meta.last_row_id,
        userId,
        admin.id,
        JSON.stringify({ amount, reason }),
        `管理员手动发放佣金: ${amount}元`
      ).run();

      return c.json(createSuccessResponse({ 
        id: result.meta.last_row_id,
        message: '佣金发放记录创建成功' 
      }));
    } else {
      return c.json(createErrorResponse(500, '创建发放记录失败'), 500);
    }
  } catch (error) {
    console.error('Manual payout error:', error);
    return c.json(createErrorResponse(500, '手动发放佣金失败'), 500);
  }
});

// 批量发放佣金
app.post('/api/admin/initial-commission/batch-payout', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const body = await c.req.json();
    const { userIds, amount, reason } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !amount || amount <= 0) {
      return c.json(createErrorResponse(400, '无效的用户列表或金额'), 400);
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        // 获取用户佣金配置
        const configQuery = `
          SELECT * FROM user_initial_commission_configs 
          WHERE user_id = ?1 AND is_active = TRUE
        `;
        
        const config = await c.env.DB.prepare(configQuery).bind(userId).first();
        
        if (!config) {
          errors.push({ userId, error: '用户佣金配置不存在或未激活' });
          continue;
        }

        // 创建发放记录
        const payoutQuery = `
          INSERT INTO initial_commission_payouts (
            user_id, config_id, plan_id, amount, payout_type, 
            trigger_reason, scheduled_date, status, created_at, updated_at, processed_by
          ) VALUES (?1, ?2, ?3, ?4, 'manual', ?5, DATE('now'), 'pending', DATETIME('now', '+8 hours'), DATETIME('now', '+8 hours'), ?6)
        `;
        
        const result = await c.env.DB.prepare(payoutQuery).bind(
          userId,
          config.id,
          config.plan_id,
          amount,
          reason || '管理员批量发放',
          admin.id
        ).run();

        if (result.success) {
          results.push({ userId, payoutId: result.meta.last_row_id });
          
          // 记录操作日志
          const logQuery = `
            INSERT INTO initial_commission_operation_logs (
              operation_type, target_type, target_id, user_id, operator_id,
              operation_data, description, created_at
            ) VALUES (
              'batch_payout', 'payout', ?1, ?2, ?3, ?4, ?5, DATETIME('now')
            )
          `;
          
          await c.env.DB.prepare(logQuery).bind(
            result.meta.last_row_id,
            userId,
            admin.id,
            JSON.stringify({ amount, reason }),
            `管理员批量发放佣金: ${amount}元`
          ).run();
        } else {
          errors.push({ userId, error: '创建发放记录失败' });
        }
      } catch (error) {
        errors.push({ userId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return c.json(createSuccessResponse({
      success: results,
      errors,
      message: `批量发放完成，成功: ${results.length}，失败: ${errors.length}`
    }));
  } catch (error) {
    console.error('Batch payout error:', error);
    return c.json(createErrorResponse(500, '批量发放佣金失败'), 500);
  }
});

// 更新发放记录状态
app.put('/api/admin/initial-commission/payouts/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const admin = c.get('user');
    const payoutId = parseInt(c.req.param('id'));
    const body = await c.req.json();
    const { status, failureReason, transactionId } = body;

    if (isNaN(payoutId)) {
      return c.json(createErrorResponse(400, '无效的发放记录ID'), 400);
    }

    if (!status || !['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的状态值'), 400);
    }

    let updateFields = ['status = ?1', 'updated_at = DATETIME(\'now\')'];
    let params = [status];
    let paramIndex = 2;

    if (status === 'completed') {
      updateFields.push(`actual_payout_date = DATE('now')`);
      if (transactionId) {
        updateFields.push(`transaction_id = ?${paramIndex++}`);
        params.push(transactionId);
      }
    }

    if (status === 'failed' && failureReason) {
      updateFields.push(`failure_reason = ?${paramIndex++}`);
      params.push(failureReason);
    }

    const updateQuery = `
      UPDATE initial_commission_payouts 
      SET ${updateFields.join(', ')}
      WHERE id = ?${paramIndex++}
    `;
    
    params.push(payoutId);
    const result = await c.env.DB.prepare(updateQuery).bind(...params).run();

    if (result.success && result.changes > 0) {
      // 记录操作日志
      const logQuery = `
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, operator_id,
          operation_data, description, created_at
        ) VALUES (
          'update_payout_status', 'payout', ?1, ?2, ?3, ?4, DATETIME('now')
        )
      `;
      
      await c.env.DB.prepare(logQuery).bind(
        payoutId,
        admin.id,
        JSON.stringify({ status, failureReason, transactionId }),
        `更新发放记录状态: ${status}`
      ).run();

      return c.json(createSuccessResponse({ message: '状态更新成功' }));
    } else {
      return c.json(createErrorResponse(404, '发放记录不存在或更新失败'), 404);
    }
  } catch (error) {
    console.error('Update payout status error:', error);
    return c.json(createErrorResponse(500, '更新发放记录状态失败'), 500);
  }
});

// ==================== 初始佣金管理系统 API 结束 ====================

// 获取创作者收益记录
app.get('/api/creator/earnings-history', authMiddleware, creatorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // 获取创作者的已发放佣金记录（只显示completed状态的记录）
    const earningsQuery = `
      SELECT 
        cdr.id,
        cdr.commission_record_id,
        cdr.day_number,
        cdr.wh_coins_amount as rmb_amount,
        cdr.reason,
        cdr.scheduled_date,
        cdr.actual_date,
        cdr.transaction_id,
        cdr.status,
        cdr.created_at,
        cdr.completed_at,
        cr.total_wh_coins as total_commission
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cr.user_id = ? AND cdr.status = 'completed'
      ORDER BY cdr.actual_date DESC, cdr.day_number ASC
      LIMIT ? OFFSET ?
    `;
    
    const earnings = await c.env.DB.prepare(earningsQuery)
      .bind(user.id, pageSize, offset)
      .all();
    
    // 获取已发放记录的总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM commission_daily_records cdr
      JOIN commission_records cr ON cdr.commission_record_id = cr.id
      WHERE cr.user_id = ? AND cdr.status = 'completed'
    `;
    const totalResult = await c.env.DB.prepare(countQuery)
      .bind(user.id)
      .first();
    
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    // 格式化金额为两位小数
    const formattedEarnings = (earnings.results || []).map((record: any) => ({
      ...record,
      rmb_amount: parseFloat(record.rmb_amount || 0).toFixed(2)
    }));

    return c.json(createSuccessResponse({
      items: formattedEarnings,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error('Get creator earnings history error:', error);
    return c.json(createErrorResponse(500, '获取收益记录失败'), 500);
  }
});

// 获取创作者详情（包括作品列表）
app.get('/api/admin/creators/:id/detail', authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    
    if (isNaN(userId)) {
      return c.json(createErrorResponse(400, '无效的用户ID'), 400);
    }
    
    // 工作流列表已移除 - workflows表不再使用
    let workflows = { results: [] };
    
    // AI应用相关数据已移除，跳过相关查询操作
    
    // 处理工作流数据
    const processedWorkflows = workflows.results?.map((w: any) => ({
      ...w,
      cover_image_url: w.preview_images ? JSON.parse(w.preview_images)[0] : null
    })) || [];
    
    return c.json(createSuccessResponse({
      workflows: processedWorkflows
      // ai_apps removed as ai_apps table no longer exists
    }));
  } catch (error) {
    console.error('Get creator detail error:', error);
    return c.json(createErrorResponse(500, '获取创作者详情失败'), 500);
  }
});

// 按天数发放佣金
app.post('/api/admin/commission/issue-by-days', authMiddleware, adminMiddleware, async (c) => {
  const admin = c.get('user');
  let user_id, total_wh_coins, days;
  
  try {
    const body = await c.req.json();
    ({ user_id, total_wh_coins, days } = body);
    
    if (!user_id || !total_wh_coins || !days) {
      return c.json(createErrorResponse(400, '缺少必要参数'), 400);
    }
    
    if (total_wh_coins <= 0 || days <= 0) {
      return c.json(createErrorResponse(400, '佣金金额和天数必须大于0'), 400);
    }
    
    // 验证用户是否存在且为创作者
    const user = await c.env.DB.prepare(`
      SELECT id, username, role FROM users WHERE id = ? AND role = 'creator'
    `).bind(user_id).first();
    
    if (!user) {
      return c.json(createErrorResponse(404, '用户不存在或不是创作者'), 404);
    }
    
    // 获取用户的作品信息用于生成理由 - workflows表已移除
    const worksQuery = `
      SELECT 
        0 as workflow_count,
        0 as total_downloads
    `;
    
    const worksStats = await c.env.DB.prepare(worksQuery)
      .first();
    
    // 创建佣金记录
    const commissionResult = await c.env.DB.prepare(`
      INSERT INTO commission_records (user_id, admin_id, total_wh_coins, days, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(user_id, admin.id, total_wh_coins, days).run();
    
    const commissionRecordId = commissionResult.meta.last_row_id;
    
    // 生成每日发放计划
    const dailySchedule = [];
    let remainingAmount = total_wh_coins;
    const today = new Date();
    
    // 先计算所有天的佣金分配
    const dailyAmounts = [];
    
    // 根据天数分阶段分配
    const phase1Days = Math.ceil(days * 0.33); // 前1/3天：递增
    const phase2Days = Math.ceil(days * 0.17); // 中间1/6天：递减
    const phase3Days = days - phase1Days - phase2Days; // 剩余天数：随机小额
    
    // 预留总金额的分配比例
    const phase1Ratio = 0.3; // 前期30%
    const phase2Ratio = 0.4; // 中期40%
    const phase3Ratio = 0.3; // 后期30%
    
    const phase1Total = total_wh_coins * phase1Ratio;
    const phase2Total = total_wh_coins * phase2Ratio;
    const phase3Total = total_wh_coins * phase3Ratio;
    
    // 第一阶段：递增分配
    for (let i = 0; i < phase1Days; i++) {
      const progress = (i + 1) / phase1Days;
      const baseAmount = phase1Total / phase1Days;
      const increment = baseAmount * progress * 0.5; // 递增幅度
      dailyAmounts.push(Math.max(0.01, Math.round((baseAmount + increment) * 100) / 100));
    }
    
    // 第二阶段：递减分配
    for (let i = 0; i < phase2Days; i++) {
      const progress = 1 - (i / phase2Days);
      const baseAmount = phase2Total / phase2Days;
      const decrement = baseAmount * progress * 0.3; // 递减幅度
      dailyAmounts.push(Math.max(0.01, Math.round((baseAmount + decrement) * 100) / 100));
    }
    
    // 第三阶段：随机小额分配
    for (let i = 0; i < phase3Days; i++) {
      const baseAmount = phase3Total / phase3Days;
      const randomFactor = 0.5 + Math.random() * 0.5; // 0.5-1.0的随机因子
      dailyAmounts.push(Math.max(0.01, Math.round((baseAmount * randomFactor) * 100) / 100));
    }
    
    // 调整总额确保精确匹配
    const currentTotal = dailyAmounts.reduce((sum, amount) => sum + amount, 0);
    const difference = total_wh_coins - currentTotal;
    if (Math.abs(difference) > 0.01) {
      // 将差额加到最后一天
      dailyAmounts[dailyAmounts.length - 1] = Math.max(0.01, Math.round((dailyAmounts[dailyAmounts.length - 1] + difference) * 100) / 100);
    }
    
    for (let day = 1; day <= days; day++) {
      const dailyAmount = dailyAmounts[day - 1];
      
      remainingAmount -= dailyAmount;
      
      // 计算发放日期
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + day - 1);
      
      // 生成发放理由
      let reason = '';
      const totalWorks = (worksStats?.workflow_count || 0) + (worksStats?.ai_app_count || 0);
      
      if (totalWorks > 30) {
        reason = '优秀创作者奖励，请继续创作精彩内容！';
      } else if (totalWorks < 10) {
        reason = '创作激励奖金，希望能激发您更多创意！';
      } else {
        reason = '您的创作才华值得鼓励，期待更多优秀作品！';
      }
      
      // 第一天直接发放，其他天设为pending
      const status = day === 1 ? 'completed' : 'pending';
      const actualDate = day === 1 ? scheduledDate.toISOString().split('T')[0] : null;
      
      // 插入每日发放记录
      await c.env.DB.prepare(`
        INSERT INTO commission_daily_records 
        (commission_record_id, day_number, wh_coins_amount, reason, scheduled_date, actual_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        commissionRecordId,
        day,
        dailyAmount,
        reason,
        scheduledDate.toISOString().split('T')[0],
        actualDate,
        status
      ).run();
      
      // 如果是第一天，更新用户余额
      if (day === 1) {
        await c.env.DB.prepare(`
          UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?
        `).bind(dailyAmount, dailyAmount, user_id).run();
      }
      
      dailySchedule.push({
        day,
        amount: dailyAmount,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        status
      });
    }
    
    // 更新佣金记录状态为进行中
    await c.env.DB.prepare(`
      UPDATE commission_records SET status = 'in_progress' WHERE id = ?
    `).bind(commissionRecordId).run();
    
    return c.json(createSuccessResponse({
      success: true,
      message: `成功创建${days}天的佣金发放计划，总计${total_wh_coins}元`,
      commission_record_id: commissionRecordId,
      daily_schedule: dailySchedule
    }));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('创建佣金发放计划失败 - 详细错误信息:', {
      error: errorMessage,
      stack: errorStack,
      user_id: user_id,
      total_wh_coins: total_wh_coins,
      days: days,
      timestamp: new Date().toISOString()
    });
    return c.json(createErrorResponse(500, `创建佣金发放计划失败: ${errorMessage}`), 500);
  }
});

// 管理员提现管理API
app.get('/api/admin/withdrawal-requests', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '10');
    const status = c.req.query('status');
    const user_id = c.req.query('user_id');
    const min_amount = c.req.query('min_amount');
    const max_amount = c.req.query('max_amount');
    
    const offset = (page - 1) * pageSize;
    
    // 构建查询条件
    let whereConditions = [];
    let params = [];
    
    if (status && status !== 'all') {
      whereConditions.push('w.status = ?');
      params.push(status);
    }
    
    if (user_id) {
      whereConditions.push('w.user_id = ?');
      params.push(parseInt(user_id));
    }
    
    if (min_amount) {
      whereConditions.push('w.amount >= ?');
      params.push(parseFloat(min_amount));
    }
    
    if (max_amount) {
      whereConditions.push('w.amount <= ?');
      params.push(parseFloat(max_amount));
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // 查询提现请求列表
    const query = `
      SELECT 
        w.*,
        u.username,
        u.email,
        u.role,
        u.total_earnings,
        u.wh_coins,
        u.status as user_status
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const result = await c.env.DB.prepare(query)
      .bind(...params, pageSize, offset)
      .all();
    
    // 查询总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM withdrawals w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await c.env.DB.prepare(countQuery)
      .bind(...params)
      .first();
    
    const total = (countResult as any)?.total || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    // 格式化数据
    const withdrawalRequests = (result.results || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        role: row.role,
        total_earnings: row.total_earnings,
        wh_coins: row.wh_coins,
        status: row.user_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      amount: row.amount,
      wechat_account: row.wechat_account,
      payment_method: row.payment_method,
      status: row.status,
      batch_id: row.batch_id,
      transfer_id: row.transfer_id,
      failure_reason: row.failure_reason,
      processed_at: row.processed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reviewed_at: row.processed_at,
      admin_comment: row.failure_reason
    }));
    
    return c.json(createSuccessResponse({
      items: withdrawalRequests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    }));
  } catch (error) {
    console.error('获取提现请求失败:', error);
    return c.json(createErrorResponse(500, '获取提现请求失败'), 500);
  }
});

app.put('/api/admin/withdrawal-requests/:id/review', authMiddleware, adminMiddleware, async (c) => {
  try {
    const withdrawalId = c.req.param('id');
    const { status, admin_comment } = await c.req.json();
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的审核状态'), 400);
    }
    
    if (status === 'rejected' && !admin_comment) {
      return c.json(createErrorResponse(400, '拒绝提现时必须填写审核意见'), 400);
    }
    
    // 查询提现记录
    const withdrawal = await c.env.DB.prepare(`
      SELECT * FROM withdrawals WHERE id = ?
    `).bind(withdrawalId).first();
    
    if (!withdrawal) {
      return c.json(createErrorResponse(404, '提现记录不存在'), 404);
    }
    
    const withdrawalData = withdrawal as any;
    
    if (withdrawalData.status !== 'pending') {
      return c.json(createErrorResponse(400, '只能审核待处理的提现申请'), 400);
    }
    
    if (status === 'approved') {
      // 如果通过审核，先更新状态为处理中，然后调用微信商家转账
      await c.env.DB.prepare(`
        UPDATE withdrawals 
        SET status = 'processing', processed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(withdrawalId).run();
      
      try {
        const transferResult = await WechatPayService.transferToWallet(
          c,
          withdrawalId,
          withdrawalData.amount,
          withdrawalData.user_id,
          `创作者提现 - ${withdrawalData.amount}元`
        );
        
        if (transferResult.success && transferResult.data) {
          // 转账成功，更新提现记录
          await c.env.DB.prepare(`
            UPDATE withdrawals 
            SET status = 'completed', batch_id = ?, transfer_id = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(transferResult.data.batch_id, transferResult.data.out_batch_no, withdrawalId).run();
        } else {
          // 转账失败，更新状态并记录失败原因
          await c.env.DB.prepare(`
            UPDATE withdrawals 
            SET status = 'failed', failure_reason = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(`微信商家转账失败: ${transferResult.error}`, withdrawalId).run();
          
          // 退还用户余额
          await c.env.DB.prepare(`
            UPDATE users SET balance = balance + ? WHERE id = ?
          `).bind(withdrawalData.amount, withdrawalData.user_id).run();
        }
      } catch (error) {
        console.error('微信商家转账处理失败:', error);
        // 转账异常，更新状态并退还余额
        await c.env.DB.prepare(`
          UPDATE withdrawals 
          SET status = 'failed', failure_reason = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(`商家转账处理异常: ${error instanceof Error ? error.message : '未知错误'}`, withdrawalId).run();
        
        // 退还用户余额
        await c.env.DB.prepare(`
          UPDATE users SET balance = balance + ? WHERE id = ?
        `).bind(withdrawalData.amount, withdrawalData.user_id).run();
      }
    } else {
      // 如果拒绝提现，更新状态并退还用户余额
      await c.env.DB.prepare(`
        UPDATE withdrawals 
        SET status = 'failed', failure_reason = ?, processed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).bind(admin_comment || null, withdrawalId).run();
      
      await c.env.DB.prepare(`
        UPDATE users SET balance = balance + ? WHERE id = ?
      `).bind(withdrawalData.amount, withdrawalData.user_id).run();
      
      // 创建退款交易记录
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, amount, type, transaction_type, description, created_at)
        VALUES (?, ?, 'withdrawal', 'withdrawal', ?, datetime('now'))
      `).bind(
        withdrawalData.user_id,
        withdrawalData.amount,
        `提现申请被拒绝，退还金额：${admin_comment || '无'}`
      ).run();
    }
    
    return c.json(createSuccessResponse({
      message: `提现申请${status === 'approved' ? '通过' : '拒绝'}成功`
    }));
  } catch (error) {
    console.error('审核提现申请失败:', error);
    return c.json(createErrorResponse(500, '审核提现申请失败'), 500);
  }
});

// 视频生成任务相关API
// 创建视频生成任务
app.post('/api/video-generation-tasks', authMiddleware, async (c) => {
  try {
    const { execute_id, workflow_id, token, notification_email, coze_workflow_id, user_id, title, debug_url } = await c.req.json();
    
    // coze_workflow_id 是可选的，其他参数仍然是必需的
    if (!execute_id || !workflow_id || !token || !notification_email || !user_id) {
      return c.json(createErrorResponse(400, '缺少必要参数'), 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO video_generation_tasks (execute_id, workflow_id, token, notification_email, coze_workflow_id, user_id, title, debug_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(execute_id, workflow_id, token, notification_email, coze_workflow_id || null, user_id, title || null, debug_url || null).run();
    
    return c.json(createSuccessResponse({
      id: result.meta.last_row_id,
      execute_id,
      workflow_id,
      status: 'running',
      title,
      debug_url
    }));
  } catch (error) {
    console.error('创建视频生成任务失败:', error);
    return c.json(createErrorResponse(500, '创建视频生成任务失败'), 500);
  }
});

// 获取视频生成任务列表
app.get('/api/video-generation-tasks', authMiddleware, adminMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const pageSize = parseInt(c.req.query('pageSize') || '20');
    const status = c.req.query('status');
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    let params: any[] = [];
    
    if (status) {
      whereClause = 'WHERE vgt.status = ?';
      params.push(status);
    }
    
    const tasks = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      ${whereClause}
      ORDER BY vgt.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, pageSize, offset).all();
    
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM video_generation_tasks vgt ${whereClause}
    `).bind(...params).first();
    
    const total = (totalResult as any)?.count || 0;
    
    return c.json(createSuccessResponse({
      items: tasks.results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }));
  } catch (error) {
    console.error('获取视频生成任务列表失败:', error);
    return c.json(createErrorResponse(500, '获取视频生成任务列表失败'), 500);
  }
});

// 通过execute_id获取视频生成任务详情（用户可查询自己的任务）
app.get('/api/video-generation-tasks/:execute_id', authMiddleware, async (c) => {
  try {
    const execute_id = c.req.param('execute_id');
    const currentUser = c.get('user');
    
    const task = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      WHERE vgt.execute_id = ? AND vgt.user_id = ?
    `).bind(execute_id, currentUser.id).first();
    
    if (!task) {
      return c.json(createErrorResponse(404, '视频生成任务不存在'), 404);
    }
    
    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error('获取视频生成任务详情失败:', error);
    return c.json(createErrorResponse(500, '获取视频生成任务详情失败'), 500);
  }
});

// 获取单个视频生成任务详情（管理员）
app.get('/api/admin/video-generation-tasks/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    const task = await c.env.DB.prepare(`
      SELECT vgt.*, u.username, u.email as user_email, cw.title as workflow_title
      FROM video_generation_tasks vgt
      LEFT JOIN users u ON vgt.user_id = u.id
      LEFT JOIN coze_workflows cw ON vgt.coze_workflow_id = cw.id
      WHERE vgt.id = ?
    `).bind(id).first();
    
    if (!task) {
      return c.json(createErrorResponse(404, '视频生成任务不存在'), 404);
    }
    
    return c.json(createSuccessResponse(task));
  } catch (error) {
    console.error('获取视频生成任务详情失败:', error);
    return c.json(createErrorResponse(500, '获取视频生成任务详情失败'), 500);
  }
});

// 更新视频生成任务状态
app.put('/api/video-generation-tasks/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { status, result_data, error_message } = await c.req.json();
    
    if (!status || !['running', 'completed', 'failed', 'timeout'].includes(status)) {
      return c.json(createErrorResponse(400, '无效的状态值'), 400);
    }
    
    let updateFields = 'status = ?, updated_at = datetime(\'now\')';
    let params = [status];
    
    if (status === 'completed' || status === 'failed' || status === 'timeout') {
      updateFields += ', completed_at = datetime(\'now\')';
    }
    
    if (result_data) {
      updateFields += ', result_data = ?';
      params.push(JSON.stringify(result_data));
    }
    
    if (error_message) {
      updateFields += ', error_message = ?';
      params.push(error_message);
    }
    
    params.push(id);
    
    await c.env.DB.prepare(`
      UPDATE video_generation_tasks 
      SET ${updateFields}
      WHERE id = ?
    `).bind(...params).run();
    
    return c.json(createSuccessResponse({ message: '任务状态更新成功' }));
  } catch (error) {
    console.error('更新视频生成任务状态失败:', error);
    return c.json(createErrorResponse(500, '更新视频生成任务状态失败'), 500);
  }
});

// 查询Coze API执行状态的接口
app.get('/api/video-generation-tasks/:id/check-status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    
    // 获取任务信息
    const task = await c.env.DB.prepare(`
      SELECT * FROM video_generation_tasks WHERE id = ?
    `).bind(id).first() as any;
    
    if (!task) {
      return c.json(createErrorResponse(404, '视频生成任务不存在'), 404);
    }
    
    if (task.status !== 'running') {
      return c.json(createSuccessResponse({
        status: task.status,
        result_data: task.result_data ? JSON.parse(task.result_data) : null,
        error_message: task.error_message
      }));
    }
    
    // 调用Coze API查询执行状态
    const response = await fetch(`https://api.coze.cn/v1/workflows/${task.workflow_id}/run_histories/${task.execute_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${task.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Coze API查询失败: ${response.status} ${response.statusText}`);
    }
    
    const apiResult = await response.json();
    
    // 根据API返回结果更新任务状态
    let newStatus = 'running';
    let resultData = null;
    let errorMessage = null;
    
    // 解析API响应，判断执行状态
    const typedApiResult = apiResult as any;
    if (typedApiResult.data && Array.isArray(typedApiResult.data) && typedApiResult.data.length > 0) {
      const statusData = typedApiResult.data[0];
      const executeStatus = statusData.execute_status;
      
      if (executeStatus === 'SUCCESS') {
        newStatus = 'completed';
        resultData = statusData;
      } else if (executeStatus === 'FAIL') {
        newStatus = 'failed';
        errorMessage = statusData.error_message || '执行失败';
      } else if (executeStatus === 'TIMEOUT') {
        newStatus = 'timeout';
        errorMessage = '执行超时';
      }
      // 其他状态保持running
    }
    
    // 如果状态有变化，更新数据库
    if (newStatus !== 'running') {
      let updateFields = 'status = ?, updated_at = datetime(\'now\'), completed_at = datetime(\'now\')';
      let params = [newStatus];
      
      if (resultData) {
        updateFields += ', result_data = ?';
        params.push(JSON.stringify(resultData));
      }
      
      if (errorMessage) {
        updateFields += ', error_message = ?';
        params.push(errorMessage);
      }
      
      params.push(id);
      
      await c.env.DB.prepare(`
        UPDATE video_generation_tasks 
        SET ${updateFields}
        WHERE id = ?
      `).bind(...params).run();
    }
    
    return c.json(createSuccessResponse({
      status: newStatus,
      result_data: resultData,
      error_message: errorMessage,
      raw_api_response: apiResult
    }));
  } catch (error) {
    console.error('查询视频生成任务状态失败:', error);
    return c.json(createErrorResponse(500, '查询视频生成任务状态失败'), 500);
  }
});

// 错误处理
app.notFound((c) => {
  return c.json(createErrorResponse(404, '接口不存在'), 404);
});

app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json(createErrorResponse(500, '服务器内部错误'), 500);
});

// 导出应用和启动函数的逻辑已移至文件末尾

// 视频任务监控管理API
app.post('/api/admin/video-task-monitor/start', authMiddleware, adminMiddleware, async (c) => {
  try {
    const monitor = startVideoTaskMonitor(c.env);
    return c.json(createSuccessResponse({
      message: '视频任务监控服务已启动',
      status: monitor.getStatus()
    }));
  } catch (error) {
    console.error('启动视频任务监控服务失败:', error);
    return c.json(createErrorResponse(500, '启动视频任务监控服务失败'), 500);
  }
});

app.post('/api/admin/video-task-monitor/stop', authMiddleware, adminMiddleware, async (c) => {
  try {
    stopVideoTaskMonitor();
    return c.json(createSuccessResponse({
      message: '视频任务监控服务已停止'
    }));
  } catch (error) {
    console.error('停止视频任务监控服务失败:', error);
    return c.json(createErrorResponse(500, '停止视频任务监控服务失败'), 500);
  }
});

app.get('/api/admin/video-task-monitor/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { getVideoTaskMonitor } = await import('./services/videoTaskMonitor');
    const monitor = getVideoTaskMonitor(c.env);
    return c.json(createSuccessResponse({
      status: monitor.getStatus()
    }));
  } catch (error) {
    console.error('获取视频任务监控服务状态失败:', error);
    return c.json(createErrorResponse(500, '获取监控服务状态失败'), 500);
  }
});

// 注意：在实际部署时，需要手动调用启动API来开始定时任务
// 或者在管理后台添加一个按钮来启动/停止定时任务

// ==================== Coze工作流运行 API ====================

// 运行Coze工作流
app.post('/api/coze-workflows/:id/run', authMiddleware, async (c) => {
  try {
    const workflowId = parseInt(c.req.param('id'));
    const user = c.get('user');
    const body = await c.req.json();
    const { content, parameters, notification_email } = body;

    if (isNaN(workflowId)) {
      return c.json(createErrorResponse(400, '无效的工作流ID'), 400);
    }

    // 检查工作流是否存在
    const workflow = await c.env.DB.prepare(`
      SELECT id, title, price, coze_api, creator_id, is_member_free
      FROM coze_workflows 
      WHERE id = ? AND status = 'online'
    `).bind(workflowId).first();

    if (!workflow) {
      return c.json(createErrorResponse(404, 'Coze工作流不存在或已下线'), 404);
    }

    // 检查用户是否有足够的WH币
    const userBalance = await c.env.DB.prepare(`
      SELECT wh_coins FROM users WHERE id = ?
    `).bind(user.id).first();

    const currentBalance = (userBalance as any)?.wh_coins || 0;
    const workflowPrice = (workflow as any).price || 0;

    // 检查是否为会员免费或价格为0
    const isFree = (workflow as any).is_member_free && user.membership_type !== 'basic';
    
    if (!isFree && workflowPrice > 0 && currentBalance < workflowPrice) {
      return c.json(createErrorResponse(400, `WH币余额不足，需要 ${workflowPrice} WH币，当前余额 ${currentBalance} WH币`), 400);
    }

    // 扣除WH币（如果需要）
    if (!isFree && workflowPrice > 0) {
      await c.env.DB.prepare(`
        UPDATE users SET wh_coins = wh_coins - ? WHERE id = ?
      `).bind(workflowPrice, user.id).run();

      // 记录交易
      const now = new Date().toISOString();
      await c.env.DB.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, status, created_at, updated_at)
        VALUES (?, 'coze_workflow_run', ?, ?, 'completed', ?, ?)
      `).bind(user.id, -workflowPrice, `运行Coze工作流: ${(workflow as any).title}`, now, now).run();
    }

    // 解析coze_api获取必要信息
    const cozeApi = (workflow as any).coze_api;
    if (!cozeApi) {
      return c.json(createErrorResponse(400, '工作流缺少API配置'), 400);
    }

    // 提取Authorization token
    const authMatch = cozeApi.match(/Authorization:\s*Bearer\s+([^\s\\]+)/);
    if (!authMatch) {
      return c.json(createErrorResponse(400, '无法从API配置中提取Authorization token'), 400);
    }
    const authToken = authMatch[1];

    // 提取工作流ID
    let cozeWorkflowId = '';
    const workflowUrlMatch = cozeApi.match(/\/v1\/(workflow|workflows)\/(\w+)\/run/);
    if (workflowUrlMatch) {
      cozeWorkflowId = workflowUrlMatch[2];
    } else {
      const workflowIdJsonMatch = cozeApi.match(/workflow_id\s*:\s*(\d+)/);
      if (workflowIdJsonMatch) {
        cozeWorkflowId = workflowIdJsonMatch[1];
      } else {
        return c.json(createErrorResponse(400, '无法从API配置中提取工作流ID'), 400);
      }
    }

    // 构建请求参数
    let requestParams: {[key: string]: any} = {};
    
    if (parameters) {
      // 动态参数模式
      Object.keys(parameters).forEach(key => {
        if (key !== 'notification_email' && parameters[key]) {
          requestParams[key] = parameters[key];
        }
      });
    } else if (content) {
      // 传统内容模式
      requestParams.content = content;
    }

    try {
      // 调用Coze API
      const response = await fetch(`https://api.coze.cn/v1/workflow/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow_id: cozeWorkflowId,
          parameters: requestParams,
          is_async: true
        })
      });

      const result = await response.json() as any;
      
      if (response.ok && result.execute_id) {
        // 如果有邮箱通知需求，创建视频生成任务
        if (notification_email) {
          try {
            const now = new Date().toISOString();
            await c.env.DB.prepare(`
              INSERT INTO video_generation_tasks (
                execute_id, workflow_id, token, notification_email, 
                title, coze_workflow_id, status, created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            `).bind(
              result.execute_id,
              cozeWorkflowId,
              authToken,
              notification_email,
              (workflow as any).title,
              workflowId,
              now,
              now
            ).run();
          } catch (error) {
            console.error('创建视频生成任务失败:', error);
            // 不影响主流程，继续执行
          }
        }

        return c.json(createSuccessResponse({
          status: 'running',
          execute_id: result.execute_id,
          workflow_id: cozeWorkflowId,
          message: 'Coze工作流已成功提交运行'
        }));
      } else {
        // API调用失败，退还WH币
        if (!isFree && workflowPrice > 0) {
          await c.env.DB.prepare(`
            UPDATE users SET wh_coins = wh_coins + ? WHERE id = ?
          `).bind(workflowPrice, user.id).run();
        }
        
        return c.json(createErrorResponse(400, `Coze API调用失败: ${result.message || '未知错误'}`), 400);
      }
    } catch (error) {
      console.error('调用Coze API失败:', error);
      
      // API调用失败，退还WH币
      if (!isFree && workflowPrice > 0) {
        await c.env.DB.prepare(`
          UPDATE users SET wh_coins = wh_coins + ? WHERE id = ?
        `).bind(workflowPrice, user.id).run();
      }
      
      return c.json(createErrorResponse(500, 'Coze API调用失败，请稍后重试'), 500);
    }
  } catch (error) {
    console.error('运行Coze工作流失败:', error);
    return c.json(createErrorResponse(500, '运行工作流失败', 'server', '服务器内部错误'), 500);
  }
});

// Cron触发器处理函数 - 每分钟执行一次佣金检查
async function scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
  console.log('Cron触发器执行: 开始检查佣金发放');
  
  try {
    const { getCommissionPayoutMonitor } = await import('./services/commissionPayoutMonitor');
    const monitor = getCommissionPayoutMonitor(env);
    await monitor.checkPendingPayouts();
    console.log('Cron触发器完成: 佣金检查执行完毕');
  } catch (error) {
    console.error('Cron触发器执行失败:', error);
  }
}

export default {
  fetch: app.fetch,
  scheduled
};

// 为了兼容性，也导出app
export { app };
