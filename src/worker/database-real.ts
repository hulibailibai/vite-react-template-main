// 真实数据库操作实现
import { Env, User, Category, PaginatedResponse, Notification, NotificationCreateRequest, NotificationSearchParams, UserSettings } from './types';
// Workflow type removed - workflows table no longer exists

// D1 数据库实现
export class D1Database {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  // 邮箱验证码相关操作
  async createEmailVerificationCode(email: string, code: string): Promise<void> {
    // 使用SQLite的datetime函数来确保时间格式一致
    console.log('Creating verification code:', { email, code });
    await this.env.DB.prepare(`
      INSERT INTO email_verification_codes (email, code, expires_at, used, created_at)
      VALUES (?, ?, datetime('now', '+10 minutes'), 0, datetime('now'))
    `).bind(email, code).run();
    console.log('Verification code created successfully');
  }

  async getEmailVerificationCode(email: string, code: string): Promise<any | null> {
    console.log('Querying verification code for:', { email, code });
    
    // 首先查询所有匹配的验证码记录（不考虑过期和使用状态）
    const allMatches = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time, 
             (datetime(expires_at) > datetime('now')) as is_not_expired,
             (used = 0) as is_not_used
      FROM email_verification_codes 
      WHERE email = ? AND code = ?
      ORDER BY created_at DESC
    `).bind(email, code).all();
    
    console.log('All matching verification codes:', allMatches.results);
    
    // 然后查询符合所有条件的记录 - 使用datetime()函数确保时间格式兼容
    const result = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time FROM email_verification_codes 
      WHERE email = ? AND code = ? AND used = 0 AND datetime(expires_at) > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).bind(email, code).first();
    
    console.log('Valid verification code query result:', result);
    return result || null;
  }

  async markEmailVerificationCodeAsUsed(email: string, code: string): Promise<void> {
    await this.env.DB.prepare(`
      UPDATE email_verification_codes 
      SET used = 1 
      WHERE email = ? AND code = ?
    `).bind(email, code).run();
  }

  async getAllEmailVerificationCodes(email: string): Promise<any[]> {
    const result = await this.env.DB.prepare(`
      SELECT *, datetime('now') as current_time FROM email_verification_codes 
      WHERE email = ?
      ORDER BY created_at DESC
    `).bind(email).all();
    

    
    return result.results || [];
  }

  async cleanupExpiredVerificationCodes(): Promise<void> {
    await this.env.DB.prepare(`
      DELETE FROM email_verification_codes 
      WHERE datetime(expires_at) < datetime('now') OR used = 1
    `).run();
  }

  // 用户相关操作
  async getUserById(id: number): Promise<User | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first();
    
    return result ? this.mapUserFromDB(result as any) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    return result ? this.mapUserFromDB(result as any) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();
    
    return result ? this.mapUserFromDB(result as any) : null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM users WHERE phone = ?'
    ).bind(phone).first();
    
    return result ? this.mapUserFromDB(result as any) : null;
  }

  async getUserByOAuth(provider: string, oauthId: string): Promise<User | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).bind(provider, oauthId).first();
    
    return result ? this.mapUserFromDB(result as any) : null;
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const now = new Date().toISOString();
    
    console.log('Creating user with data:', {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      oauth_provider: (userData as any).oauth_provider,
      oauth_id: (userData as any).oauth_id
    });
    
    const result = await this.env.DB.prepare(`
      INSERT INTO users (
        username, email, password_hash, oauth_provider, oauth_id, 
        role, avatar_url, balance, total_earnings, status, wechat_openid, phone, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userData.username,
      userData.email,
      (userData as any).password_hash || '',
      (userData as any).oauth_provider || null,
      (userData as any).oauth_id || null,
      userData.role,
      (userData as any).avatar_url || null,
      userData.balance,
      userData.total_earnings,
      userData.status,
      (userData as any).wechat_openid || null,
      (userData as any).phone || null,
      now,
      now
    ).run();

    console.log('Insert result:', {
      success: result.success,
      lastRowId: result.meta?.last_row_id,
      changes: result.meta?.changes
    });

    if (!result.success) {
      throw new Error('Failed to create user');
    }

    if (!result.meta?.last_row_id) {
      throw new Error('No last_row_id returned from insert');
    }

    const newUser = await this.getUserById(result.meta.last_row_id as number);
    
    if (!newUser) {
      throw new Error(`Failed to retrieve created user with id: ${result.meta.last_row_id}`);
    }
    
    console.log('Created user successfully:', { id: newUser.id, email: newUser.email });
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'created_at')
      .map(key => `${key} = ?`)
      .join(', ');
    
