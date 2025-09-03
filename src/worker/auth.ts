// 认证相关工具函数
import { Env, User, JWTPayload, ApiResponse, OAuthUserInfo } from './types';
import { D1Database } from './database-real';
import { Resend } from 'resend';

// JWT工具函数
export class AuthService {
  constructor(private env: Env, private db: D1Database) { }

  // 生成6位数验证码
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送邮件的函数
  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // 检查是否有RESEND_API_KEY
      if (!this.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY未配置');
        return false;
      }

      const resend = new Resend(this.env.RESEND_API_KEY);
      
      console.log('准备发送真实邮件:', {
        from: '工作流分享平台 <noreply@chaofengq.com>',
        to: to,
        subject: subject
      });

      const { data, error } = await resend.emails.send({
        from: '工作流分享平台 <noreply@chaofengq.com>',
        to: to,
        subject: subject,
        html: html
      });
      
      if (error) {
        console.error('Resend邮件发送失败:', error);
        return false;
      }
      
      console.log('邮件发送成功:', data);
      return true;
    } catch (error) {
      console.error('邮件发送异常:', error);
      return false;
    }
  }

  // 发送通知邮件（公共方法）
  async sendNotificationEmail(to: string, subject: string, html: string): Promise<boolean> {
    return await this.sendEmail(to, subject, html);
  }

  // 发送邮箱验证码
  async sendEmailVerificationCode(email: string): Promise<ApiResponse> {
    try {
      // 检查邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          code: 400,
          message: '邮箱格式不正确',
          error: {
            field: 'email',
            reason: '请输入有效的邮箱地址'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 检查邮箱是否已注册
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          code: 400,
          message: '邮箱已被注册',
          error: {
            field: 'email',
            reason: '该邮箱已被其他用户使用'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 生成验证码
      const code = this.generateVerificationCode();
      
      // 保存验证码到数据库
      await this.db.createEmailVerificationCode(email, code);
      
      // 构建邮件内容
      const emailSubject = '工作流分享平台 - 邮箱验证码';
      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; line-height: 60px; color: white; font-size: 24px; font-weight: bold;">WF</div>
            <h1 style="color: #333; margin: 20px 0 10px 0;">工作流分享平台</h1>
            <p style="color: #666; margin: 0;">您的邮箱验证码</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">验证码</h2>
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 20px 0;">${code}</div>
            <p style="color: #666; margin: 15px 0 0 0; font-size: 14px;">验证码有效期为10分钟</p>
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.6;">
            <p>您正在注册工作流分享平台账户，请在注册页面输入上述验证码完成邮箱验证。</p>
            <p>如果您没有进行此操作，请忽略此邮件。</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© 2024 工作流分享平台. All rights reserved.</p>
          </div>
        </div>
      `;
      
      // 发送邮件
      const emailSent = await this.sendEmail(email, emailSubject, emailHtml);
      
      if (!emailSent) {
        return {
          success: false,
          code: 500,
          message: '邮件发送失败',
          error: {
            reason: '邮件服务暂时不可用，请稍后重试'
          },
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        code: 200,
        message: '验证码已发送',
        data: {
          // 在开发环境中返回验证码，生产环境中不应该返回
          ...(this.env.ENVIRONMENT === 'development' && { verificationCode: code })
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Send email verification code error:', error);
      return {
        success: false,
        code: 500,
        message: '发送验证码失败',
        error: {
          reason: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // 验证邮箱验证码
  async verifyEmailCode(email: string, code: string): Promise<ApiResponse> {
    try {
      console.log('Starting email code verification:', { email, code });
      const verificationRecord = await this.db.getEmailVerificationCode(email, code);
      console.log('Verification record found:', !!verificationRecord);
      
      if (!verificationRecord) {
        console.log('No verification record found - checking all codes for this email');
        // 查询该邮箱的所有验证码记录用于调试
        const allCodes = await this.db.getAllEmailVerificationCodes(email);
        console.log('All verification codes for email:', allCodes);
        
        return {
          success: false,
          code: 400,
          message: '验证码无效或已过期',
          error: {
            field: 'code',
            reason: '请检查验证码是否正确或重新获取'
          },
          timestamp: new Date().toISOString()
        };
      }

      console.log('Verification successful, marking code as used');
      // 标记验证码为已使用
      await this.db.markEmailVerificationCodeAsUsed(email, code);
      
      return {
        success: true,
        code: 200,
        message: '邮箱验证成功',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Verify email code error:', error);
      return {
        success: false,
        code: 500,
        message: '验证失败',
        error: {
          reason: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // 生成JWT Token
  async generateToken(user: User): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24小时过期
      iat: Math.floor(Date.now() / 1000)
    };

    return await this.signJWT(payload, this.env.JWT_SECRET);
  }

  // 验证JWT Token
  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = await this.verifyJWT(token, this.env.JWT_SECRET);

      // 检查token是否过期
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  // JWT签名函数（使用Web Crypto API）
  private async signJWT(payload: JWTPayload, secret: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));

    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.hmacSign(data, secret);

    return `${data}.${signature}`;
  }

  // JWT验证函数（使用Web Crypto API）
  private async verifyJWT(token: string, secret: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = await this.hmacSign(data, secret);
    if (signature !== expectedSignature) {
      throw new Error('Invalid JWT signature');
    }

    return JSON.parse(this.base64UrlDecode(encodedPayload));
  }

  // HMAC签名
  private async hmacSign(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    return this.base64UrlEncode(new Uint8Array(signature));
  }

  // Base64 URL编码
  private base64UrlEncode(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Base64 URL解码
  private base64UrlDecode(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    return atob(padded);
  }

  // 从请求头中提取token
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // 验证用户权限
  async verifyPermission(token: string, requiredRoles: string[] = []): Promise<{ user: User; payload: JWTPayload } | null> {
    const payload = await this.verifyToken(token);
    if (!payload) return null;

    const user = await this.db.getUserById(payload.userId);
    if (!user || user.status !== 'active') return null;

    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      return null;
    }

    return { user, payload };
  }

  // 密码哈希（使用Web Crypto API）
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 验证密码
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

// 用户注册（需要先验证邮箱）
  async register(username: string, email: string, password: string, verificationCode: string, role: 'user' | 'creator' | 'advertiser' = 'user'): Promise<ApiResponse> {
    try {
      console.log('Register attempt:', { username, email, role, hasVerificationCode: !!verificationCode });
      
      // 首先验证邮箱验证码
      console.log('Verifying email code for:', email);
      const codeVerification = await this.verifyEmailCode(email, verificationCode);
      if (!codeVerification.success) {
        console.log('Email code verification failed:', codeVerification);
        return codeVerification;
      }
      console.log('Email code verification successful');
      // 检查用户名是否已存在
      console.log('Checking username availability:', username);
      const existingUserByUsername = await this.db.getUserByUsername(username);
      if (existingUserByUsername) {
        console.log('Username already exists:', username);
        return {
          success: false,
          code: 400,
          message: '用户名已存在',
          error: {
            field: 'username',
            reason: '该用户名已被使用'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 检查邮箱是否已存在
      console.log('Checking email availability:', email);
      const existingUserByEmail = await this.db.getUserByEmail(email);
      if (existingUserByEmail) {
        console.log('Email already exists:', email);
        return {
          success: false,
          code: 400,
          message: '邮箱已存在',
          error: {
            field: 'email',
            reason: '该邮箱已被注册'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 密码强度验证
      console.log('Validating password strength, length:', password.length);
      if (password.length < 6) {
        console.log('Password too short:', password.length);
        return {
          success: false,
          code: 400,
          message: '密码强度不足',
          error: {
            field: 'password',
            reason: '密码长度至少6位'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 创建用户
      console.log('Creating user with role:', role);
      const hashedPassword = await this.hashPassword(password);
      const newUser = await this.db.createUser({
        username,
        email,
        password_hash: hashedPassword,
        role,
        balance: 0,
        total_earnings: 0,
        status: 'active'
      } as any);
      console.log('User created successfully:', { id: newUser.id, username: newUser.username });

      // 生成token
      const token = await this.generateToken(newUser);

      // 移除密码哈希
      const { password_hash: _, ...userWithoutPassword } = newUser as any;

      return {
        success: true,
        code: 200,
        message: '注册成功',
        data: {
          user: userWithoutPassword as User,
          token
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        code: 500,
        message: '注册失败',
        error: {
          reason: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // 用户登录
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // 查找用户
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          code: 401,
          message: '登录失败',
          error: {
            field: 'email',
            reason: '用户不存在'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 检查用户状态
      if (user.status !== 'active') {
        let message = '登录失败';
        let reason = '请联系管理员';
        
        switch (user.status) {
          case 'banned':
            message = '账户已被封禁';
            reason = '此账号已被系统封禁，如有疑问请联系管理员';
            break;
          case 'suspended':
            message = '账户已被暂停';
            reason = '此账号已被暂停使用，请联系管理员';
            break;
          case 'pending':
            message = '账户待激活';
            reason = '请先完成邮箱验证激活账户';
            break;
          case 'deleted':
            message = '账户不存在';
            reason = '此账号已被删除';
            break;
          default:
            message = '账户状态异常';
            reason = '请联系管理员';
        }
        
        return {
          success: false,
          code: 401,
          message,
          error: {
            reason
          },
          timestamp: new Date().toISOString()
        };
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(password, (user as any).password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          code: 401,
          message: '登录失败',
          error: {
            field: 'password',
            reason: '密码错误'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 更新用户的updated_at时间
      const updatedUser = await this.db.updateUser(user.id, {});
      
      // 生成token
      const token = await this.generateToken(updatedUser || user);

      return {
        success: true,
        code: 200,
        message: '登录成功',
        data: {
          user: updatedUser || user,
          token
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        message: '登录失败',
        error: {
          reason: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // GitHub OAuth认证
  async authenticateWithGitHub(code: string, redirectUri?: string): Promise<OAuthUserInfo | null> {
    try {
      // 使用传入的redirectUri或默认值
      const redirect_uri = redirectUri || `https://www.chaofengq.com/auth/github/callback`;
      
      // 交换access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.env.GITHUB_CLIENT_ID,
          client_secret: this.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: redirect_uri,
        }),
      });

      const tokenData = await tokenResponse.json() as any;
      if (!tokenData.access_token) {
        console.error('GitHub OAuth token exchange failed:', tokenData);
        return null;
      }

      // 获取用户信息
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'WorkflowPlatform',
        },
      });

      const userData = await userResponse.json() as any;

      // 获取用户邮箱（如果公开）
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${tokenData.access_token}`,
          'User-Agent': 'WorkflowPlatform',
        },
      });

      const emailData = await emailResponse.json() as any;
      const primaryEmail = emailData.find((email: any) => email.primary)?.email || userData.email;

      return {
        id: userData.id.toString(),
        email: primaryEmail,
        name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        provider: 'github',
      };
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return null;
    }
  }

  // Google OAuth认证
  async authenticateWithGoogle(code: string, redirectUri?: string): Promise<OAuthUserInfo | null> {
    try {
      // 使用传入的redirectUri或默认值
      const redirect_uri = redirectUri || `https://www.chaofengq.com/auth/google/callback`;
      
      console.log('Google OAuth - Starting authentication with code:', code.substring(0, 10) + '...');
      console.log('Google OAuth - Redirect URI:', redirect_uri);
      
      // 检查环境变量
      if (!this.env.GOOGLE_CLIENT_ID || !this.env.GOOGLE_CLIENT_SECRET) {
        console.error('Google OAuth - Missing environment variables');
        return null;
      }
      
      // 交换access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.env.GOOGLE_CLIENT_ID,
          client_secret: this.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirect_uri,
        }),
      });

      console.log('Google OAuth - Token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Google OAuth - Token exchange failed:', errorText);
        return null;
      }

      const tokenData = await tokenResponse.json() as any;
      
      if (!tokenData.access_token) {
        return null;
      }

      // 获取用户信息
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      console.log('Google OAuth - User info response status:', userResponse.status);
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('Google OAuth - User info fetch failed:', errorText);
        return null;
      }

      const userData = await userResponse.json() as any;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.picture,
        provider: 'google',
      };
    } catch (error) {
      return null;
    }
  }

  // 微信OAuth认证
  async authenticateWithWechat(code: string): Promise<OAuthUserInfo | null> {
    try {
      console.log('WeChat OAuth - Starting authentication with code:', code);
      
      // 微信网站应用授权配置
      const WECHAT_CONFIG = {
          appid: (this.env as any).WECHAT_APP_ID || "wx3cb32b212d933aa0", // 网站应用APPID
          secret: (this.env as any).WECHAT_APP_SECRET || "88343d86d1ed09caece4c18eb765fd35" // 网站应用AppSecret
        };
      
      // 第一步：通过code获取access_token和openid
      const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_CONFIG.appid}&secret=${WECHAT_CONFIG.secret}&code=${code}&grant_type=authorization_code`;
      
      const tokenResponse = await fetch(tokenUrl);
      console.log('WeChat OAuth - Token response status:', tokenResponse.status);
      
      if (!tokenResponse.ok) {
        console.error('WeChat OAuth - Token request failed:', tokenResponse.statusText);
        return null;
      }
      
      const tokenData = await tokenResponse.json() as any;
      console.log('WeChat OAuth - Token data received:', { 
        has_access_token: !!tokenData.access_token,
        has_openid: !!tokenData.openid,
        expires_in: tokenData.expires_in
      });
      
      if (!tokenData.access_token || !tokenData.openid) {
        console.error('WeChat OAuth - Missing access_token or openid:', tokenData);
        return null;
      }
      
      // 第二步：通过access_token和openid获取用户信息
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`;
      
      const userResponse = await fetch(userInfoUrl);
      console.log('WeChat OAuth - User info response status:', userResponse.status);
      
      if (!userResponse.ok) {
        console.error('WeChat OAuth - User info request failed:', userResponse.statusText);
        return null;
      }
      
      const userData = await userResponse.json() as any;
      console.log('WeChat OAuth - User data received:', {
        has_openid: !!userData.openid,
        has_nickname: !!userData.nickname,
        has_headimgurl: !!userData.headimgurl
      });
      
      if (!userData.openid) {
        console.error('WeChat OAuth - Missing openid in user data:', userData);
        return null;
      }
      
      // 微信用户可能没有邮箱，使用openid作为唯一标识
      return {
        id: userData.openid,
        email: "null", // 生成虚拟邮箱
        name: userData.nickname || '微信用户',
        avatar_url: userData.headimgurl,
        provider: 'wechat',
        openid: userData.openid
      };
    } catch (error) {
      console.error('WeChat OAuth - Authentication error:', error);
      return null;
    }
  }

  // OAuth注册/登录
  async oauthRegister(provider: 'github' | 'google' | 'wechat', code: string, role: 'user' | 'creator' | 'advertiser' = 'user', redirectUri?: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log(`OAuth Register - Starting ${provider} authentication for role: ${role}`);
      
      // 获取OAuth用户信息
      let oauthUser: OAuthUserInfo | null = null;

      if (provider === 'github') {
        oauthUser = await this.authenticateWithGitHub(code, redirectUri);
      } else if (provider === 'google') {
        oauthUser = await this.authenticateWithGoogle(code, redirectUri);
      } else if (provider === 'wechat') {
        oauthUser = await this.authenticateWithWechat(code);
      }

      if (!oauthUser) {
        console.error(`OAuth Register - Failed to get ${provider} user info`);
        return {
          success: false,
          code: 400,
          message: 'OAuth认证失败',
          error: {
            reason: '无法获取用户信息'
          },
          timestamp: new Date().toISOString()
        };
      }
      
      console.log(`OAuth Register - Got user info for: ${oauthUser.email}`);

      // 首先尝试通过OAuth信息查找用户
      let existingUser = await this.db.getUserByOAuth(oauthUser.provider, oauthUser.id);
      
      // 如果通过OAuth没找到，再通过邮箱查找
      if (!existingUser) {
        existingUser = await this.db.getUserByEmail(oauthUser.email);
      }

      if (existingUser) {
        console.log('OAuth Register - Found existing user:', existingUser.id);
        
        // 用户已存在，检查状态
        if (existingUser.status !== 'active') {
          let message = '登录失败';
          let reason = '请联系管理员';
          
          switch (existingUser.status) {
            case 'banned':
              message = '账户已被封禁';
              reason = '此账号已被系统封禁，如有疑问请联系管理员';
              break;
            case 'suspended':
              message = '账户已被暂停';
              reason = '此账号已被暂停使用，请联系管理员';
              break;
            case 'pending':
              message = '账户待激活';
              reason = '请先完成邮箱验证激活账户';
              break;
            case 'deleted':
              message = '账户不存在';
              reason = '此账号已被删除';
              break;
            default:
              message = '账户状态异常';
              reason = '请联系管理员';
          }
          
          return {
            success: false,
            code: 401,
            message,
            error: {
              reason
            },
            timestamp: new Date().toISOString()
          };
        }

        // 更新OAuth信息、头像和updated_at时间
        const updateData: any = {
          oauth_provider: oauthUser.provider,
          oauth_id: oauthUser.id
        };
        
        if (oauthUser.avatar_url && existingUser.avatar_url !== oauthUser.avatar_url) {
          updateData.avatar_url = oauthUser.avatar_url;
        }
        
        // 如果是微信登录，更新openid
        if (oauthUser.provider === 'wechat' && oauthUser.openid) {
          updateData.wechat_openid = oauthUser.openid;
        }
        
        console.log('OAuth Register - Updating existing user with OAuth info');
        existingUser = await this.db.updateUser(existingUser.id, updateData);

        const token = await this.generateToken(existingUser!);
        return {
          success: true,
          code: 200,
          message: '登录成功',
          data: {
            user: existingUser!,
            token
          },
          timestamp: new Date().toISOString()
        };
      }

      // 创建新用户
      console.log('OAuth Register - Creating new user for:', oauthUser.email);
      const username = await this.generateUniqueUsername(oauthUser.name);
      console.log('OAuth Register - Generated username:', username);
      
      const userData: any = {
        username,
        email: oauthUser.email,
        password_hash: '', // OAuth用户不需要密码
        role,
        avatar_url: oauthUser.avatar_url,
        balance: 0,
        total_earnings: 0,
        status: 'active',
        oauth_provider: oauthUser.provider,
        oauth_id: oauthUser.id
      };
      
      // 如果是微信登录，添加openid
      if (oauthUser.provider === 'wechat' && oauthUser.openid) {
        userData.wechat_openid = oauthUser.openid;
      }
      
      const newUser = await this.db.createUser(userData);

      console.log('OAuth Register - User created successfully:', newUser.id);
      const token = await this.generateToken(newUser);

      return {
        success: true,
        code: 200,
        message: '注册成功',
        data: {
          user: newUser,
          token
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('OAuth register error:', error);
      return {
        success: false,
        code: 500,
        message: 'OAuth注册失败',
        error: {
          reason: '服务器内部错误'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // 生成唯一用户名
  private async generateUniqueUsername(baseName: string): Promise<string> {
    // 清理用户名，只保留字母数字和下划线
    let cleanName = baseName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '').substring(0, 15);
    if (!cleanName) {
      cleanName = 'user';
    }

    let username = cleanName;
    let counter = 1;

    // 检查用户名是否已存在，如果存在则添加数字后缀
    while (await this.db.getUserByUsername(username)) {
      username = `${cleanName}${counter}`;
      counter++;
    }

    return username;
  }
}

// 响应工具函数
export function createSuccessResponse<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return {
    success: true,
    code: 200,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(code: number, message: string, field?: string, reason?: string): ApiResponse {
  return {
    success: false,
    code,
    message,
    error: field && reason ? { field, reason } : { reason: reason || message },
    timestamp: new Date().toISOString()
  };
}

// 输入验证工具
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/;
  return usernameRegex.test(username);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>"'&]/g, '');
}