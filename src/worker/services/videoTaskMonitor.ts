import { Env } from '../types';
import { AuthService } from '../auth';
import { D1Database } from '../database-real';

// 视频生成任务状态监控服务
export class VideoTaskMonitor {
  private env: Env;
  private isRunning: boolean = false;
  private intervalId: number | null = null;
  private authService: AuthService;

  constructor(env: Env) {
    this.env = env;
    const db = new D1Database(env);
    this.authService = new AuthService(env, db);
  }

  // 启动监控服务
  start() {
    if (this.isRunning) {
      console.log('视频任务监控服务已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('启动视频任务监控服务');
    
    // 立即执行一次检查
    this.checkPendingTasks();
    
    // 设置定时器，每10秒执行一次检查
    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        console.log('定时器触发：开始检查视频任务');
        this.checkPendingTasks().catch(error => {
          console.error('定时检查视频任务时发生错误:', error);
        });
      }
    }, 10000) as any; // 10秒间隔
    
    console.log('视频任务监控定时器已启动，间隔：10秒');
  }

  // 停止监控服务
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('停止视频任务监控服务');
  }

  // 检查待处理的任务
  public async checkPendingTasks() {
    console.log('=== 开始检查待处理的视频任务 ===');
    
    try {
      console.log('开始检查待处理的视频生成任务...');
      
      // 查询状态为 'running' 的任务
      const { results: tasks } = await this.env.DB.prepare(`
        SELECT id, execute_id, workflow_id, token, notification_email, created_at
        FROM video_generation_tasks 
        WHERE status = 'running'
        ORDER BY created_at ASC
        LIMIT 50
      `).all();

      console.log(`数据库查询结果: 找到 ${tasks ? tasks.length : 0} 个状态为 'running' 的任务`);

      if (!tasks || tasks.length === 0) {
        console.log('没有找到运行中的任务，跳过本次检查');
        return;
      }

      console.log(`检查到 ${tasks.length} 个运行中的视频生成任务`);

      // 并发检查所有任务
      const checkPromises = tasks.map((task: any) => this.checkSingleTask(task));
      await Promise.allSettled(checkPromises);
    } catch (error) {
      console.error('检查视频任务时发生错误:', error);
    }
    
    console.log('=== 视频任务检查完成 ===');
  }

  // 检查单个任务状态
  private async checkSingleTask(task: any) {
    try {
      const { id, execute_id, workflow_id, token } = task;
      
      console.log(`开始检查任务 ${id} (execute_id: ${execute_id}, workflow_id: ${workflow_id})`);


      // 调用 Coze API 查询任务状态
      const apiUrl = `https://api.coze.cn/v1/coze-workflows/${workflow_id}/run_histories/${execute_id}`;
      console.log(`正在调用 Coze API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Coze API 响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`查询任务 ${id} 状态失败:`, response.status, response.statusText);
        return;
      }

      const result: any = await response.json();
      console.log(`任务 ${id} API 返回结果:`, JSON.stringify(result, null, 2));
      
      // 检查API响应格式
      if (result.code === 0 && result.data && result.data.length > 0) {
        const taskData = result.data[0];
        const executeStatus = taskData.execute_status;
        
        if (executeStatus === 'Success') {
          // 任务成功完成，解析output字段
          let outputUrl = null;
          try {
            if (taskData.output) {
              const outputData = JSON.parse(taskData.output);
              if (outputData.Output) {
                const outputContent = JSON.parse(outputData.Output);
                if (outputContent.output) {
                  // 提取URL，去除可能的反引号
                  outputUrl = outputContent.output.replace(/`/g, '').trim();
                }
              }
            }
          } catch (parseError) {
            console.error(`解析任务 ${id} 输出时发生错误:`, parseError);
          }
          
          await this.updateTaskStatus(id, 'completed', taskData, null, outputUrl);
          console.log(`任务 ${id} 执行成功，输出URL: ${outputUrl}`);
        } else if (executeStatus === 'Failed') {
          await this.updateTaskStatus(id, 'failed', taskData, taskData.error_message || '任务执行失败', null);
          console.log(`任务 ${id} 执行失败:`, taskData.error_message);
        } else if (executeStatus === 'Running') {
          console.log(`任务 ${id} 当前状态: ${executeStatus}，继续等待...`);
        } else {
          console.log(`任务 ${id} 当前状态: ${executeStatus}，继续等待...`);
        }
      } else {
        console.error(`任务 ${id} API 返回格式异常:`, result);
      }
      
    } catch (error) {
      console.error(`检查任务 ${task.id} 时发生错误:`, error);
    }
  }

  // 更新任务状态
  private async updateTaskStatus(taskId: number, status: string, resultData: any, errorMessage: string | null, outputUrl: string | null = null) {
    try {
      // 获取任务信息，包括通知邮箱
      const task = await this.env.DB.prepare(`
        SELECT notification_email, title FROM video_generation_tasks WHERE id = ?
      `).bind(taskId).first();

      // 更新任务状态，包括output字段
      await this.env.DB.prepare(`
        UPDATE video_generation_tasks 
        SET status = ?, result_data = ?, error_message = ?, output = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(status, resultData ? JSON.stringify(resultData) : null, errorMessage, outputUrl, taskId).run();

      console.log(`任务 ${taskId} 状态已更新: status=${status}, output=${outputUrl}`);

      // 发送邮件通知
      if (task && (task as any).notification_email) {
        await this.sendNotificationEmail((task as any).notification_email, (task as any).title, status, errorMessage, outputUrl);
      }
    } catch (error) {
      console.error(`更新任务 ${taskId} 状态失败:`, error);
    }
  }

  // 发送邮件通知
  private async sendNotificationEmail(email: string, taskTitle: string, status: string, errorMessage: string | null, outputUrl?: string | null) {
    try {
      let subject = '';
      let statusText = '';
      let statusColor = '';
      let content = '';

      switch (status) {
        case 'completed':
          subject = '视频生成任务完成通知';
          statusText = '已完成';
          statusColor = '#10B981';
          content = outputUrl 
            ? `您的视频生成任务已成功完成！<br><br><strong>生成结果：</strong><br><a href="${outputUrl}" target="_blank" style="color: #667eea; text-decoration: none;">点击查看生成的视频</a>`
            : '您的视频生成任务已成功完成！';
          break;
        case 'failed':
          subject = '视频生成任务失败通知';
          statusText = '失败';
          statusColor = '#EF4444';
          content = `很抱歉，您的视频生成任务执行失败。${errorMessage ? `错误信息：${errorMessage}` : ''}`;
          break;
        case 'timeout':
          subject = '视频生成任务超时通知';
          statusText = '超时';
          statusColor = '#F59E0B';
          content = '您的视频生成任务执行超时，请重新提交任务。';
          break;
        default:
          return; // 其他状态不发送邮件
      }

      const emailHtml = `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; line-height: 60px; color: white; font-size: 24px; font-weight: bold;">WF</div>
            <h1 style="color: #333; margin: 20px 0 10px 0;">工作流分享平台</h1>
            <p style="color: #666; margin: 0;">${subject}</p>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 30px 0;">
            <h2 style="color: #333; margin: 0 0 15px 0;">任务状态更新</h2>
            <div style="margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>任务标题：</strong>${taskTitle}</p>
              <p style="margin: 10px 0;"><strong>当前状态：</strong><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
              <p style="margin: 10px 0; color: #666;">${content}</p>
            </div>
          </div>
          
          <div style="color: #666; font-size: 14px; line-height: 1.6;">
            <p>您可以登录平台查看详细的任务执行结果。</p>
            <p>如有任何问题，请联系客服支持。</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
            <p>此邮件由系统自动发送，请勿回复。</p>
            <p>© 2024 工作流分享平台. All rights reserved.</p>
          </div>
        </div>
      `;

      // 使用AuthService发送邮件
       const emailSent = await this.authService.sendNotificationEmail(email, subject, emailHtml);
       
       if (emailSent) {
         console.log(`视频任务状态通知邮件已发送至: ${email}, 状态: ${status}`);
       } else {
         console.error(`视频任务状态通知邮件发送失败: ${email}, 状态: ${status}`);
       }
    } catch (error) {
      console.error(`发送邮件通知失败:`, error);
    }
  }

  // 获取监控状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }
}

// 全局监控实例
let globalMonitor: VideoTaskMonitor | null = null;

// 获取或创建监控实例
export function getVideoTaskMonitor(env: Env): VideoTaskMonitor {
  if (!globalMonitor) {
    globalMonitor = new VideoTaskMonitor(env);
  }
  return globalMonitor;
}

// 启动监控服务
export function startVideoTaskMonitor(env: Env) {
  const monitor = getVideoTaskMonitor(env);
  monitor.start();
  return monitor;
}

// 停止监控服务
export function stopVideoTaskMonitor() {
  if (globalMonitor) {
    globalMonitor.stop();
  }
}