    if (!setClause) return null;

    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'created_at')
      .map(([, value]) => value);
    
    values.push(new Date().toISOString()); // updated_at
    values.push(id);

    await this.env.DB.prepare(`
      UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?
    `).bind(...values).run();

    return await this.getUserById(id);
  }

  // 分类相关操作
  async getCategories(): Promise<Category[]> {
    const categories = await this.env.DB.prepare(
      'SELECT * FROM categories WHERE parent_id IS NULL AND is_active = 1 ORDER BY sort_order'
    ).all();

    const result: Category[] = [];
    
    for (const category of categories.results as any[]) {
      const children = await this.env.DB.prepare(
        'SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order'
      ).bind(category.id).all();

      result.push({
        id: category.id as number,
        name: category.name as string,
        parent_id: (category.parent_id as number) || undefined,
        region: ((category.region as 'global' | 'china' | 'usa') || 'global'),
        sort_order: category.sort_order as number,
        is_active: Boolean(category.is_active),
        children: (children.results as any[]).map((child: any) => ({
          id: child.id as number,
          name: child.name as string,
          parent_id: child.parent_id as number,
          region: (child.region as 'global' | 'china' | 'usa') || 'global',
          sort_order: child.sort_order as number,
          is_active: Boolean(child.is_active)
        }))
      });
    }

    return result;
  }

  async getCategoryById(id: number): Promise<Category | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM categories WHERE id = ?'
    ).bind(id).first();
    
    if (!result) return null;

    return {
      id: (result as any).id as number,
      name: (result as any).name as string,
      parent_id: (result as any).parent_id as number || undefined,
      region: ((result as any).region as 'global' | 'china' | 'usa') || 'global',
      sort_order: (result as any).sort_order as number,
      is_active: Boolean((result as any).is_active)
    };
  }


  // 用户管理相关操作
  async getUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      pageSize = 20,
      search,
      role,
      status
    } = params;

    // 构建查询条件
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (search) {
      conditions.push('(username LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }

    if (role && role !== 'all') {
      conditions.push('role = ?');
      bindings.push(role);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      bindings.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users ${whereClause}`
    ).bind(...bindings).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const users = await this.env.DB.prepare(`
      SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();

    const items = (users.results as any[])?.map((row: any) => {
      return this.mapUserFromDB(row);
    }) || [];

    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  // 获取包含统计数据的用户列表（用于佣金管理页面）
  async getUsersWithStats(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      search,
      role,
      status
    } = params;

    // 构建查询条件
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (search) {
      conditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }

    if (role && role !== 'all') {
      conditions.push('u.role = ?');
      bindings.push(role);
    }

    if (status && status !== 'all') {
      conditions.push('u.status = ?');
      bindings.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`
    ).bind(...bindings).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据，包含统计信息
    const offset = (page - 1) * pageSize;
    const query = `
      SELECT 
        u.*,
        COALESCE(w.workflow_count, 0) as workflow_count,
        COALESCE(f.favorite_count, 0) as favorite_count,
        COALESCE(d.download_count, 0) as download_count,
        0 as conversation_count
      FROM users u
      LEFT JOIN (
        SELECT creator_id, COUNT(*) as workflow_count
        FROM coze_workflows 
        WHERE status = 'online'
        GROUP BY creator_id
      ) w ON u.id = w.creator_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as favorite_count
        FROM coze_workflow_favorites
        GROUP BY user_id
      ) f ON u.id = f.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as download_count
        FROM coze_workflow_downloads
        GROUP BY user_id
      ) d ON u.id = d.user_id
      ${whereClause}
      ORDER BY u.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const users = await this.env.DB.prepare(query)
      .bind(...bindings, pageSize, offset).all();

    const items = (users.results as any[])?.map((row: any) => {
      const user = this.mapUserFromDB(row);
      return {
        ...user,
        workflow_count: row.workflow_count || 0,
        favorite_count: row.favorite_count || 0,
        download_count: row.download_count || 0,
        conversation_count: row.conversation_count || 0
      };
    }) || [];

    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async updateUserRole(id: number, role: 'user' | 'creator' | 'admin' | 'advertiser' | 'super_admin'): Promise<User | null> {
    // 获取用户当前角色
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      return null;
    }

    // 如果从创作者变为普通用户，需要清理相关数据
    if (currentUser.role === 'creator' && role === 'user') {
      await this.cleanupCreatorData(id);
    }

    await this.env.DB.prepare(`
      UPDATE users SET role = ?, updated_at = ? WHERE id = ?
    `).bind(role, new Date().toISOString(), id).run();

    return await this.getUserById(id);
  }

  // 清理创作者相关数据
  private async cleanupCreatorData(userId: number): Promise<void> {
    try {
      // 1. 删除创作者申请记录
      await this.env.DB.prepare(`
        DELETE FROM creator_applications WHERE user_id = ?
      `).bind(userId).run();

      // 2. 将该用户创建的工作流状态设为下线 - workflows表已移除
      // await this.env.DB.prepare(`
      //   UPDATE workflows SET status = 'offline', updated_at = ? WHERE creator_id = ?
      // `).bind(new Date().toISOString(), userId).run();

      // 3. 清理相关通知（创作者申请相关）
      await this.env.DB.prepare(`
        DELETE FROM notifications WHERE recipient_id = ? AND type = 'creator_application'
      `).bind(userId).run();

      console.log(`已清理用户 ${userId} 的创作者相关数据`);
    } catch (error) {
      console.error('清理创作者数据时发生错误:', error);
      throw error;
    }
  }

  async updateUserStatus(id: number, status: 'active' | 'banned' | 'pending' | 'suspended' | 'deleted'): Promise<User | null> {
    try {
      console.log(`Updating user ${id} status to ${status}`);
      
      const result = await this.env.DB.prepare(`
        UPDATE users SET status = ?, updated_at = ? WHERE id = ?
      `).bind(status, new Date().toISOString(), id).run();
      
      console.log('Update result:', result);
      
      if (!result.success) {
        console.error('Failed to update user status:', result);
        throw new Error('Database update failed');
      }
      
      if (result.changes === 0) {
        console.error('No user found with id:', id);
        return null;
      }
      
      const updatedUser = await this.getUserById(id);
      console.log('Updated user:', updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // 获取用户邮箱用于删除验证码记录
      const userInfo = await this.env.DB.prepare(
        'SELECT email FROM users WHERE id = ?'
      ).bind(id).first();
      
      // 开始事务处理，确保数据一致性
      // 1. 删除邮箱验证码记录（没有外键约束）
      if (userInfo) {
        await this.env.DB.prepare(
          'DELETE FROM email_verification_codes WHERE email = ?'
        ).bind((userInfo as any).email).run();
      }
      
      // 2. 删除用户设置
      await this.env.DB.prepare(
        'DELETE FROM user_settings WHERE user_id = ?'
      ).bind(id).run();
      
      // 3. 删除用户偏好设置
      await this.env.DB.prepare(
        'DELETE FROM user_preferences WHERE user_id = ?'
      ).bind(id).run();
      
      // 4. 删除用户点赞记录
      await this.env.DB.prepare(
        'DELETE FROM user_likes WHERE user_id = ?'
      ).bind(id).run();
      
      // 5. 删除用户收藏记录
      await this.env.DB.prepare(
        'DELETE FROM user_favorites WHERE user_id = ?'
      ).bind(id).run();
      
      // 6. 删除用户下载记录
      await this.env.DB.prepare(
        'DELETE FROM download_logs WHERE user_id = ?'
      ).bind(id).run();
      
      // 7. 删除用户订单记录
      await this.env.DB.prepare(
        'DELETE FROM orders WHERE user_id = ?'
      ).bind(id).run();
      
      // 8. 删除创作者申请记录
      await this.env.DB.prepare(
        'DELETE FROM creator_applications WHERE user_id = ?'
      ).bind(id).run();
      
      // 9. 删除用户的文件记录
      await this.env.DB.prepare(
        'DELETE FROM files WHERE user_id = ?'
      ).bind(id).run();
      
      // 10. 删除用户的评价记录
      await this.env.DB.prepare(
        'DELETE FROM reviews WHERE user_id = ?'
      ).bind(id).run();
      
      // 11. 删除用户工作流关系记录
      await this.env.DB.prepare(
        'DELETE FROM user_workflows WHERE user_id = ?'
      ).bind(id).run();
      
      // 12. 删除用户的交易记录
      await this.env.DB.prepare(
        'DELETE FROM transactions WHERE user_id = ?'
      ).bind(id).run();
      
      // 13. 删除用户的广告记录
      await this.env.DB.prepare(
        'DELETE FROM advertisements WHERE advertiser_id = ?'
      ).bind(id).run();
      
      // 14. AI应用相关数据已移除，跳过相关清理操作
      
      // 15. 删除接收到的通知
      await this.env.DB.prepare(
        'DELETE FROM notifications WHERE recipient_id = ?'
      ).bind(id).run();
      
      // 16. 将发送的通知的sender_id设置为NULL（保留通知记录但匿名化发送者）
      await this.env.DB.prepare(
        'UPDATE notifications SET sender_id = NULL WHERE sender_id = ?'
      ).bind(id).run();
      
      // 17. 将管理员日志中的admin_id设置为NULL（保留日志记录但匿名化管理员）
      await this.env.DB.prepare(
        'UPDATE admin_logs SET admin_id = NULL WHERE admin_id = ?'
      ).bind(id).run();
      

      
      // 20. 最后删除用户记录
      const result = await this.env.DB.prepare(
        'DELETE FROM users WHERE id = ?'
      ).bind(id).run();

      return result.success;
    } catch (error) {
      console.error('删除用户时发生错误:', error);
      return false;
    }
  }

  // 统计数据
  async getDashboardStats(): Promise<any> {
    const [userStats, workflowStats, downloadStats, creatorApplicationStats] = await Promise.all([
      this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_users
        FROM users
      `).first(),

      Promise.resolve({
        total_workflows: 0,
        pending_workflows: 0,
        approved_workflows: 0,
        new_workflows: 0,
        total_downloads: 0,
        total_revenue: 0
      }),

      Promise.resolve({ today_downloads: 0 }),
      this.env.DB.prepare(`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_creator_applications
        FROM creator_applications
      `).first()
      // AI apps related statistics removed as ai_apps table no longer exists
    ]);

    const totalRevenue = parseFloat((workflowStats as any)?.total_revenue || '0');
    
    return {
      totalUsers: (userStats as any)?.total_users || 0,
      activeUsers: (userStats as any)?.active_users || 0,
      newUsers: (userStats as any)?.new_users || 0,
      totalWorkflows: (workflowStats as any)?.total_workflows || 0,
      pendingWorkflows: (workflowStats as any)?.pending_workflows || 0,
      // pendingAIApps removed as ai_apps table no longer exists
      pendingCreatorApplications: (creatorApplicationStats as any)?.pending_creator_applications || 0,
      todayDownloads: (downloadStats as any)?.today_downloads || 0,
      totalRevenue: totalRevenue,
      monthlyRevenue: totalRevenue * 0.3 // 假设30%是本月收入
    };
  }

  // 创作者申请相关操作
  async getCreatorApplications(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const {
      page = 1,
      pageSize = 20,
      status
    } = params;

    // 构建查询条件
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (status && status !== 'all') {
      conditions.push('ca.status = ?');
      bindings.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM creator_applications ca ${whereClause}`
    ).bind(...bindings).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const applications = await this.env.DB.prepare(`
      SELECT 
        ca.*,
        u.username,
        u.email,
        u.avatar_url,
        reviewer.username as reviewer_name
      FROM creator_applications ca
      LEFT JOIN users u ON ca.user_id = u.id
      LEFT JOIN users reviewer ON ca.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY ca.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();

    const items = (applications.results as any[])?.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      country: row.country,
      linkedin: row.linkedin,
      experience: row.experience,
      portfolio: row.portfolio,
      reason: row.reason,
      skills: row.skills,
      status: row.status,
      admin_comment: row.admin_comment,
      reviewed_by: row.reviewed_by,
      reviewer_name: row.reviewer_name,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    })) || [];

    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async reviewCreatorApplication(id: number, reviewData: {
    status: 'approved' | 'rejected';
    admin_comment?: string;
    reviewed_by: number;
  }): Promise<any | null> {
    const now = new Date().toISOString();
    
    // 更新申请状态
    const result = await this.env.DB.prepare(`
      UPDATE creator_applications 
      SET status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      reviewData.status,
      reviewData.admin_comment || null,
      reviewData.reviewed_by,
      now,
      now,
      id
    ).run();

    if (!result.success) {
      return null;
    }

    // 获取申请信息用于发送通知
    const application = await this.env.DB.prepare(
      'SELECT user_id FROM creator_applications WHERE id = ?'
    ).bind(id).first();
    
    if (application) {
      const userId = (application as any).user_id;
      
      // 如果申请通过，更新用户角色为创作者
      if (reviewData.status === 'approved') {
        await this.env.DB.prepare(
          'UPDATE users SET role = ?, updated_at = ? WHERE id = ?'
        ).bind('creator', now, userId).run();
      }
      
      // 发送站内信通知
      const notificationTitle = reviewData.status === 'approved' 
        ? '🎉 创作者申请审核通过！' 
        : '❌ 创作者申请审核未通过';
      
      const notificationContent = reviewData.status === 'approved'
        ? '恭喜您！您的创作者申请已通过审核，现在您可以开始创建和销售工作流了。欢迎加入我们的创作者社区！'
        : `很抱歉，您的创作者申请未通过审核。${reviewData.admin_comment ? '审核意见：' + reviewData.admin_comment : '请完善您的申请信息后重新提交。'}`;
      
      await this.createNotification({
        recipient_id: userId,
        sender_id: reviewData.reviewed_by,
        type: 'creator_application',
        title: notificationTitle,
        content: notificationContent
      });
    }

    // 返回更新后的申请信息
    const updatedApplication = await this.env.DB.prepare(`
      SELECT 
        ca.*,
        u.username,
        u.email,
        u.avatar_url,
        reviewer.username as reviewer_name
      FROM creator_applications ca
      LEFT JOIN users u ON ca.user_id = u.id
      LEFT JOIN users reviewer ON ca.reviewed_by = reviewer.id
      WHERE ca.id = ?
    `).bind(id).first();

    if (!updatedApplication) {
      return null;
    }

    const row = updatedApplication as any;
    return {
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      country: row.country,
      linkedin: row.linkedin,
      experience: row.experience,
      portfolio: row.portfolio,
      reason: row.reason,
      skills: row.skills,
      status: row.status,
      admin_comment: row.admin_comment,
      reviewed_by: row.reviewed_by,
      reviewer_name: row.reviewer_name,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // 消息通知相关操作
  async createNotification(data: NotificationCreateRequest): Promise<Notification> {
    const now = new Date().toISOString();
    
    const result = await this.env.DB.prepare(`
      INSERT INTO notifications (
        recipient_id, sender_id, type, title, content, is_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.recipient_id,
      data.sender_id || null,
      data.type,
      data.title,
      data.content,
      false,
      now,
      now
    ).run();

    if (!result.success || !result.meta?.last_row_id) {
      throw new Error('Failed to create notification');
    }

    const notification = await this.env.DB.prepare(
      'SELECT * FROM notifications WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return this.mapNotificationFromDB(notification as any);
  }

  async getNotifications(params: NotificationSearchParams): Promise<PaginatedResponse<Notification>> {
    const {
      recipient_id,
      is_read,
      type,
      page = 1,
      pageSize = 20
    } = params;

    // 构建查询条件
    const conditions: string[] = ['recipient_id = ?'];
    const bindings: any[] = [recipient_id];

    if (is_read !== undefined) {
      conditions.push('is_read = ?');
      bindings.push(is_read);
    }

    if (type) {
      conditions.push('type = ?');
      bindings.push(type);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 获取总数
    const countResult = await this.env.DB.prepare(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`
    ).bind(...bindings).first();

    const total = ((countResult as any)?.total as number) || 0;

    // 获取分页数据
    const offset = (page - 1) * pageSize;
    const notifications = await this.env.DB.prepare(`
      SELECT 
        n.*,
        sender.username as sender_username,
        sender.avatar_url as sender_avatar
      FROM notifications n
      LEFT JOIN users sender ON n.sender_id = sender.id
      ${whereClause}
      ORDER BY n.created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(...bindings, pageSize, offset).all();

    const items = (notifications.results as any[])?.map((row: any) => ({
      ...this.mapNotificationFromDB(row),
      sender_username: row.sender_username,
      sender_avatar: row.sender_avatar
    })) || [];

    return {
      items,
      pagination: {
        current: page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await this.env.DB.prepare(
      'UPDATE notifications SET is_read = ?, updated_at = ? WHERE id = ?'
    ).bind(true, new Date().toISOString(), id).run();

    return result.success;
  }

  async markAllNotificationsAsRead(recipient_id: number): Promise<boolean> {
    const result = await this.env.DB.prepare(
      'UPDATE notifications SET is_read = ?, updated_at = ? WHERE recipient_id = ? AND is_read = ?'
    ).bind(true, new Date().toISOString(), recipient_id, false).run();

    return result.success;
  }

  async getUnreadNotificationCount(recipient_id: number): Promise<number> {
    const result = await this.env.DB.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = ?'
    ).bind(recipient_id, false).first();

    return ((result as any)?.count as number) || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await this.env.DB.prepare(
      'DELETE FROM notifications WHERE id = ?'
    ).bind(id).run();

    return result.success;
  }

  // 管理员日志相关操作
  async addAdminLog(logData: {
    admin_id: number;
    action: string;
    target_type: string;
    target_id: number;
    details: string;
  }): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // 首先检查admin_logs表是否存在，如果不存在则创建
      await this.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          target_type TEXT NOT NULL,
          target_id INTEGER NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES users(id)
        )
      `).run();
      
      // 创建索引（如果不存在）
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id)
      `).run();
      
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)
      `).run();
      
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_type, target_id)
      `).run();
      
      await this.env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at)
      `).run();
      
      // 插入日志记录
      await this.env.DB.prepare(`
        INSERT INTO admin_logs (
          admin_id, action, target_type, target_id, details, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        logData.admin_id,
        logData.action,
        logData.target_type,
        logData.target_id,
        logData.details,
        now
      ).run();
    } catch (error) {
      console.error('addAdminLog error:', error);
      // 重新抛出错误，让调用方决定如何处理
      throw error;
    }
  }

  // 添加通知方法
  async addNotification(notificationData: {
    user_id: number;
    type: string;
    title: string;
    content: string;
    related_id?: number;
  }): Promise<void> {
    const now = new Date().toISOString();
    
    await this.env.DB.prepare(`
      INSERT INTO notifications (
        recipient_id, type, title, content, related_id, is_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notificationData.user_id,
      notificationData.type,
      notificationData.title,
      notificationData.content,
      notificationData.related_id || null,
      false,
      now,
      now
    ).run();
  }

  // 文件相关操作
  async getFileByPath(filePath: string): Promise<{ id: number; user_id: number; filename: string } | null> {
    const result = await this.env.DB.prepare(
      'SELECT id, user_id, filename FROM files WHERE filename = ?'
    ).bind(filePath).first();

    return result ? {
      id: (result as any).id,
      user_id: (result as any).user_id,
      filename: (result as any).filename
    } : null;
  }

  // 用户设置相关操作
  async getUserSettings(user_id: number): Promise<UserSettings | null> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM user_settings WHERE user_id = ?'
    ).bind(user_id).first();

    return result ? this.mapUserSettingsFromDB(result as any) : null;
  }

  async createOrUpdateUserSettings(user_id: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    const now = new Date().toISOString();
    const existing = await this.getUserSettings(user_id);

    if (existing) {
      // 更新现有设置
      const setClause = Object.keys(settings)
        .filter(key => key !== 'id' && key !== 'user_id' && key !== 'created_at')
        .map(key => `${key} = ?`)
        .join(', ');
      
      if (setClause) {
        const values = Object.entries(settings)
          .filter(([key]) => key !== 'id' && key !== 'user_id' && key !== 'created_at')
          .map(([, value]) => value);
        
        values.push(now); // updated_at
        values.push(user_id);

        await this.env.DB.prepare(`
          UPDATE user_settings SET ${setClause}, updated_at = ? WHERE user_id = ?
        `).bind(...values).run();
      }
    } else {
      // 创建新设置
      await this.env.DB.prepare(`
        INSERT INTO user_settings (
          user_id, email_notifications, push_notifications, welcome_shown, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        user_id,
        settings.email_notifications ?? true,
        settings.push_notifications ?? true,
        settings.welcome_shown ?? false,
        now,
        now
      ).run();
    }

    const updatedSettings = await this.getUserSettings(user_id);
    if (!updatedSettings) {
      throw new Error('Failed to create or update user settings');
    }

    return updatedSettings;
  }

  // 辅助方法
  private mapUserFromDB(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role,
      balance: parseFloat(row.balance || '0'),
      total_earnings: parseFloat(row.total_earnings || '0'),
      wh_coins: parseInt(row.wh_coins || '0'),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      avatar_url: row.avatar_url,
      oauth_provider: row.oauth_provider,
      oauth_id: row.oauth_id,
      password_hash: row.password_hash,
      wechat_openid: row.wechat_openid,
      phone: row.phone
    };
  }

  // mapWorkflowFromDB method removed - workflows table no longer exists

  private mapNotificationFromDB(row: any): Notification {
    return {
      id: row.id,
      recipient_id: row.recipient_id,
      sender_id: row.sender_id,
      type: row.type,
      title: row.title,
      content: row.content,
      is_read: Boolean(row.is_read),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapUserSettingsFromDB(row: any): UserSettings {
    return {
      id: row.id,
      user_id: row.user_id,
      email_notifications: Boolean(row.email_notifications),
      push_notifications: Boolean(row.push_notifications),
      welcome_shown: Boolean(row.welcome_shown),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }


// ==================== 社区帖子相关方法 ====================

  // 获取AI应用的社区帖子列表
  async getCommunityPosts(aiAppId: number, page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const offset = (page - 1) * limit;
      
      const posts = await this.env.DB.prepare(`
        SELECT 
          cp.id,
          cp.content,
          cp.like_count,
          cp.reply_count,
          cp.created_at,
          u.id as user_id,
          u.username,
          u.avatar_url
        FROM community_posts cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.ai_app_id = ? AND cp.status = 'active'
        ORDER BY cp.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(aiAppId, limit, offset).all();

      const totalResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM community_posts 
        WHERE ai_app_id = ? AND status = 'active'
      `).bind(aiAppId).first();

      const total = (totalResult as any)?.total || 0;
      const totalPages = Math.ceil(total / limit);

      const formattedPosts = posts.results.map((post: any) => ({
        id: post.id,
        content: post.content,
        like_count: post.like_count,
        reply_count: post.reply_count,
        created_at: post.created_at,
        user: {
          id: post.user_id,
          username: post.username,
          avatar_url: post.avatar_url
        }
      }));

      return {
        success: true,
        data: {
          posts: formattedPosts,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('Get community posts error:', error);
      return { success: false, message: '获取帖子列表失败' };
    }
  }

  // 创建社区帖子
  async createCommunityPost(aiAppId: number, userId: number, content: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.env.DB.prepare(`
        INSERT INTO community_posts (ai_app_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(aiAppId, userId, content, now, now).run();

      if (!result.success) {
        return { success: false, message: '创建帖子失败' };
      }

      // 获取用户信息
      const user = await this.env.DB.prepare(`
        SELECT id, username, avatar_url FROM users WHERE id = ?
      `).bind(userId).first();

      const newPost = {
        id: result.meta.last_row_id,
        content,
        like_count: 0,
        reply_count: 0,
        created_at: now,
        user: {
          id: userId,
          username: (user as any)?.username,
          avatar_url: (user as any)?.avatar_url
        }
      };

      return { success: true, data: newPost };
    } catch (error) {
      console.error('Create community post error:', error);
      return { success: false, message: '创建帖子失败' };
    }
  }

  // 切换帖子点赞状态
  async togglePostLike(postId: number, userId: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      // 检查是否已经点赞
      const existingLike = await this.env.DB.prepare(`
        SELECT id FROM community_post_likes WHERE post_id = ? AND user_id = ?
      `).bind(postId, userId).first();

      const now = new Date().toISOString();
      let isLiked = false;

      if (existingLike) {
        // 取消点赞
        await this.env.DB.prepare(`
          DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?
        `).bind(postId, userId).run();
        
        // 减少点赞数
        await this.env.DB.prepare(`
          UPDATE community_posts SET like_count = like_count - 1 WHERE id = ?
        `).bind(postId).run();
        
        isLiked = false;
      } else {
        // 添加点赞
        await this.env.DB.prepare(`
          INSERT INTO community_post_likes (post_id, user_id, created_at)
          VALUES (?, ?, ?)
        `).bind(postId, userId, now).run();
        
        // 增加点赞数
        await this.env.DB.prepare(`
          UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?
        `).bind(postId).run();
        
        isLiked = true;
      }

      // 获取更新后的点赞数
      const post = await this.env.DB.prepare(`
        SELECT like_count FROM community_posts WHERE id = ?
      `).bind(postId).first();

      return {
        success: true,
        data: {
          isLiked,
          likeCount: (post as any)?.like_count || 0
        }
      };
    } catch (error) {
      console.error('Toggle post like error:', error);
      return { success: false, message: '操作失败' };
    }
  }

  // 获取帖子回复列表
  async getPostReplies(postId: number, page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const offset = (page - 1) * limit;
      
      const replies = await this.env.DB.prepare(`
        SELECT 
          cpr.id,
          cpr.content,
          cpr.like_count,
          cpr.created_at,
          u.id as user_id,
          u.username,
          u.avatar_url
        FROM community_post_replies cpr
        LEFT JOIN users u ON cpr.user_id = u.id
        WHERE cpr.post_id = ? AND cpr.status = 'active'
        ORDER BY cpr.created_at ASC
        LIMIT ? OFFSET ?
      `).bind(postId, limit, offset).all();

      const totalResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM community_post_replies 
        WHERE post_id = ? AND status = 'active'
      `).bind(postId).first();

      const total = (totalResult as any)?.total || 0;
      const totalPages = Math.ceil(total / limit);

      const formattedReplies = replies.results.map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        like_count: reply.like_count,
        created_at: reply.created_at,
        user: {
          id: reply.user_id,
          username: reply.username,
          avatar_url: reply.avatar_url
        }
      }));

      return {
        success: true,
        data: {
          replies: formattedReplies,
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };
    } catch (error) {
      console.error('Get post replies error:', error);
      return { success: false, message: '获取回复列表失败' };
    }
  }

  // 创建帖子回复
  async createPostReply(postId: number, userId: number, content: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const now = new Date().toISOString();
      
      const result = await this.env.DB.prepare(`
        INSERT INTO community_post_replies (post_id, user_id, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(postId, userId, content, now, now).run();

      if (!result.success) {
        return { success: false, message: '创建回复失败' };
      }

      // 增加帖子的回复数
      await this.env.DB.prepare(`
        UPDATE community_posts SET reply_count = reply_count + 1 WHERE id = ?
      `).bind(postId).run();

      // 获取用户信息
      const user = await this.env.DB.prepare(`
        SELECT id, username, avatar_url FROM users WHERE id = ?
      `).bind(userId).first();

      const newReply = {
        id: result.meta.last_row_id,
        content,
        like_count: 0,
        created_at: now,
        user: {
          id: userId,
          username: (user as any)?.username,
          avatar_url: (user as any)?.avatar_url
        }
      };

      return { success: true, data: newReply };
    } catch (error) {
      console.error('Create post reply error:', error);
      return { success: false, message: '创建回复失败' };
    }
  }

  // 地区分类管理方法
  async getCategoriesByRegion(region: 'global' | 'china' | 'usa' = 'global'): Promise<Category[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM categories 
        WHERE region = ? AND is_active = 1 
        ORDER BY sort_order ASC, name ASC
      `).bind(region).all();
      
      return (result.results as any[])?.map(row => ({
        id: row.id,
        name: row.name,
        parent_id: row.parent_id,
        description: row.description,
        icon_url: row.icon_url,
        sort_order: row.sort_order,
        is_active: !!row.is_active,
        region: row.region
      })) || [];
    } catch (error) {
      console.error('Error getting categories by region:', error);
      return [];
    }
  }

  // 标签管理方法
  async getTagsByRegion(region: 'global' | 'china' | 'usa' = 'global', categoryId?: number): Promise<any[]> {
    try {
      let query = `
        SELECT t.*, c.name as category_name, u.username as creator_username
        FROM tags t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.region = ? AND t.is_active = 1
      `;
      const params: any[] = [region];
      
      if (categoryId) {
        query += ' AND t.category_id = ?';
        params.push(categoryId);
      }
      
      query += ' ORDER BY t.usage_count DESC, t.name ASC';
      
      const result = await this.env.DB.prepare(query).bind(...params).all();
      
      return (result.results as any[])?.map(row => ({
        id: row.id,
        name: row.name,
        category_id: row.category_id,
        region: row.region,
        color: row.color,
        description: row.description,
        usage_count: row.usage_count,
        is_active: !!row.is_active,
        is_system: !!row.is_system,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
        creator: row.creator_username ? { id: row.created_by, username: row.creator_username } : null
      })) || [];
    } catch (error) {
      console.error('Error getting tags by region:', error);
      return [];
    }
  }

  // 创建分类申请
  async createCategoryRequest(requestData: {
    user_id: number;
    name: string;
    parent_id?: number;
    region: 'china' | 'usa';
    description?: string;
    reason: string;
  }): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO category_requests (user_id, name, parent_id, region, description, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        requestData.user_id,
        requestData.name,
        requestData.parent_id || null,
        requestData.region,
        requestData.description || null,
        requestData.reason
      ).run();
      
      if (result.success) {
        return await this.getCategoryRequestById(result.meta.last_row_id as number);
      }
      throw new Error('Failed to create category request');
    } catch (error) {
      console.error('Error creating category request:', error);
      throw error;
    }
  }

  // 创建标签申请
  async createTagRequest(requestData: {
    user_id: number;
    name: string;
    category_id?: number;
    region: 'china' | 'usa';
    color?: string;
    description?: string;
    reason: string;
  }): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO tag_requests (user_id, name, category_id, region, color, description, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        requestData.user_id,
        requestData.name,
        requestData.category_id || null,
        requestData.region,
        requestData.color || '#3B82F6',
        requestData.description || null,
        requestData.reason
      ).run();
      
      if (result.success) {
        return await this.getTagRequestById(result.meta.last_row_id as number);
      }
      throw new Error('Failed to create tag request');
    } catch (error) {
      console.error('Error creating tag request:', error);
      throw error;
    }
  }

  // 获取分类申请列表
  async getCategoryRequests(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    region?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const queryParams: any[] = [];
      
      if (params.status) {
        whereClause += ' AND cr.status = ?';
        queryParams.push(params.status);
      }
      
      if (params.region) {
        whereClause += ' AND cr.region = ?';
        queryParams.push(params.region);
      }
      
      // 获取总数
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM category_requests cr
        WHERE ${whereClause}
      `).bind(...queryParams).first();
      
      const total = (countResult as any)?.total || 0;
      
      // 获取数据
      const result = await this.env.DB.prepare(`
        SELECT cr.*, u.username, u.avatar_url, pc.name as parent_category_name,
               a.username as admin_username, cc.name as created_category_name
        FROM category_requests cr
        LEFT JOIN users u ON cr.user_id = u.id
        LEFT JOIN categories pc ON cr.parent_id = pc.id
        LEFT JOIN users a ON cr.admin_id = a.id
        LEFT JOIN categories cc ON cr.created_category_id = cc.id
        WHERE ${whereClause}
        ORDER BY cr.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...queryParams, pageSize, offset).all();
      
      const items = (result.results as any[])?.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        parent_id: row.parent_id,
        region: row.region,
        description: row.description,
        reason: row.reason,
        status: row.status,
        admin_id: row.admin_id,
        admin_comment: row.admin_comment,
        created_category_id: row.created_category_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
        parent_category: row.parent_category_name ? { id: row.parent_id, name: row.parent_category_name } : null,
        admin: row.admin_username ? { id: row.admin_id, username: row.admin_username } : null,
        created_category: row.created_category_name ? { id: row.created_category_id, name: row.created_category_name } : null
      })) || [];
      
      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('Error getting category requests:', error);
      throw error;
    }
  }

  // 获取标签申请列表
  async getTagRequests(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    region?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const offset = (page - 1) * pageSize;
      
      let whereClause = '1=1';
      const queryParams: any[] = [];
      
      if (params.status) {
        whereClause += ' AND tr.status = ?';
        queryParams.push(params.status);
      }
      
      if (params.region) {
        whereClause += ' AND tr.region = ?';
        queryParams.push(params.region);
      }
      
      // 获取总数
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total 
        FROM tag_requests tr
        WHERE ${whereClause}
      `).bind(...queryParams).first();
      
      const total = (countResult as any)?.total || 0;
      
      // 获取数据
      const result = await this.env.DB.prepare(`
        SELECT tr.*, u.username, u.avatar_url, c.name as category_name,
               a.username as admin_username, ct.name as created_tag_name
        FROM tag_requests tr
        LEFT JOIN users u ON tr.user_id = u.id
        LEFT JOIN categories c ON tr.category_id = c.id
        LEFT JOIN users a ON tr.admin_id = a.id
        LEFT JOIN tags ct ON tr.created_tag_id = ct.id
        WHERE ${whereClause}
        ORDER BY tr.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...queryParams, pageSize, offset).all();
      
      const items = (result.results as any[])?.map(row => ({
        id: row.id,
        user_id: row.user_id,
        name: row.name,
        category_id: row.category_id,
        region: row.region,
        color: row.color,
        description: row.description,
        reason: row.reason,
        status: row.status,
        admin_id: row.admin_id,
        admin_comment: row.admin_comment,
        created_tag_id: row.created_tag_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url },
        category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
        admin: row.admin_username ? { id: row.admin_id, username: row.admin_username } : null,
        created_tag: row.created_tag_name ? { id: row.created_tag_id, name: row.created_tag_name } : null
      })) || [];
      
      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('Error getting tag requests:', error);
      throw error;
    }
  }

  // 审核分类申请
  async reviewCategoryRequest(
    requestId: number,
    adminId: number,
    status: 'approved' | 'rejected',
    adminComment?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 获取申请详情
      const request = await this.getCategoryRequestById(requestId);
      if (!request) {
        return { success: false, message: '申请不存在' };
      }
      
      if (request.status !== 'pending') {
        return { success: false, message: '申请已被处理' };
      }
      
      let createdCategoryId = null;
      
      if (status === 'approved') {
        // 创建新分类
        const categoryResult = await this.env.DB.prepare(`
          INSERT INTO categories (name, parent_id, description, region, sort_order)
          VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories WHERE region = ?))
        `).bind(
          request.name,
          request.parent_id || null,
          request.description || null,
          request.region,
          request.region
        ).run();
        
        if (categoryResult.success) {
          createdCategoryId = categoryResult.meta.last_row_id as number;
        }
      }
      
      // 更新申请状态
      const updateResult = await this.env.DB.prepare(`
        UPDATE category_requests 
        SET status = ?, admin_id = ?, admin_comment = ?, created_category_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, adminId, adminComment || null, createdCategoryId, requestId).run();
      
      if (updateResult.success) {
        // 发送通知给申请用户
        await this.createNotification({
          recipient_id: request.user_id,
          sender_id: adminId,
          type: status === 'approved' ? 'system' : 'system',
          title: status === 'approved' ? '分类申请已通过' : '分类申请被拒绝',
          content: status === 'approved' 
            ? `您申请的分类「${request.name}」已通过审核` 
            : `您申请的分类「${request.name}」被拒绝：${adminComment || '无具体原因'}`
        });
        
        return { success: true, message: '审核完成' };
      }
      
      return { success: false, message: '更新申请状态失败' };
    } catch (error) {
      console.error('Error reviewing category request:', error);
      return { success: false, message: '审核失败' };
    }
  }

  // 审核标签申请
  async reviewTagRequest(
    requestId: number,
    adminId: number,
    status: 'approved' | 'rejected',
    adminComment?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 获取申请详情
      const request = await this.getTagRequestById(requestId);
      if (!request) {
        return { success: false, message: '申请不存在' };
      }
      
      if (request.status !== 'pending') {
        return { success: false, message: '申请已被处理' };
      }
      
      let createdTagId = null;
      
      if (status === 'approved') {
        // 创建新标签
        const tagResult = await this.env.DB.prepare(`
          INSERT INTO tags (name, category_id, region, color, description, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          request.name,
          request.category_id || null,
          request.region,
          request.color,
          request.description || null,
          request.user_id
        ).run();
        
        if (tagResult.success) {
          createdTagId = tagResult.meta.last_row_id as number;
        }
      }
      
      // 更新申请状态
      const updateResult = await this.env.DB.prepare(`
        UPDATE tag_requests 
        SET status = ?, admin_id = ?, admin_comment = ?, created_tag_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(status, adminId, adminComment || null, createdTagId, requestId).run();
      
      if (updateResult.success) {
        // 发送通知给申请用户
        await this.createNotification({
          recipient_id: request.user_id,
          sender_id: adminId,
          type: status === 'approved' ? 'system' : 'system',
          title: status === 'approved' ? '标签申请已通过' : '标签申请被拒绝',
          content: status === 'approved' 
            ? `您申请的标签「${request.name}」已通过审核` 
            : `您申请的标签「${request.name}」被拒绝：${adminComment || '无具体原因'}`
        });
        
        return { success: true, message: '审核完成' };
      }
      
      return { success: false, message: '更新申请状态失败' };
    } catch (error) {
      console.error('Error reviewing tag request:', error);
      return { success: false, message: '审核失败' };
    }
  }

  // 获取分类申请详情
  private async getCategoryRequestById(id: number): Promise<any | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM category_requests WHERE id = ?
      `).bind(id).first();
      
      return result as any;
    } catch (error) {
      console.error('Error getting category request by id:', error);
      return null;
    }
  }

  // 获取标签申请详情
  private async getTagRequestById(id: number): Promise<any | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM tag_requests WHERE id = ?
      `).bind(id).first();
      
      return result as any;
    } catch (error) {
      console.error('Error getting tag request by id:', error);
      return null;
    }
  }

  // 服务器管理相关操作
  async getServers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    server_type?: string;
    status?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, search = '', server_type = '', status = '' } = params;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const bindings: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ? OR url LIKE ?)';
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }

    if (server_type) {
      whereClause += ' AND server_type = ?';
      bindings.push(server_type);
    }

    if (status) {
      whereClause += ' AND status = ?';
      bindings.push(status);
    }

    try {
      // 获取总数
      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as total FROM servers ${whereClause}
      `).bind(...bindings).first();

      const total = (countResult as any)?.total || 0;

      // 获取数据
      const dataResult = await this.env.DB.prepare(`
        SELECT s.*, u.username as creator_name
        FROM servers s
        LEFT JOIN users u ON s.created_by = u.id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(...bindings, pageSize, offset).all();

      return {
        items: dataResult.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('获取服务器列表失败:', error);
      return {
        items: [],
        pagination: {
          current: page,
          pageSize,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  async getServerById(id: number): Promise<any | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT s.*, u.username as creator_name
        FROM servers s
        LEFT JOIN users u ON s.created_by = u.id
        WHERE s.id = ?
      `).bind(id).first();

      return result || null;
    } catch (error) {
      console.error('获取服务器详情失败:', error);
      return null;
    }
  }

  async createServer(serverData: {
    name: string;
    url: string;
    description?: string;
    status?: string;
    server_type?: string;
    location?: string;
    max_users?: number;
    current_users?: number;
    cpu_cores?: number;
    memory_gb?: number;
    storage_gb?: number;
    bandwidth_mbps?: number;
    created_by: number;
  }): Promise<any> {
    const now = new Date().toISOString();
    
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO servers (
          name, url, description, status, server_type, location,
          max_users, current_users, cpu_cores, memory_gb, storage_gb, bandwidth_mbps,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        serverData.name,
        serverData.url,
        serverData.description || '',
        serverData.status || 'active',
        serverData.server_type || 'shared',
        serverData.location || '',
        serverData.max_users || 0,
        serverData.current_users || 0,
        serverData.cpu_cores || null,
        serverData.memory_gb || null,
        serverData.storage_gb || null,
        serverData.bandwidth_mbps || null,
        serverData.created_by,
        now,
        now
      ).run();

      if (!result.success || !result.meta?.last_row_id) {
        throw new Error('Failed to create server');
      }

      return await this.getServerById(result.meta.last_row_id as number);
    } catch (error) {
      console.error('创建服务器失败:', error);
      throw error;
    }
  }

  async updateServer(id: number, updates: {
    name?: string;
    url?: string;
    description?: string;
    status?: string;
    server_type?: string;
    location?: string;
    max_users?: number;
    current_users?: number;
    cpu_cores?: number;
    memory_gb?: number;
    storage_gb?: number;
    bandwidth_mbps?: number;
  }): Promise<any | null> {
    const now = new Date().toISOString();
    
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    if (!setClause) return null;

    const values = Object.values(updates);
    values.push(now); // updated_at
    values.push(id);

    try {
      await this.env.DB.prepare(`
        UPDATE servers SET ${setClause}, updated_at = ? WHERE id = ?
      `).bind(...values).run();

      return await this.getServerById(id);
    } catch (error) {
      console.error('更新服务器失败:', error);
      throw error;
    }
  }

  async deleteServer(id: number): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(
        'DELETE FROM servers WHERE id = ?'
      ).bind(id).run();

      return result.success;
    } catch (error) {
      console.error('删除服务器失败:', error);
      return false;
    }
  }

  // 获取国家/地区列表
  async getCountries(): Promise<any[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM countries 
        WHERE is_active = 1 
        ORDER BY sort_order ASC, name ASC
      `).all();
      
      return (result.results as any[])?.map(row => ({
        id: row.id,
        code: row.code,
        name: row.name,
        name_en: row.name_en,
        sort_order: row.sort_order,
        is_active: !!row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting countries:', error);
      return [];
    }
  }

  // Coze工作流相关操作
  async getCozeWorkflows(params: {
    page?: number;
    pageSize?: number;
    category?: number;
    status?: string;
    creatorId?: number;
    featured?: boolean;
    search?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  } = {}): Promise<PaginatedResponse<any>> {
    try {
      console.log('getCozeWorkflows called with params:', params);
      
      const {
        page = 1,
        pageSize = 20,
        category,
        status,
        creatorId,
        featured,
        search,
        sortBy = 'created_at',
        startDate,
        endDate,
        tags
      } = params;

      let whereClause = 'WHERE 1=1';
      const bindings: any[] = [];

      if (category) {
        whereClause += ' AND cw.category_id = ?';
        bindings.push(category);
      }

      if (status) {
        whereClause += ' AND cw.status = ?';
        bindings.push(status);
      }

      if (creatorId) {
        whereClause += ' AND cw.creator_id = ?';
        bindings.push(creatorId);
      }

      if (featured !== undefined) {
        whereClause += ' AND cw.is_featured = ?';
        bindings.push(featured ? 1 : 0);
      }

      if (search) {
        whereClause += ' AND (cw.title LIKE ? OR cw.description LIKE ?)';
        bindings.push(`%${search}%`, `%${search}%`);
      }

      if (startDate) {
        whereClause += ' AND DATE(cw.updated_at) >= DATE(?)';
        bindings.push(startDate);
      }

      if (endDate) {
        whereClause += ' AND DATE(cw.updated_at) <= DATE(?)';
        bindings.push(endDate);
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(() => 'cw.tags LIKE ?').join(' OR ');
        whereClause += ` AND (${tagConditions})`;
        tags.forEach(tag => bindings.push(`%"${tag}"%`));
      }

      // 排序
      let orderClause = 'ORDER BY cw.created_at DESC';
      switch (sortBy) {
        case 'latest':
          orderClause = 'ORDER BY cw.created_at DESC';
          break;
        case 'popular':
        case 'downloads':
          orderClause = 'ORDER BY cw.download_count DESC';
          break;
        case 'likes':
          orderClause = 'ORDER BY cw.like_count DESC';
          break;
        case 'views':
          orderClause = 'ORDER BY cw.view_count DESC';
          break;
        case 'price_asc':
          orderClause = 'ORDER BY cw.price ASC';
          break;
        case 'price_desc':
          orderClause = 'ORDER BY cw.price DESC';
          break;
        case 'hot':
          // 综合热度：下载量权重40%，点赞数权重30%，浏览量权重30%
          orderClause = 'ORDER BY (cw.download_count * 0.4 + cw.like_count * 0.3 + cw.view_count * 0.3) DESC';
          break;
        default:
          orderClause = 'ORDER BY cw.created_at DESC';
      }

      console.log('Executing count query with whereClause:', whereClause);
      console.log('Bindings:', bindings);

      // 获取总数
      const countResult = await this.env.DB.prepare(
        `SELECT COUNT(*) as total FROM coze_workflows cw ${whereClause}`
      ).bind(...bindings).first();

      const total = ((countResult as any)?.total as number) || 0;
      console.log('Total count:', total);

      // 获取分页数据
      const offset = (page - 1) * pageSize;
      const query = `
        SELECT cw.*, u.username as creator_username, u.avatar_url as creator_avatar_url 
        FROM coze_workflows cw 
        LEFT JOIN users u ON cw.creator_id = u.id 
        ${whereClause} ${orderClause} LIMIT ? OFFSET ?
      `;
      
      console.log('Executing data query:', query);
      console.log('Final bindings:', [...bindings, pageSize, offset]);
      
      const workflows = await this.env.DB.prepare(query).bind(...bindings, pageSize, offset).all();
      
      console.log('Raw coze workflow results:', workflows.results?.length || 0, 'items');
      if (workflows.results && workflows.results.length > 0) {
        console.log('First coze workflow raw data:', workflows.results[0]);
      }

      const items = (workflows.results as any[])?.map((row: any) => {
        try {
          return this.mapCozeWorkflowFromDB(row);
        } catch (mapError) {
          console.error('Error mapping coze workflow from DB:', mapError);
          console.error('Raw row data:', row);
          throw mapError;
        }
      }) || [];

      console.log('Mapped coze workflow items:', items.length);

      return {
        items,
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('getCozeWorkflows error:', error);
      throw error;
    }
  }

  async getCozeWorkflowById(id: number): Promise<any | null> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT cw.*, u.username as creator_username, u.avatar_url as creator_avatar_url 
        FROM coze_workflows cw 
        LEFT JOIN users u ON cw.creator_id = u.id 
        WHERE cw.id = ?
      `).bind(id).first();
      
      return result ? this.mapCozeWorkflowFromDB(result) : null;
    } catch (error) {
      console.error('Error getting coze workflow by id:', error);
      throw error;
    }
  }

  async createCozeWorkflow(data: {
    creator_id: number;
    title: string;
    description?: string;
    category_id: number;
    subcategory_id?: number;
    price?: number;
    download_price?: number;
    is_member_free?: boolean;
    is_download_member_free?: boolean;
    workflow_file_url: string;
    workflow_file_name?: string;
    workflow_file_size?: number;
    cover_image_url?: string;
    preview_video_url?: string;
    preview_images?: string[];
    tags?: string[];
    type?: string;
    coze_api?: string;
    task_id?: string;
    quick_commands?: any[];
    is_featured?: boolean;
    is_official?: boolean;
  }): Promise<any> {
    try {
      const result = await this.env.DB.prepare(`
        INSERT INTO coze_workflows (
          creator_id, title, description, category_id, subcategory_id,
          price, download_price, is_member_free, is_download_member_free, workflow_file_url, workflow_file_name, workflow_file_size,
          cover_image_url, preview_video_url, preview_images, tags,
          type, coze_api, task_id, quick_commands, is_featured, is_official,
          status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `).bind(
        data.creator_id,
        data.title,
        data.description || null,
        data.category_id,
        data.subcategory_id || null,
        data.price || 0,
        data.download_price || 0,
        data.is_member_free ? 1 : 0,
        data.is_download_member_free ? 1 : 0,
        data.workflow_file_url,
        data.workflow_file_name || null,
        data.workflow_file_size || null,
        data.cover_image_url || null,
        data.preview_video_url || null,
        data.preview_images ? JSON.stringify(data.preview_images) : null,
        data.tags ? JSON.stringify(data.tags) : null,
        data.type || 'workflow',
        data.coze_api || null,
        data.task_id || null,
        data.quick_commands ? JSON.stringify(data.quick_commands) : null,
        data.is_featured ? 1 : 0,
        data.is_official ? 1 : 0
      ).run();
      
      if (result.success && result.meta.last_row_id) {
        return await this.getCozeWorkflowById(result.meta.last_row_id as number);
      }
      
      throw new Error('Failed to create coze workflow');
    } catch (error) {
      console.error('Error creating coze workflow:', error);
      throw error;
    }
  }

  async updateCozeWorkflow(id: number, data: {
    title?: string;
    description?: string;
    category_id?: number;
    subcategory_id?: number;
    price?: number;
    download_price?: number;
    is_member_free?: boolean;
    is_download_member_free?: boolean;
    workflow_file_url?: string;
    workflow_file_name?: string;
    workflow_file_size?: number;
    cover_image_url?: string;
    preview_video_url?: string;
    preview_images?: string[];
    tags?: string[];
    type?: string;
    coze_api?: string;
    task_id?: string;
    quick_commands?: any[];
    is_featured?: boolean;
    is_official?: boolean;
  }): Promise<any> {
    try {
      const updates: string[] = [];
      const bindings: any[] = [];
      
      if (data.title !== undefined) {
        updates.push('title = ?');
        bindings.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        bindings.push(data.description);
      }
      if (data.category_id !== undefined) {
        updates.push('category_id = ?');
        bindings.push(data.category_id);
      }
      if (data.subcategory_id !== undefined) {
        updates.push('subcategory_id = ?');
        bindings.push(data.subcategory_id);
      }
      if (data.price !== undefined) {
        updates.push('price = ?');
        bindings.push(data.price);
      }
      if (data.download_price !== undefined) {
        updates.push('download_price = ?');
        bindings.push(data.download_price);
      }
      if (data.is_member_free !== undefined) {
        updates.push('is_member_free = ?');
        bindings.push(data.is_member_free ? 1 : 0);
      }
      if (data.is_download_member_free !== undefined) {
        updates.push('is_download_member_free = ?');
        bindings.push(data.is_download_member_free ? 1 : 0);
      }
      if (data.workflow_file_url !== undefined) {
        updates.push('workflow_file_url = ?');
        bindings.push(data.workflow_file_url);
      }
      if (data.workflow_file_name !== undefined) {
        updates.push('workflow_file_name = ?');
        bindings.push(data.workflow_file_name);
      }
      if (data.workflow_file_size !== undefined) {
        updates.push('workflow_file_size = ?');
        bindings.push(data.workflow_file_size);
      }
      if (data.cover_image_url !== undefined) {
        updates.push('cover_image_url = ?');
        bindings.push(data.cover_image_url);
      }
      if (data.preview_video_url !== undefined) {
        updates.push('preview_video_url = ?');
        bindings.push(data.preview_video_url);
      }
      if (data.preview_images !== undefined) {
        updates.push('preview_images = ?');
        bindings.push(data.preview_images ? JSON.stringify(data.preview_images) : null);
      }
      if (data.tags !== undefined) {
        updates.push('tags = ?');
        bindings.push(data.tags ? JSON.stringify(data.tags) : null);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        bindings.push(data.type);
      }
      if (data.coze_api !== undefined) {
        updates.push('coze_api = ?');
        bindings.push(data.coze_api);
      }
      if (data.task_id !== undefined) {
        updates.push('task_id = ?');
        bindings.push(data.task_id);
      }
      if (data.quick_commands !== undefined) {
        updates.push('quick_commands = ?');
        bindings.push(data.quick_commands ? JSON.stringify(data.quick_commands) : null);
      }
      if (data.is_featured !== undefined) {
        updates.push('is_featured = ?');
        bindings.push(data.is_featured ? 1 : 0);
      }
      if (data.is_official !== undefined) {
        updates.push('is_official = ?');
        bindings.push(data.is_official ? 1 : 0);
      }
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      bindings.push(id);
      
      const result = await this.env.DB.prepare(`
        UPDATE coze_workflows SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run();
      
      if (result.success && result.changes > 0) {
        return await this.getCozeWorkflowById(id);
      }
      
      throw new Error('Failed to update coze workflow');
    } catch (error) {
      console.error('Error updating coze workflow:', error);
      throw error;
    }
  }

  async updateCozeWorkflowStatus(id: number, status: string, reason?: string): Promise<any> {
    try {
      // Log the reason if provided for audit purposes
      if (reason) {
        console.log(`Updating coze workflow ${id} status to ${status}, reason: ${reason}`);
      }
      
      const result = await this.env.DB.prepare(`
        UPDATE coze_workflows SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(status, id).run();
      
      if (result.success && result.changes > 0) {
        return await this.getCozeWorkflowById(id);
      }
      
      throw new Error('Failed to update coze workflow status');
    } catch (error) {
      console.error('Error updating coze workflow status:', error);
      throw error;
    }
  }

  async deleteCozeWorkflow(id: number): Promise<boolean> {
    try {
      // 首先检查工作流是否存在
      const workflow = await this.env.DB.prepare(`
        SELECT id, title, creator_id, status FROM coze_workflows WHERE id = ?
      `).bind(id).first();
      
      if (!workflow) {
        console.log(`Coze workflow ${id} does not exist`);
        return false;
      }
      
      console.log(`Starting deletion of coze workflow ${id}:`, {
        id: workflow.id,
        title: workflow.title,
        creator_id: workflow.creator_id,
        status: workflow.status
      });
      
      // 开始事务，确保所有删除操作要么全部成功，要么全部回滚
      const batch = [
        // 1. 删除相关的视频生成任务
        this.env.DB.prepare(`DELETE FROM video_generation_tasks WHERE workflow_id = ?`).bind(id.toString()),
        
        // 2. 删除用户与工作流的关系记录
        this.env.DB.prepare(`DELETE FROM user_coze_workflows WHERE coze_workflow_id = ?`).bind(id),
        
        // 3. 删除工作流评论
        this.env.DB.prepare(`DELETE FROM coze_workflow_comments WHERE coze_workflow_id = ?`).bind(id),
        
        // 4. 最后删除工作流本身
        this.env.DB.prepare(`DELETE FROM coze_workflows WHERE id = ?`).bind(id)
      ];
      
      console.log(`Executing batch delete for workflow ${id} with ${batch.length} operations`);
      const results = await this.env.DB.batch(batch);
      
      // 检查批处理结果
      const detailedResults = results.map((r: any, i: number) => {
        const operations = ['video_generation_tasks', 'user_coze_workflows', 'coze_workflow_comments', 'coze_workflows'];
        return {
          step: i + 1,
          operation: operations[i],
          success: r.success,
          changes: r.meta ? r.meta.changes : 0,
          error: r.error,
          meta: r.meta
        };
      });
      
      console.log(`Batch delete results for workflow ${id}:`, detailedResults);
      
      // 检查工作流本身是否被成功删除（这是最重要的）
      const workflowDeleteResult = results[results.length - 1];
      const workflowDeleted = workflowDeleteResult.success && workflowDeleteResult.meta && workflowDeleteResult.meta.changes > 0;
      
      if (workflowDeleted) {
        console.log(`Coze workflow ${id} successfully deleted`);
        
        // 检查是否有关联记录删除失败（仅用于日志记录）
        const failedOperations = detailedResults.slice(0, -1).filter((r: any) => !r.success);
        if (failedOperations.length > 0) {
          console.warn(`Some related records deletion failed for workflow ${id}:`, failedOperations);
        }
        
        return true;
      }
      
      // 工作流删除失败
      console.error(`Failed to delete coze workflow ${id}:`, workflowDeleteResult);
      console.error(`工作流删除失败详情:`, {
        workflowId: id,
        workflowTitle: workflow.title,
        deleteResult: workflowDeleteResult,
        allResults: detailedResults
      });
      
      // 检查是否有其他错误
      const hasErrors = results.some((result: any) => !result.success);
      if (hasErrors) {
        const errors = detailedResults.filter((r: any) => !r.success);
        console.error(`Delete operations failed for workflow ${id}:`, errors);
      }
      
      return false;
    } catch (error) {
      console.error(`Error deleting coze workflow ${id}:`, error);
      console.error(`删除工作流异常详情:`, {
        workflowId: id,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // 在异常情况下，检查工作流是否实际已被删除
      try {
        const checkWorkflow = await this.env.DB.prepare(`
          SELECT id FROM coze_workflows WHERE id = ?
        `).bind(id).first();
        
        if (!checkWorkflow) {
          console.log(`Coze workflow ${id} was deleted despite error`);
          return true;
        } else {
          console.error(`Coze workflow ${id} still exists after deletion attempt`);
        }
      } catch (checkError) {
        console.error(`Error checking workflow ${id} after deletion error:`, checkError);
        console.error(`检查工作流存在性时发生错误:`, {
          checkErrorType: checkError instanceof Error ? checkError.constructor.name : typeof checkError,
          checkErrorMessage: checkError instanceof Error ? checkError.message : String(checkError)
        });
      }
      
      throw error;
    }
  }

  private mapCozeWorkflowFromDB(row: any): any {
    return {
      id: row.id,
      creator_id: row.creator_id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      subcategory_id: row.subcategory_id,
      price: row.price,
      download_price: row.download_price,
      is_member_free: Boolean(row.is_member_free),
      is_download_member_free: Boolean(row.is_download_member_free),
      workflow_file_url: row.workflow_file_url,
      workflow_file_name: row.workflow_file_name,
      workflow_file_size: row.workflow_file_size,
      cover_image_url: row.cover_image_url,
      preview_video_url: row.preview_video_url,
      preview_images: row.preview_images ? JSON.parse(row.preview_images) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      like_count: row.like_count || 0,
      favorite_count: row.favorite_count || 0,
      download_count: row.download_count || 0,
      view_count: row.view_count || 0,
      comment_count: row.comment_count || 0,
      status: row.status,
      is_featured: Boolean(row.is_featured),
      is_official: Boolean(row.is_official),
      type: row.type,
      coze_api: row.coze_api,
      task_id: row.task_id,
      quick_commands: row.quick_commands ? JSON.parse(row.quick_commands) : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      // 构建creator对象结构
      creator: row.creator_username ? {
        id: row.creator_id,
        username: row.creator_username,
        avatar_url: row.creator_avatar_url
      } : null
    };
  }

  // 初始佣金管理系统相关方法
  
  // 获取佣金计划列表
  async getInitialCommissionPlans(params: {
    page?: number;
    pageSize?: number;
    status?: string;
  } = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, status } = params;
    const offset = (page - 1) * pageSize;

    try {
      let whereClause = '';
      const bindings: any[] = [];
      
      if (status) {
        // 将前端传入的status参数转换为数据库的is_active字段
        if (status === 'active') {
          whereClause = 'WHERE is_active = ?';
          bindings.push(true);
        } else if (status === 'inactive') {
          whereClause = 'WHERE is_active = ?';
          bindings.push(false);
        }
        // 如果status为其他值（如'all'），则不添加WHERE条件
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM initial_commission_plans ${whereClause}`;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;

      // 获取数据并统计每个计划的用户数量
      const dataQuery = `
        SELECT 
          icp.*,
          COUNT(DISTINCT uicc.user_id) as user_count
        FROM initial_commission_plans icp
        LEFT JOIN user_initial_commission_configs uicc ON icp.id = uicc.plan_id AND uicc.is_active = true
        ${whereClause ? whereClause.replace('WHERE', 'WHERE icp.') : ''}
        GROUP BY icp.id
        ORDER BY icp.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery)
        .bind(...bindings, pageSize, offset)
        .all();

      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('获取佣金计划列表失败:', error);
      throw error;
    }
  }

  // 创建佣金计划
  async createInitialCommissionPlan(planData: {
    name: string;
    description?: string;
    trigger_type: string;
    amount_type: string;
    amount_value: number;
    max_amount?: number;
    valid_days?: number;
    max_uses_per_user?: number;
    total_budget?: number;
    status?: string;
    workflow_threshold?: number;
    auto_trigger?: boolean;
    created_by: number;
  }): Promise<any> {
    try {
      const query = `
        INSERT INTO initial_commission_plans (
          name, description, trigger_type, 
          fixed_amount, payout_cycle, workflow_threshold, auto_trigger, 
          target_user_type, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      const result = await this.env.DB.prepare(query)
        .bind(
          planData.name,
          planData.description || null,
          planData.trigger_type,
          planData.amount_value || 0, // fixed_amount
          7, // payout_cycle 默认7天
          planData.workflow_threshold || null, // workflow_threshold
          planData.auto_trigger || false, // auto_trigger
          'all', // target_user_type 默认所有用户
          planData.status === 'active' || planData.status === undefined, // is_active
          planData.created_by
        )
        .run();

      if (result.success) {
        // 记录管理员操作日志
        await this.addAdminLog({
          admin_id: planData.created_by,
          action: 'create_commission_plan',
          target_type: 'initial_commission_plan',
          target_id: result.meta.last_row_id as number,
          details: `创建佣金计划: ${planData.name}`
        });

        return { id: result.meta.last_row_id, ...planData };
      }
      throw new Error('创建佣金计划失败');
    } catch (error) {
      console.error('创建佣金计划失败:', error);
      throw error;
    }
  }

  // 更新佣金计划
  async updateInitialCommissionPlan(id: number, updates: {
    name?: string;
    description?: string;
    trigger_type?: string;
    fixed_amount?: number;
    payout_cycle?: number;
    workflow_threshold?: number;
    auto_trigger?: boolean;
    target_user_type?: string;
    is_active?: boolean;
    updated_by: number;
  }): Promise<any> {
    try {
      const setParts: string[] = [];
      const bindings: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'updated_by' && value !== undefined) {
          // 直接使用数据库字段名
          setParts.push(`${key} = ?`);
          bindings.push(value);
        }
      });

      setParts.push('updated_at = datetime(\'now\')');
      bindings.push(id);

      const query = `
        UPDATE initial_commission_plans 
        SET ${setParts.join(', ')} 
        WHERE id = ?
      `;

      const result = await this.env.DB.prepare(query).bind(...bindings).run();

      if (result.success) {
        // 记录管理员操作日志
        await this.addAdminLog({
          admin_id: updates.updated_by,
          action: 'update_commission_plan',
          target_type: 'initial_commission_plan',
          target_id: id,
          details: `更新佣金计划: ${JSON.stringify(updates)}`
        });

        return await this.getInitialCommissionPlanById(id);
      }
      throw new Error('更新佣金计划失败');
    } catch (error) {
      console.error('更新佣金计划失败:', error);
      throw error;
    }
  }

  // 删除佣金计划
  async deleteInitialCommissionPlan(id: number, adminId: number): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(
        'DELETE FROM initial_commission_plans WHERE id = ?'
      ).bind(id).run();

      if (result.success) {
        // 记录管理员操作日志
        await this.addAdminLog({
          admin_id: adminId,
          action: 'delete_commission_plan',
          target_type: 'initial_commission_plan',
          target_id: id,
          details: `删除佣金计划 ID: ${id}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除佣金计划失败:', error);
      throw error;
    }
  }

  // 获取单个佣金计划
  async getInitialCommissionPlanById(id: number): Promise<any | null> {
    try {
      const result = await this.env.DB.prepare(
        'SELECT * FROM initial_commission_plans WHERE id = ?'
      ).bind(id).first();
      
      if (result && result.trigger_condition) {
        result.trigger_condition = JSON.parse(result.trigger_condition);
      }
      
      return result;
    } catch (error) {
      console.error('获取佣金计划失败:', error);
      return null;
    }
  }

  // 获取单个佣金计划（别名方法）
  async getInitialCommissionPlan(id: number): Promise<any | null> {
    return this.getInitialCommissionPlanById(id);
  }

  // 获取用户佣金配置列表
  async getUserInitialCommissionConfigs(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    planId?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, search, status, planId } = params;
    const offset = (page - 1) * pageSize;

    try {
      const whereClauses: string[] = [];
      const bindings: any[] = [];
      
      // 只获取创作者用户
      whereClauses.push('u.role = ?');
      bindings.push('creator');
      
      if (search) {
        whereClauses.push('(u.username LIKE ? OR u.email LIKE ?)');
        bindings.push(`%${search}%`, `%${search}%`);
      }
      
      if (status && status !== 'all') {
        // 将前端传入的status参数转换为数据库的is_active字段
        if (status === 'active') {
          whereClauses.push('uicc.is_active = ?');
          bindings.push(true);
        } else if (status === 'inactive') {
          whereClauses.push('uicc.is_active = ?');
          bindings.push(false);
        }
      }
      
      if (planId) {
        whereClauses.push('EXISTS (SELECT 1 FROM initial_commission_plan_users icpu WHERE icpu.user_id = u.id AND icpu.plan_id = ?)');
        bindings.push(planId);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
      `;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;

      // 获取数据
      const dataQuery = `
        SELECT DISTINCT 
          u.id, u.username, u.email, u.avatar_url, u.created_at as user_created_at,
          uicc.is_active as commission_status,
          uicc.created_at as config_created_at, uicc.updated_at as config_updated_at
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
        ORDER BY u.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery)
        .bind(...bindings, pageSize, offset)
        .all();

      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('获取用户佣金配置列表失败:', error);
      throw error;
    }
  }

  // 获取用户佣金配置及发放进度
  async getUserInitialCommissionWithPayouts(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    planId?: number;
  } = {}): Promise<PaginatedResponse<any>> {
    const { page = 1, pageSize = 10, search, status, planId } = params;
    const offset = (page - 1) * pageSize;

    try {
      const whereClauses: string[] = [];
      const bindings: any[] = [];
      
      // 只获取创作者用户
      whereClauses.push('u.role = ?');
      bindings.push('creator');
      
      if (search) {
        whereClauses.push('(u.username LIKE ? OR u.email LIKE ?)');
        bindings.push(`%${search}%`, `%${search}%`);
      }
      
      if (status && status !== 'all') {
        // 将前端传入的status参数转换为数据库的is_active字段
        if (status === 'active') {
          whereClauses.push('uicc.is_active = ?');
          bindings.push(true);
        } else if (status === 'inactive') {
          whereClauses.push('uicc.is_active = ?');
          bindings.push(false);
        }
      }
      
      if (planId) {
        whereClauses.push('EXISTS (SELECT 1 FROM initial_commission_plan_users icpu WHERE icpu.user_id = u.id AND icpu.plan_id = ?)');
        bindings.push(planId);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 获取总数
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        ${whereClause}
      `;
      const countResult = await this.env.DB.prepare(countQuery).bind(...bindings).first();
      const total = countResult?.total || 0;

      // 获取数据，包含佣金计划和发放进度信息
      const dataQuery = `
        SELECT DISTINCT 
          u.id, u.username, u.email, u.avatar_url, u.created_at as user_created_at,
          uicc.is_active as commission_status,
          uicc.created_at as config_created_at, uicc.updated_at as config_updated_at,
          -- 佣金计划信息
          icp.id as plan_id, icp.name as plan_name, icp.fixed_amount, icp.payout_cycle,
          -- 发放进度统计
          (
            SELECT COUNT(*) 
            FROM initial_commission_payouts icp_total 
            WHERE icp_total.user_id = u.id
          ) as total_payouts,
          (
            SELECT COUNT(*) 
            FROM initial_commission_payouts icp_completed 
            WHERE icp_completed.user_id = u.id AND icp_completed.status = 'completed'
          ) as completed_payouts,
          (
            SELECT SUM(amount) 
            FROM initial_commission_payouts icp_paid 
            WHERE icp_paid.user_id = u.id AND icp_paid.status = 'completed'
          ) as total_paid_amount,
          -- 下次发放日期
          (
            SELECT MIN(scheduled_date) 
            FROM initial_commission_payouts icp_next 
            WHERE icp_next.user_id = u.id AND icp_next.status = 'pending'
          ) as next_payout_date,
          -- 待发放金额
          (
            SELECT SUM(amount) 
            FROM initial_commission_payouts icp_pending 
            WHERE icp_pending.user_id = u.id AND icp_pending.status = 'pending'
          ) as pending_amount
        FROM users u 
        LEFT JOIN user_initial_commission_configs uicc ON u.id = uicc.user_id 
        LEFT JOIN initial_commission_plans icp ON uicc.plan_id = icp.id
        ${whereClause}
        ORDER BY u.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const results = await this.env.DB.prepare(dataQuery)
        .bind(...bindings, pageSize, offset)
        .all();

      return {
        items: results.results || [],
        pagination: {
          current: page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
    } catch (error) {
      console.error('获取用户佣金配置及发放进度失败:', error);
      throw error;
    }
  }

  // 更新用户佣金状态
  async updateUserCommissionStatus(userId: number, isActive: boolean, adminId: number): Promise<{
    success: boolean;
    user: { is_active: boolean };
    message?: string;
  }> {
    try {
      
      // 检查用户佣金配置是否存在
      const existingConfig = await this.env.DB.prepare(
        'SELECT id, plan_id, fixed_amount, payout_cycle FROM user_initial_commission_configs WHERE user_id = ?'
      ).bind(userId).first();

      let result;
      let planIds: number[] = [];
      let commissionAmount = 0;
      let payoutCycle = 30; // 默认30天
      
      // 如果启用用户，检查符合条件的计划
      if (isActive) {
        const eligiblePlansResult = await this.getEligibleCommissionPlansForUser(userId);
        planIds = eligiblePlansResult.eligiblePlans.map((plan: any) => plan.id);
        console.log(`用户 ${userId} 符合的计划ID:`, planIds);
        
        // 获取第一个计划的佣金信息
        if (planIds.length > 0) {
          const planInfo = await this.getInitialCommissionPlanById(planIds[0]);
          if (planInfo) {
            commissionAmount = planInfo.fixed_amount || 0;
            payoutCycle = planInfo.payout_cycle || 30;
          }
        }
      }
      
      if (existingConfig) {
        // 更新现有配置
        if (isActive && planIds.length > 0) {
          // 启用时，使用第一个符合条件的计划ID和佣金信息
          result = await this.env.DB.prepare(
            `UPDATE user_initial_commission_configs SET 
             is_active = ?, plan_id = ?, fixed_amount = ?, payout_cycle = ?, 
             next_payout_date = date('now', '+' || ? || ' days'),
             activated_at = datetime('now'), activated_by = ?,
             updated_at = datetime('now') 
             WHERE user_id = ?`
          ).bind(isActive, planIds[0], commissionAmount, payoutCycle, payoutCycle, adminId, userId).run();
        } else {
          // 禁用时，记录停用时间
          result = await this.env.DB.prepare(
            'UPDATE user_initial_commission_configs SET is_active = ?, deactivated_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE user_id = ?'
          ).bind(isActive, userId).run();
        }
      } else {
        // 创建新配置
        const planId = (isActive && planIds.length > 0) ? planIds[0] : null;
        const nextPayoutDate = isActive ? `date('now', '+${payoutCycle} days')` : null;
        
        result = await this.env.DB.prepare(
          `INSERT INTO user_initial_commission_configs 
           (user_id, is_active, plan_id, fixed_amount, payout_cycle, next_payout_date, 
            total_received, payout_count, workflow_count, activated_at, activated_by, created_at) 
           VALUES (?, ?, ?, ?, ?, ${nextPayoutDate}, 0, 0, 0, datetime('now'), ?, datetime('now'))`
        ).bind(userId, isActive, planId, commissionAmount, payoutCycle, adminId).run();
      }

      if (result.success) {
        // 如果启用用户且有佣金计划，创建佣金分配记录
        if (isActive && planIds.length > 0 && commissionAmount > 0) {
          await this.createCommissionDistributionRecords(userId, planIds[0], commissionAmount, payoutCycle, adminId, '管理员启用用户佣金');
        }
        
        // 如果有多个符合条件的计划，为每个计划分配用户
        if (isActive && planIds.length > 1) {
          for (let i = 1; i < planIds.length; i++) {
            await this.assignCommissionPlanToUser(planIds[i], userId, adminId);
          }
        }
        
        // 记录管理员操作日志
        const planInfo = planIds.length > 0 ? ` (分配计划ID: ${planIds.join(', ')}, 佣金金额: ${commissionAmount})` : '';
        await this.addAdminLog({
          admin_id: adminId,
          action: 'update_user_commission_status',
          target_type: 'user_commission_config',
          target_id: userId,
          details: `更新用户 ${userId} 佣金状态为: ${isActive ? 'active' : 'inactive'} (is_active: ${isActive})${planInfo}`
        });
        
        return {
          success: true,
          user: { is_active: isActive },
          message: `用户佣金状态更新成功${planInfo}${isActive && commissionAmount > 0 ? '，已创建佣金分配记录' : ''}`
        };
      }
      return {
        success: false,
        user: { is_active: !isActive },
        message: '更新用户佣金状态失败'
      };
    } catch (error) {
      console.error('更新用户佣金状态失败:', error);
      return {
        success: false,
        user: { is_active: !isActive },
        message: error instanceof Error ? error.message : '更新用户佣金状态失败'
      };
    }
  }

  // 创建佣金发放记录
  async createCommissionPayout(userId: number, planId: number, amount: number, payoutType: string, adminId: number, triggerReason?: string): Promise<boolean> {
    try {
      // 获取用户佣金配置ID
      const config = await this.env.DB.prepare(
        'SELECT id FROM user_initial_commission_configs WHERE user_id = ?'
      ).bind(userId).first();
      
      if (!config) {
        console.error('用户佣金配置不存在:', userId);
        return false;
      }
      
      // 创建发放记录
      const payoutResult = await this.env.DB.prepare(
        `INSERT INTO initial_commission_payouts 
         (user_id, config_id, plan_id, amount, payout_type, trigger_reason, 
          scheduled_date, actual_payout_date, status, processed_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, date('now'), date('now'), 'completed', ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))`
      ).bind(userId, config.id, planId, amount, payoutType, triggerReason || '管理员手动发放', adminId).run();
      
      if (payoutResult.success) {
        // 更新用户佣金配置中的累计金额和发放次数
        await this.env.DB.prepare(
          `UPDATE user_initial_commission_configs 
           SET total_received = total_received + ?, payout_count = payout_count + 1,
               next_payout_date = date('now', '+' || payout_cycle || ' days'),
               updated_at = datetime('now')
           WHERE user_id = ?`
        ).bind(amount, userId).run();
        
        // 记录操作日志
        await this.addAdminLog({
          admin_id: adminId,
          action: 'create_commission_payout',
          target_type: 'payout',
          target_id: payoutResult.meta.last_row_id as number,
          details: `为用户 ${userId} 创建佣金发放记录，金额: ${amount}，类型: ${payoutType}`
        });
        
        // 发送通知给用户
        await this.addNotification({
          user_id: userId,
          type: 'commission_payout',
          title: '佣金发放通知',
          content: `您已收到佣金 ${amount} 元，发放类型: ${payoutType === 'manual' ? '手动发放' : '自动发放'}`,
          related_id: payoutResult.meta.last_row_id as number
        });
        
        console.log(`成功创建用户 ${userId} 的佣金发放记录，金额: ${amount}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('创建佣金发放记录失败:', error);
      return false;
    }
  }

  // 创建佣金分配记录（根据计划创建多天的分配记录）
  async createCommissionDistributionRecords(userId: number, planId: number, totalAmount: number, payoutCycle: number, adminId: number, triggerReason?: string): Promise<boolean> {
    try {
      // 获取用户佣金配置ID
      const config = await this.env.DB.prepare(
        'SELECT id FROM user_initial_commission_configs WHERE user_id = ?'
      ).bind(userId).first();
      
      if (!config) {
        console.error('用户佣金配置不存在:', userId);
        return false;
      }
      
      // 获取佣金计划标题
      const plan = await this.env.DB.prepare(
        'SELECT name FROM initial_commission_plans WHERE id = ?'
      ).bind(planId).first();
      
      const planTitle = plan?.name || '佣金计划';
      const finalTriggerReason = triggerReason || planTitle;
      
      // 生成随机分配的每日金额
      const dailyAmounts = this.generateRandomDailyAmounts(totalAmount, payoutCycle);
      
      // 批量创建发放记录
      const batch = [];
      const now = new Date();
      
      for (let i = 0; i < payoutCycle; i++) {
        const scheduledDate = new Date(now);
        scheduledDate.setDate(now.getDate() + i);
        const scheduledDateStr = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD格式
        
        batch.push(
          this.env.DB.prepare(
            `INSERT INTO initial_commission_payouts 
             (user_id, config_id, plan_id, amount, payout_type, trigger_reason, 
              scheduled_date, status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+8 hours'), datetime('now', '+8 hours'))`
          ).bind(
            userId, 
            config.id, 
            planId, 
            dailyAmounts[i], 
            'scheduled', 
            finalTriggerReason, 
            scheduledDateStr
          )
        );
      }
      
      // 执行批量插入
      const results = await this.env.DB.batch(batch);
      
      // 检查是否所有记录都创建成功
      const allSuccess = results.every((result: any) => result.success);
      
      if (allSuccess) {
        // 更新用户佣金配置中的下次发放时间
        await this.env.DB.prepare(
          `UPDATE user_initial_commission_configs 
           SET next_payout_date = date('now'),
               updated_at = datetime('now')
           WHERE user_id = ?`
        ).bind(userId).run();
        
        // 记录操作日志
        await this.addAdminLog({
          admin_id: adminId,
          action: 'create_commission_distribution',
          target_type: 'payout',
          target_id: userId,
          details: `为用户 ${userId} 创建佣金分配记录，计划: ${planTitle}，总金额: ${totalAmount}，分配天数: ${payoutCycle}，每日金额: [${dailyAmounts.join(', ')}]`
        });
        
        console.log(`成功为用户 ${userId} 创建 ${payoutCycle} 天的佣金分配记录，总金额: ${totalAmount}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('创建佣金分配记录失败:', error);
      return false;
    }
  }

  // 生成递增式的每日佣金金额（增强用户粘性）
  private generateRandomDailyAmounts(totalAmount: number, days: number): number[] {
    if (days <= 0) return [];
    if (days === 1) return [totalAmount];
    
    const amounts: number[] = [];
    
    // 使用递增模式：前几天金额较小，后几天逐渐增加
    // 第1-3天：总金额的5-15%
    // 第4-5天：总金额的15-25%
    // 第6-7天：总金额的25-35%
    
    const basePercentages = [
      0.05,  // 第1天：5%
      0.08,  // 第2天：8%
      0.12,  // 第3天：12%
      0.18,  // 第4天：18%
      0.22,  // 第5天：22%
      0.15,  // 第6天：15%
      0.20   // 第7天：20%
    ];
    
    // 根据实际天数调整百分比
    let percentages: number[];
    if (days <= 7) {
      percentages = basePercentages.slice(0, days);
    } else {
      // 如果超过7天，后续天数平均分配剩余比例
      percentages = [...basePercentages];
      const remainingPercentage = 1 - basePercentages.reduce((sum, p) => sum + p, 0);
      const extraDays = days - 7;
      const extraDayPercentage = remainingPercentage / extraDays;
      
      for (let i = 0; i < extraDays; i++) {
        percentages.push(extraDayPercentage);
      }
    }
    
    // 标准化百分比，确保总和为1
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    percentages = percentages.map(p => p / totalPercentage);
    
    // 计算每日金额，添加小幅随机波动（±20%）
    let allocatedAmount = 0;
    
    for (let i = 0; i < days - 1; i++) {
      const baseAmount = totalAmount * percentages[i];
      
      // 添加±20%的随机波动
      const variation = 0.2;
      const randomFactor = 1 + (Math.random() - 0.5) * 2 * variation;
      let dailyAmount = baseAmount * randomFactor;
      
      // 确保最小金额为0.01
      dailyAmount = Math.max(0.01, dailyAmount);
      
      // 保留2位小数
      dailyAmount = Math.round(dailyAmount * 100) / 100;
      
      amounts.push(dailyAmount);
      allocatedAmount += dailyAmount;
    }
    
    // 最后一天获得剩余金额，确保总和正确
    const lastDayAmount = Math.round((totalAmount - allocatedAmount) * 100) / 100;
    amounts.push(Math.max(0.01, lastDayAmount));
    
    return amounts;
  }

  // 获取佣金统计数据
  async getCommissionStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalPaid: number;
    monthlyEstimate: number;
  }> {
    try {
      // 总用户数
      const totalUsersResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM users'
      ).first();
      
      // 活跃佣金用户数
      const activeUsersResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM user_initial_commission_configs WHERE is_active = true'
      ).first();
      
      // 累计发放金额
      const totalPaidResult = await this.env.DB.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status = \'completed\''
      ).first();
      
      // 本月预估发放（基于活跃计划）
      const monthlyEstimateResult = await this.env.DB.prepare(`
        SELECT COALESCE(SUM(icp.amount_value), 0) as estimate 
        FROM initial_commission_plans icp 
        JOIN initial_commission_plan_users icpu ON icp.id = icpu.plan_id 
        WHERE icp.status = 'active' AND icpu.status = 'active'
      `).first();

      return {
        totalUsers: totalUsersResult?.count || 0,
        activeUsers: activeUsersResult?.count || 0,
        totalPaid: totalPaidResult?.total || 0,
        monthlyEstimate: monthlyEstimateResult?.estimate || 0
      };
    } catch (error) {
      console.error('获取佣金统计数据失败:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPaid: 0,
        monthlyEstimate: 0
      };
    }
  }

  // 获取实时统计面板数据
  async getRealTimeStats(): Promise<{
    total_creators: number;
    active_payouts: number;
    total_commission_paid: number;
    pending_commission: number;
    total_processed: number;
    success_count: number;
    failure_count: number;
  }> {
    try {
      // 活跃创作者数（有工作流的创作者）
      const totalCreatorsResult = await this.env.DB.prepare(`
        SELECT COUNT(DISTINCT u.id) as count 
        FROM users u 
        JOIN coze_workflows cw ON u.id = cw.user_id 
        WHERE u.role = 'creator' AND u.status = 'active'
      `).first();
      
      // 活跃发放数（启用自动发放的用户数）
      const activePayoutsResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM user_initial_commission_configs WHERE is_active = true'
      ).first();
      
      // 已发放总额（所有已完成的发放记录）
      const totalCommissionPaidResult = await this.env.DB.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status = \'completed\''
      ).first();
      
      // 待发放金额（所有待处理的发放记录）
      const pendingCommissionResult = await this.env.DB.prepare(
        'SELECT COALESCE(SUM(amount), 0) as total FROM initial_commission_payouts WHERE status IN (\'pending\', \'processing\')'
      ).first();
      
      // 总处理数（所有发放记录）
      const totalProcessedResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM initial_commission_payouts'
      ).first();
      
      // 成功数（已完成的发放记录）
      const successCountResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM initial_commission_payouts WHERE status = \'completed\''
      ).first();
      
      // 失败数（失败的发放记录）
      const failureCountResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM initial_commission_payouts WHERE status = \'failed\''
      ).first();

      return {
        total_creators: totalCreatorsResult?.count || 0,
        active_payouts: activePayoutsResult?.count || 0,
        total_commission_paid: totalCommissionPaidResult?.total || 0,
        pending_commission: pendingCommissionResult?.total || 0,
        total_processed: totalProcessedResult?.count || 0,
        success_count: successCountResult?.count || 0,
        failure_count: failureCountResult?.count || 0
      };
    } catch (error) {
      console.error('获取实时统计数据失败:', error);
      return {
        total_creators: 0,
        active_payouts: 0,
        total_commission_paid: 0,
        pending_commission: 0,
        total_processed: 0,
        success_count: 0,
        failure_count: 0
      };
    }
  }

  // 为用户分配佣金计划
  async assignCommissionPlanToUser(planId: number, userId: number, adminId: number): Promise<boolean> {
    try {
      // 检查是否已经分配
      const existing = await this.env.DB.prepare(
        'SELECT id FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?'
      ).bind(planId, userId).first();

      if (existing) {
        return false; // 已经分配过了
      }

      const result = await this.env.DB.prepare(
        'INSERT INTO initial_commission_plan_users (plan_id, user_id, status, assigned_at) VALUES (?, ?, \'active\', datetime(\'now\'))'
      ).bind(planId, userId).run();

      if (result.success) {
        // 记录管理员操作日志
        await this.addAdminLog({
          admin_id: adminId,
          action: 'assign_commission_plan',
          target_type: 'commission_plan_assignment',
          target_id: result.meta.last_row_id as number,
          details: `为用户 ${userId} 分配佣金计划 ${planId}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('分配佣金计划失败:', error);
      throw error;
    }
  }

  // 移除用户的佣金计划
  async removeCommissionPlanFromUser(planId: number, userId: number, adminId: number): Promise<boolean> {
    try {
      const result = await this.env.DB.prepare(
        'DELETE FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?'
      ).bind(planId, userId).run();

      if (result.success) {
        // 记录管理员操作日志
        await this.addAdminLog({
          admin_id: adminId,
          action: 'remove_commission_plan',
          target_type: 'commission_plan_assignment',
          target_id: userId,
          details: `移除用户 ${userId} 的佣金计划 ${planId}`
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('移除佣金计划失败:', error);
      throw error;
    }
  }

  // 检查用户是否符合初始佣金计划条件并获取符合条件的计划ID
  async getEligibleCommissionPlansForUser(userId: number): Promise<{
    eligiblePlans: Array<{
      id: number;
      name: string;
      fixed_amount: number;
      payout_cycle: number;
      trigger_type: string;
      workflow_threshold?: number;
      reason: string;
    }>;
    userWorkflowCount: number;
  }> {
    try {
      // 获取用户的工作流数量
      const userWorkflowResult = await this.env.DB.prepare(
        'SELECT COUNT(*) as workflow_count FROM coze_workflows WHERE creator_id = ? AND status = "online"'
      ).bind(userId).first();
      
      const userWorkflowCount = (userWorkflowResult as any)?.workflow_count || 0;
      
      // 获取所有启用的佣金计划
      const plansResult = await this.env.DB.prepare(
        'SELECT * FROM initial_commission_plans WHERE is_active = true ORDER BY created_at DESC'
      ).all();
      
      const eligiblePlans: Array<{
        id: number;
        name: string;
        fixed_amount: number;
        payout_cycle: number;
        trigger_type: string;
        workflow_threshold?: number;
        reason: string;
      }> = [];
      
      for (const plan of (plansResult.results as any[]) || []) {
        let isEligible = false;
        let reason = '';
        
        // 检查计划类型和条件
        if (plan.trigger_type === 'manual') {
          // 手动触发类型的计划，所有用户都符合条件
          isEligible = true;
          reason = '手动触发计划，符合条件';
        } else if (plan.trigger_type === 'workflow_threshold' && plan.workflow_threshold) {
          // 基于工作流阈值的计划
          if (userWorkflowCount >= plan.workflow_threshold) {
            isEligible = true;
            reason = `用户工作流数量(${userWorkflowCount})达到阈值(${plan.workflow_threshold})`;
          } else {
            reason = `用户工作流数量(${userWorkflowCount})未达到阈值(${plan.workflow_threshold})`;
          }
        }
        
        // 检查用户是否已经被分配到特定计划
        if (isEligible && plan.target_user_type === 'specific') {
          const assignmentResult = await this.env.DB.prepare(
            'SELECT id FROM initial_commission_plan_users WHERE plan_id = ? AND user_id = ?'
          ).bind(plan.id, userId).first();
          
          if (!assignmentResult) {
            isEligible = false;
            reason = '用户未被分配到此特定计划';
          }
        }
        
        if (isEligible) {
          eligiblePlans.push({
            id: plan.id,
            name: plan.name,
            fixed_amount: plan.fixed_amount,
            payout_cycle: plan.payout_cycle,
            trigger_type: plan.trigger_type,
            workflow_threshold: plan.workflow_threshold,
            reason
          });
        }
      }
      
      return {
        eligiblePlans,
        userWorkflowCount
      };
    } catch (error) {
      console.error('检查用户佣金计划资格失败:', error);
      throw error;
    }
  }
}

// MySQL 数据库实现（备选方案）
export class MySQLDatabase {
  constructor(_env: Env) {
    // 这里可以实现 MySQL 连接逻辑
    // 注意：Cloudflare Workers 中使用 MySQL 需要通过 HTTP API 或特殊的连接方式
  }
}