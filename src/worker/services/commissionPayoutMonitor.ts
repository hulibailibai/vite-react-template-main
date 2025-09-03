import { Env } from '../types';

/**
 * 佣金发放监控服务
 * 每10秒检查一次待发放的佣金记录，处理到期的佣金发放
 */
export class CommissionPayoutMonitor {
  private env: Env;
  private intervalId: any = null;
  private isRunning = false;

  constructor(env: Env) {
    this.env = env;
  }

  // 启动监控服务
  start() {
    if (this.isRunning) {
      console.log('佣金发放监控服务已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('启动佣金发放监控服务');
    
    // 立即执行一次检查
    this.checkPendingPayouts();
    
    console.log('佣金发放监控服务已启动，将通过Cron触发器定期检查待发放记录');
  }

  // 停止监控服务
  stop() {
    this.isRunning = false;
    console.log('停止佣金发放监控服务');
  }

  // 检查待发放的佣金记录
  public async checkPendingPayouts() {
    console.log('=== 开始检查待发放的佣金记录 ===');
    
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
      
      console.log(`当前日期: ${currentDate}`);
      
      // 查询到期且状态为pending的佣金发放记录
      const { results: payouts } = await this.env.DB.prepare(`
        SELECT 
          p.id,
          p.user_id,
          p.config_id,
          p.plan_id,
          p.amount,
          p.payout_type,
          p.scheduled_date,
          p.retry_count,
          u.username,
          u.email
        FROM initial_commission_payouts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending' 
          AND p.scheduled_date <= ?
          AND p.retry_count < 3
        ORDER BY p.scheduled_date ASC, p.created_at ASC
        LIMIT 50
      `).bind(currentDate).all();

      console.log(`数据库查询结果: 找到 ${payouts ? payouts.length : 0} 个待发放的佣金记录`);

      if (!payouts || payouts.length === 0) {
        console.log('没有找到待发放的佣金记录，跳过本次检查');
        return;
      }

      console.log(`检查到 ${payouts.length} 个待发放的佣金记录`);

      // 并发处理所有待发放记录
      const processPromises = payouts.map((payout: any) => this.processSinglePayout(payout));
      const results = await Promise.allSettled(processPromises);
      
      // 统计处理结果
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`佣金发放处理完成: 成功 ${successful} 个, 失败 ${failed} 个`);
      
    } catch (error) {
      console.error('检查佣金发放记录时发生错误:', error);
    }
    
    console.log('=== 佣金发放检查完成 ===');
  }

  // 处理单个佣金发放记录
  private async processSinglePayout(payout: any) {
    const payoutId = payout.id;
    const userId = payout.user_id;
    const amount = payout.amount;
    
    console.log(`开始处理佣金发放: ID=${payoutId}, 用户=${payout.username}, 金额=${amount}`);
    
    try {
      // 更新发放记录状态为processing
      await this.env.DB.prepare(`
        UPDATE initial_commission_payouts 
        SET status = 'processing', updated_at = ?
        WHERE id = ?
      `).bind(new Date().toISOString(), payoutId).run();
      
      const now = new Date().toISOString();
      
      // 开始事务处理
      const batch = [
        // 1. 创建交易记录
        this.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, type, transaction_type, amount, status, payment_method, 
            description, created_at
          ) VALUES (?, 'commission', 'commission_payout', ?, 'completed', 'system', ?, ?)
        `).bind(
          userId,
          amount,
          `初始佣金发放 - ${payout.payout_type}`,
          now
        ),
        
        // 2. 更新用户余额
        this.env.DB.prepare(`
          UPDATE users 
          SET balance = balance + ?, updated_at = ?
          WHERE id = ?
        `).bind(amount, now, userId),
        
        // 3. 更新发放记录状态为completed
        this.env.DB.prepare(`
          UPDATE initial_commission_payouts 
          SET status = 'completed', 
              actual_payout_date = ?, 
              updated_at = ?,
              processed_by = 1
          WHERE id = ?
        `).bind(now.split('T')[0], now, payoutId)
      ];
      
      // 执行事务
      await this.env.DB.batch(batch);
      
      // 记录操作日志
      await this.env.DB.prepare(`
        INSERT INTO initial_commission_operation_logs (
          operation_type, target_type, target_id, user_id, operator_id, 
          operation_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'payout_processed',
        'payout',
        payoutId,
        userId,
        1, // 系统操作
        JSON.stringify({
          amount: amount,
          payout_type: payout.payout_type,
          scheduled_date: payout.scheduled_date
        }),
        now
      ).run();
      
      console.log(`✅ 佣金发放成功: ID=${payoutId}, 用户=${payout.username}, 金额=${amount}`);
      
    } catch (error) {
      console.error(`❌ 佣金发放失败: ID=${payoutId}, 错误:`, error);
      
      // 更新失败状态和重试次数
      try {
        const newRetryCount = (payout.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';
        
        await this.env.DB.prepare(`
          UPDATE initial_commission_payouts 
          SET status = ?, 
              retry_count = ?, 
              failure_reason = ?, 
              updated_at = ?
          WHERE id = ?
        `).bind(
          newStatus,
          newRetryCount,
          error instanceof Error ? error.message : String(error),
          new Date().toISOString(),
          payoutId
        ).run();
        
        console.log(`更新失败记录: ID=${payoutId}, 重试次数=${newRetryCount}, 状态=${newStatus}`);
        
      } catch (updateError) {
        console.error(`更新失败记录时出错: ID=${payoutId}`, updateError);
      }
      
      throw error;
    }
  }

  // 获取监控状态
  public getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// 导出单例实例
let commissionPayoutMonitorInstance: CommissionPayoutMonitor | null = null;

export function getCommissionPayoutMonitor(env: Env): CommissionPayoutMonitor {
  if (!commissionPayoutMonitorInstance) {
    commissionPayoutMonitorInstance = new CommissionPayoutMonitor(env);
  }
  return commissionPayoutMonitorInstance;
}