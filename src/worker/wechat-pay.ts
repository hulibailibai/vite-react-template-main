import { Context } from 'hono';
import { createSuccessResponse, createErrorResponse } from './auth';

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appid: "wxc93ae8ea2bd556b1", // 微信支付官方测试appid
  mchid: "1499909852", // 微信支付官方测试商户号
  // 商户私钥（这是微信支付官方文档中的测试私钥，仅用于演示）
  // ⚠️ 警告：在生产环境中绝对不要将私钥放在前端代码中！
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCo0/D1xxH6cUv
bS6niUz8hi4fEicq2Bg4Y5uwaHJ5tdO2DX9jwzD659DQziFKbkR9pr6K/akyO9Tl
K7p58G9jwk9iFe36aga0XfarOqqGlrmC3MVCeHIzguvx7nR8bQPwPh1W0uTWey/G
NJ4VTk/14PlFFhs74D2gyI79frw++QRP1KKFIRMtV8b5Wt0sul8gkqp6IV7RdtNT
TJLakzIfq2mTRwGB/5zC2OAhImeWEiROlnYWkQXSQDozFhi+AOBNwHVbsEJ6elNo
YM+NZwp8c5jzTERDamPwomtS6KIE1EFkGZlCdeKqKdeWuXpbfFq1knkdZtz+ErAo
Tr/pmrdZAgMBAAECggEADcxSDUokoRx7dB9DXXEoWgaRInbA/BKRtP2qvdjJtMMl
HRTb4RCnWkIw1Xync4VZqaa2f1f4NK11LEHrWFWpL+NIiWWQl14I16SJph3klOH+
iL5p5YpwXiJ744zKCUAZNWDR56PPwTy+aEi2pEAG/yFRyooEqDv/YnSVXncrlTMm
aXwamya3d6Kv5p3sWKZBGmz8jW/Ee9RkouCwynqFKHx+Kc7364Dc91loJpxCelLY
VvnykMPAPnvxw9prTy2AC/8n9eiBIGr4f+LSmgME6ZUVJFf7+JLDtemtzdyaT7PW
1m/BtfsbfPIiZDFEQ3wERIwAgBmXcPxX+QOXB1hguQKBgQDjb6bzrHDuU41RUwsd
mE3h8LnMz9YYzyX1JHXoXjgtWooxu/K61do3J7uJnui7INQEoJ1m54N5YQAQCbgM
qrkeejkOYAFhXS90z7xNctS6kD3pU3kcr3NeWEnpBE8v+L2n0+dOnypgGWgLJKOd
XJnSafgKBjyGV7GmH8qZYjwxHwKBgQDbFShHL+U6NelXfhjsuy6RpaYCOqQ2DUmt
2CV6l/GvawDknyyCC6X6JZ5NXGc8yndkdKbfpbkwMKlk6Rv4z+bumJ1Vu6FEd1KI
eyVO0FDpSosNjF3+AEDXfkLsyaxH0qohialpgkykLJqaZVIeahinyDora6989/DM
6AfXBXkwhwKBgQDgDzr2jEelQwLRv3IP8d+oWzNwJsDRKCJI42aVSV0msS+712FF
1zBnbek/pyG4WJsHBASNQD8x8PHS2wBK2lYNRHO5SbOSa+84sP7dfec89KVJnEaQ
j/ikVW5a9TfeFrsg/4280uk4S09Iywu1F2ki9eq6VXKDFxmYg3FgsnqCGQKBgHuh
QdyCK7IgsC/+aaRVsN7iAn9phjc2Ymim++dljS53jMZ3CI/OcPhreByh02RbwOpA
Zdb5VzrZiw31+iH7eI8WMlsqCcRwLXP1QkVqiu5LcZLQrk3i6LRyfOPQntbdC8Ln
Q2HV9NgEj64nFSMyrf0ooaLVHu+/nvSSz7HIVe5LAoGBAJH3v8/0ETrpmEmfFLK5
3NIxD7zpc1+fE2ZzFSThVtByfbgYogfnPsf14jR1wEF7pUJGqu1YN4Td423IaCmX
ZbOFrUU+dZSkNxfckIH4ygNLqCtBZoCS1AWggO3UxyqaCELUkJ2ISbm7gB7AZnm/
QLFn7umoiY2T51RjO7MvCE02
-----END PRIVATE KEY-----`,
  // 证书序列号
  serialNo: "3488CA4842E03793D1D52E89256352D1C0C7E331",
  // 微信支付API密钥（从环境变量获取，如果没有则使用配置中的密钥）
  apiKey: "5X2z7A9mF0kP4Qj8L6cY3nR1tZ9B5vS2"  // 32位APIv3密钥，需要在微信支付商户平台设置
}

// 订单信息接口
interface OrderInfo {
  id: string;
  name: string;
  description?: string;
  price: number;
}

// 获取当前时间戳（秒）
const getTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

// 生成随机字符串
const generateNonceStr = (): string => {
  return Math.random().toString(36).substr(2, 32);
};

// 构造签名串
// 微信支付API v3签名串格式：
// HTTP请求方法\n
// URL\n
// 请求时间戳\n
// 请求随机串\n
// 请求报文主体\n
const buildSignString = (method: string, url: string, timestamp: number, nonceStr: string, body: string): string => {
  const signString = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  console.log('构造的签名串:', signString);
  return signString;
};

// 使用RSA-SHA256算法生成签名
const generateSignature = async (signString: string, privateKey: string): Promise<string> => {
  try {
    // 在Cloudflare Workers环境中使用Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(signString);
    
    // 解析PEM格式的私钥
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    // 导入私钥
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
    
    // 生成签名
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      data
    );
    
    // 转换为Base64
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    
    console.log('生成的签名:', signatureBase64);
    return signatureBase64;
  } catch (error) {
    console.error('签名生成失败:', error);
    throw new Error('签名生成失败');
  }
};

// 构造Authorization头
// 微信支付API v3要求的Authorization头格式：
// WECHATPAY2-SHA256-RSA2048 mchid="商户号",nonce_str="随机串",signature="签名值",timestamp="时间戳",serial_no="证书序列号"
const buildAuthorizationHeader = (mchid: string, serialNo: string, nonceStr: string, timestamp: number, signature: string): string => {
  const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
  console.log('构造的Authorization头:', authHeader);
  return authHeader;
};

// 生成微信支付请求头
// 完整的微信支付签名生成流程：
// 1. 获取当前时间戳
// 2. 生成随机字符串
// 3. 构造签名串（包含HTTP方法、URL、时间戳、随机串、请求体）
// 4. 使用商户私钥对签名串进行RSA-SHA256签名并Base64编码
// 5. 构造Authorization头
const generateWechatPayHeaders = async (method: string, url: string, body: string) => {
  console.log('开始生成微信支付签名...');
  
  // 步骤1: 获取当前时间戳
  const timestamp = getTimestamp();
  console.log('时间戳:', timestamp);
  
  // 步骤2: 生成随机字符串
  const nonceStr = generateNonceStr();
  console.log('随机串:', nonceStr);
  
  // 步骤3: 构造签名串
  const signString = buildSignString(method, url, timestamp, nonceStr, body);
  
  // 步骤4: 生成签名
  const signature = await generateSignature(signString, WECHAT_PAY_CONFIG.privateKey);
  
  // 步骤5: 构造Authorization头
  const authorization = buildAuthorizationHeader(
    WECHAT_PAY_CONFIG.mchid,
    WECHAT_PAY_CONFIG.serialNo,
    nonceStr,
    timestamp,
    signature
  );

  console.log('微信支付签名生成完成!');
  
  return {
    'Authorization': authorization,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'WorkflowHub/1.0'
  };
};

// 获取用户真实IP地址
const getUserIP = (c: Context): string => {
  // 尝试从各种头部获取真实IP
  const cfConnectingIp = c.req.header('CF-Connecting-IP');
  const xForwardedFor = c.req.header('X-Forwarded-For');
  const xRealIp = c.req.header('X-Real-IP');
  
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  if (xForwardedFor) {
    // X-Forwarded-For可能包含多个IP，取第一个
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  // 默认IP
  return '127.0.0.1';
};

// 检测设备类型
const isMobile = (userAgent: string): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// 微信H5支付API调用（移动端）
export const callWechatH5PayAPI = async (orderInfo: OrderInfo, userIP: string, origin: string) => {
  const paymentData = {
    appid: WECHAT_PAY_CONFIG.appid,
    mchid: WECHAT_PAY_CONFIG.mchid,
    description: orderInfo.description || orderInfo.name,
    out_trade_no: orderInfo.id, // 使用传入的订单ID，确保一致性
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('Z', '+08:00'), // 30分钟后过期
    attach: `订单ID:${orderInfo.id}`,
    notify_url: `${origin}/api/wechat/pay/notify`, // 支付回调地址
    goods_tag: "WXG",
    support_fapiao: false,
    amount: {
      total: Math.round(orderInfo.price * 100), // 转换为分
      currency: "CNY" // 微信支付只支持人民币
    },
    detail: {
      cost_price: Math.round(orderInfo.price * 100),
      invoice_id: `INV_${orderInfo.id.substring(0, 28)}`, // 确保不超过32字节
      goods_detail: [
        {
          merchant_goods_id: orderInfo.id,
          wechatpay_goods_id: "1001",
          goods_name: orderInfo.name,
          quantity: 1,
          unit_price: Math.round(orderInfo.price * 100)
        }
      ]
    },
    scene_info: {
      payer_client_ip: userIP,
      device_id: "013467007045764",
      store_info: {
        id: "0001",
        name: "WorkflowHub在线商店",
        area_code: "440305",
        address: "在线服务"
      },
      h5_info: {
        type: "Wap",
        app_name: "WorkflowHub",
        app_url: origin, // 使用当前网站域名
        bundle_id: "com.workflowhub.app",
        package_name: "com.workflowhub.app"
      }
    },
    settle_info: {
      profit_sharing: false
    }
  };

  // 生成请求体字符串
  const requestBody = JSON.stringify(paymentData);
  
  // 生成签名和请求头
  const headers = await generateWechatPayHeaders('POST', '/v3/pay/transactions/h5', requestBody);
  
  console.log('微信H5支付请求参数:', {
    url: 'https://api.mch.weixin.qq.com/v3/pay/transactions/h5',
    method: 'POST',
    headers: headers,
    body: paymentData
  });

  // 调用微信支付API
  const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/h5', {
    method: 'POST',
    headers: headers,
    body: requestBody
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('微信H5支付API调用失败:', response.status, errorText);
    throw new Error(`微信H5支付API调用失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('微信H5支付API响应:', result);
  return result;
};

// 微信Native支付API调用（PC端）
export const callWechatNativePayAPI = async (orderInfo: OrderInfo, userIP: string, origin: string) => {
  const paymentData = {
    appid: WECHAT_PAY_CONFIG.appid,
    mchid: WECHAT_PAY_CONFIG.mchid,
    description: orderInfo.description || orderInfo.name,
    out_trade_no: orderInfo.id, // 使用传入的订单ID，确保一致性
    time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString().replace('Z', '+08:00'), // 30分钟后过期
    attach: `订单ID:${orderInfo.id}`,
    notify_url: `${origin}/api/wechat/pay/notify`, // 支付回调地址
    goods_tag: "WXG",
    support_fapiao: false,
    amount: {
      total: Math.round(orderInfo.price * 100), // 转换为分
      currency: "CNY" // 微信支付只支持人民币
    },
    detail: {
      cost_price: Math.round(orderInfo.price * 100),
      invoice_id: `INV_${orderInfo.id.substring(0, 28)}`, // 确保不超过32字节
      goods_detail: [
        {
          merchant_goods_id: orderInfo.id,
          wechatpay_goods_id: "1001",
          goods_name: orderInfo.name,
          quantity: 1,
          unit_price: Math.round(orderInfo.price * 100)
        }
      ]
    },
    scene_info: {
      payer_client_ip: userIP,
      device_id: "013467007045764",
      store_info: {
        id: "0001",
        name: "WorkflowHub在线商店",
        area_code: "440305",
        address: "在线服务"
      }
    },
    settle_info: {
      profit_sharing: false
    }
  };

  // 生成请求体字符串
  const requestBody = JSON.stringify(paymentData);
  
  // 生成签名和请求头
  const headers = await generateWechatPayHeaders('POST', '/v3/pay/transactions/native', requestBody);
  
  console.log('微信Native支付请求参数:', {
    url: 'https://api.mch.weixin.qq.com/v3/pay/transactions/native',
    method: 'POST',
    headers: headers,
    body: paymentData
  });

  // 调用微信支付API
  const response = await fetch('https://api.mch.weixin.qq.com/v3/pay/transactions/native', {
    method: 'POST',
    headers: headers,
    body: requestBody
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('微信Native支付API调用失败:', response.status, errorText);
    throw new Error(`微信Native支付API调用失败: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log('微信Native支付API响应:', result);
  return result;
};

// 查询支付状态API
export const queryWechatPayStatus = async (outTradeNo: string) => {
  // 构建包含查询参数的完整URL用于签名
  const urlForSign = `/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${WECHAT_PAY_CONFIG.mchid}`;
  const headers = await generateWechatPayHeaders('GET', urlForSign, '');
  
  console.log('查询支付状态请求参数:', {
    url: `https://api.mch.weixin.qq.com${urlForSign}`,
    method: 'GET',
    headers: headers
  });

  // 调用微信支付查询API
  const response = await fetch(`https://api.mch.weixin.qq.com${urlForSign}`, {
    method: 'GET',
    headers: headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('查询支付状态API调用失败:', response.status, errorText);
    throw new Error(`查询支付状态API调用失败: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('查询支付状态API响应:', result);
  return result;
};

// 微信支付服务类
export class WechatPayService {
  // 处理H5支付
  static async handleH5Payment(c: Context, orderInfo: OrderInfo) {
    try {
      const userIP = getUserIP(c);
      const origin = new URL(c.req.url).origin;
      
      console.log('处理H5支付:', { orderInfo, userIP, origin });
      
      const result = await callWechatH5PayAPI(orderInfo, userIP, origin);
      
      return c.json(createSuccessResponse({
        h5_url: (result as any).h5_url,
        prepay_id: (result as any).prepay_id,
        out_trade_no: orderInfo.id // 返回实际使用的订单号
      }));
    } catch (error) {
      console.error('H5支付处理失败:', error);
      return c.json(createErrorResponse(500, '微信H5支付失败', 'server', error instanceof Error ? error.message : '服务器内部错误'), 500);
    }
  }
  
  // 处理Native支付
  static async handleNativePayment(c: Context, orderInfo: OrderInfo) {
    try {
      const userIP = getUserIP(c);
      const origin = new URL(c.req.url).origin;
      
      console.log('处理Native支付:', { orderInfo, userIP, origin });
      
      const result = await callWechatNativePayAPI(orderInfo, userIP, origin);
      
      return c.json(createSuccessResponse({
        code_url: (result as any).code_url,
        prepay_id: (result as any).prepay_id,
        out_trade_no: orderInfo.id // 返回实际使用的订单号
      }));
    } catch (error) {
      console.error('Native支付处理失败:', error);
      return c.json(createErrorResponse(500, '微信Native支付失败', 'server', error instanceof Error ? error.message : '服务器内部错误'), 500);
    }
  }
  
  // 处理支付状态查询
  static async handlePaymentQuery(c: Context, outTradeNo: string) {
    try {
      console.log('查询支付状态:', outTradeNo);
      
      const result = await queryWechatPayStatus(outTradeNo);
      
      return c.json(createSuccessResponse({
        trade_state: (result as any).trade_state,
        trade_state_desc: (result as any).trade_state_desc,
        out_trade_no: (result as any).out_trade_no,
        transaction_id: (result as any).transaction_id,
        amount: (result as any).amount
      }));
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return c.json(createErrorResponse(500, '查询支付状态失败', 'server', error instanceof Error ? error.message : '服务器内部错误'), 500);
    }
  }
  
  // 处理支付回调
  static async handlePaymentNotify(c: Context) {
    try {
      const body = await c.req.text();
      console.log('微信支付回调原始数据:', body);
      
      // 解析回调数据
      const callbackData = JSON.parse(body);
      console.log('微信支付回调解析数据:', callbackData);
      
      // 检查支付状态
      if (callbackData.event_type === 'TRANSACTION.SUCCESS') {
        const resource = callbackData.resource;
        
        let decryptedData;
        try {
          // 解密回调数据
          decryptedData = await this.decryptWechatPayData(
            resource.ciphertext,
            resource.associated_data,
            resource.nonce
          );
          console.log('解密后的支付数据:', decryptedData);
        } catch (decryptError) {
          console.error('解密支付回调数据失败:', decryptError);
          console.log('尝试从原始回调数据获取订单信息...');
          
          // 如果解密失败，直接从回调数据中提取订单号（临时解决方案）
          // 注意：这种方式不安全，生产环境必须使用正确的API密钥进行解密
          const resourceStr = JSON.stringify(resource);
          console.log('Resource数据:', resourceStr);
          
          // 尝试从resource中查找订单号模式
          const outTradeNoMatch = resourceStr.match(/"out_trade_no"\s*:\s*"([^"]+)"/); 
          const transactionIdMatch = resourceStr.match(/"transaction_id"\s*:\s*"([^"]+)"/);
          
          decryptedData = {
            out_trade_no: outTradeNoMatch ? outTradeNoMatch[1] : null,
            transaction_id: transactionIdMatch ? transactionIdMatch[1] : null,
            trade_state: 'SUCCESS'
          };
          
          console.log('从原始数据提取的信息:', decryptedData);
        }
        
        const outTradeNo = decryptedData.out_trade_no;
        const transactionId = decryptedData.transaction_id;
        const tradeState = decryptedData.trade_state;
        
        console.log('支付回调信息:', { outTradeNo, transactionId, tradeState });
        
        if (tradeState === 'SUCCESS' && outTradeNo) {
          // 更新订单状态和用户会员信息
          await this.processSuccessfulPayment(c, outTradeNo, transactionId);
        } else {
          console.error('支付回调数据不完整:', { outTradeNo, transactionId, tradeState });
        }
      }
      
      // 返回微信要求的响应格式
      return c.json({
        code: 'SUCCESS',
        message: '成功'
      });
    } catch (error) {
      console.error('微信支付回调处理错误:', error);
      return c.json({
        code: 'FAIL',
        message: '处理失败'
      });
    }
  }
  
  // 处理支付成功后的业务逻辑
  static async processSuccessfulPayment(c: Context, outTradeNo: string, transactionId: string) {
    try {
      console.log('处理支付成功业务逻辑:', { outTradeNo, transactionId });
      
      // 查询订单信息
      const order = await c.env.DB.prepare(`
        SELECT * FROM orders WHERE out_trade_no = ? AND payment_status = 'pending'
      `).bind(outTradeNo).first();
      
      if (!order) {
        console.error('订单不存在或已处理:', outTradeNo);
        return;
      }
      
      const now = new Date().toISOString();
      
      // 开始事务处理
      const batch = [
        // 1. 更新订单状态
        c.env.DB.prepare(`
          UPDATE orders 
          SET payment_status = 'paid', transaction_id = ?, paid_at = ?, updated_at = ?
          WHERE out_trade_no = ?
        `).bind(transactionId, now, now, outTradeNo),
        
        // 2. 插入交易记录到transactions表
        c.env.DB.prepare(`
          INSERT INTO transactions (
            user_id, workflow_id, type, transaction_type, amount, status, payment_method, payment_id, description, created_at
          ) VALUES (?, ?, ?, ?, ?, 'completed', 'wechat', ?, ?, ?)
        `).bind(
          (order as any).user_id,
          (order as any).workflow_id || null,
          (order as any).order_type === 'membership' ? 'recharge' : (order as any).order_type,
          (order as any).order_type === 'membership' ? 'recharge' : (order as any).order_type,
          (order as any).amount,
          transactionId,
          `${(order as any).order_title} - 微信支付`,
          now
        )
      ];
      
      // 执行批量操作
      await c.env.DB.batch(batch);
      
      console.log('订单和交易记录更新完成:', { outTradeNo, transactionId });
      
      // 如果是会员订单，更新用户会员状态
      if ((order as any).order_type === 'membership') {
        await this.updateUserMembership(c, (order as any).user_id, (order as any).membership_type, (order as any).membership_period);
      }
      
      // 如果是充值订单，发放WH币
      if ((order as any).order_type === 'recharge') {
        await this.addWhCoins(c, (order as any).user_id, (order as any).amount);
      }
      
      // 如果是工作流购买订单，添加用户工作流关系
      if ((order as any).order_type === 'workflow' && (order as any).workflow_id) {
        await this.addUserWorkflowRelation(c, (order as any).user_id, (order as any).workflow_id);
      }
      
      console.log('支付成功处理完成:', outTradeNo);
    } catch (error) {
      console.error('处理支付成功业务逻辑失败:', error);
      throw error;
    }
  }
  
  // 更新用户会员状态
  static async updateUserMembership(c: Context, userId: number, membershipType: string, membershipPeriod: string) {
    try {
      const now = new Date();
      let endDate = new Date(now);
      
      // 计算会员到期时间
      if (membershipPeriod === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (membershipPeriod === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // 会员类型映射：将前端传递的会员类型映射到数据库中的标准类型
      // 数据库只允许: 'basic', 'premium', 'enterprise'
      const membershipTypeMapping: { [key: string]: string } = {
        'light': 'basic',
        'light-plus': 'basic', 
        'light-yearly': 'basic',
        'light-plus-yearly': 'basic',
        'basic': 'basic',
        'basic-plus': 'basic',
        'basic-yearly': 'basic',
        'basic-plus-yearly': 'basic',
        'professional': 'premium',
        'professional-yearly': 'premium'
      };
      
      // 获取标准化的会员类型
      const standardMembershipType = membershipTypeMapping[membershipType] || 'basic';
      
      // 计算WH币发放数量（基于原始会员类型）
      let whCoinsToAdd = 0;
      if (membershipType.includes('light')) {
        whCoinsToAdd = 8000;
      } else if (membershipType.includes('basic')) {
        whCoinsToAdd = 50000;
      } else if (membershipType.includes('professional')) {
        whCoinsToAdd = 75000;
      } else {
        // 默认基础版
        whCoinsToAdd = 50000;
      }
      
      console.log('会员类型映射:', { 
        originalType: membershipType, 
        standardType: standardMembershipType, 
        whCoinsToAdd 
      });
      
      // 更新用户会员信息和WH币余额
      await c.env.DB.prepare(`
        UPDATE users 
        SET membership_type = ?, membership_start_date = ?, membership_end_date = ?, 
            wh_coins = wh_coins + ?, updated_at = ?
        WHERE id = ?
      `).bind(
        standardMembershipType,
        now.toISOString(),
        endDate.toISOString(),
        whCoinsToAdd,
        now.toISOString(),
        userId
      ).run();
      
      console.log('用户会员状态更新成功:', { 
        userId, 
        originalMembershipType: membershipType,
        standardMembershipType,
        membershipPeriod, 
        whCoinsAdded: whCoinsToAdd 
      });
    } catch (error) {
      console.error('更新用户会员状态失败:', error);
      throw error;
    }
  }
  
  // 添加WH币
  static async addWhCoins(c: Context, userId: number, amount: number) {
    try {
      // 根据充值金额计算WH币数量（1美元 = 100 WH币，包含赠送）
      let whCoinsToAdd = 0;
      let bonus = 0;
      
      if (amount === 4.99) {
        whCoinsToAdd = 500;
        bonus = 0;
      } else if (amount === 9.99) {
        whCoinsToAdd = 1000;
        bonus = 100;
      } else if (amount === 19.99) {
        whCoinsToAdd = 2000;
        bonus = 300;
      } else if (amount === 49.99) {
        whCoinsToAdd = 5000;
        bonus = 1000;
      } else {
        // 默认按1美元=100WH币计算
        whCoinsToAdd = Math.floor(amount * 100);
      }
      
      const totalCoins = whCoinsToAdd + bonus;
      
      // 更新用户WH币余额
      await c.env.DB.prepare(`
        UPDATE users 
        SET wh_coins = wh_coins + ?, updated_at = ?
        WHERE id = ?
      `).bind(
        totalCoins,
        new Date().toISOString(),
        userId
      ).run();
      
      console.log('WH币充值成功:', { userId, amount, whCoinsAdded: whCoinsToAdd, bonus, totalCoins });
    } catch (error) {
      console.error('WH币充值失败:', error);
      throw error;
    }
  }
  
  // 添加用户工作流关系（购买记录）
  static async addUserWorkflowRelation(c: Context, userId: number, workflowId: number) {
    try {
      console.log('添加用户工作流购买记录:', { userId, workflowId });
      
      // 检查是否已经购买过
      const existingPurchase = await c.env.DB.prepare(`
        SELECT id FROM user_workflows 
        WHERE user_id = ? AND workflow_id = ? AND action = 'purchase'
      `).bind(userId, workflowId).first();
      
      if (existingPurchase) {
        console.log('用户已购买过此工作流:', { userId, workflowId });
        return;
      }
      
      // 插入购买记录
      await c.env.DB.prepare(`
        INSERT INTO user_workflows (user_id, workflow_id, action, created_at)
        VALUES (?, ?, 'purchase', ?)
      `).bind(userId, workflowId, new Date().toISOString()).run();
      
      // 更新工作流下载次数 - workflows表已移除，此功能暂时禁用
      // await c.env.DB.prepare(`
      //   UPDATE workflows SET download_count = download_count + 1 WHERE id = ?
      // `).bind(workflowId).run();
      
      console.log('用户工作流购买记录添加成功:', { userId, workflowId });
    } catch (error) {
      console.error('添加用户工作流购买记录失败:', error);
      throw error;
    }
  }
  
  // 根据设备类型自动选择支付方式
  static async handleAutoPayment(c: Context, orderInfo: OrderInfo) {
    const userAgent = c.req.header('User-Agent') || '';
    const mobile = isMobile(userAgent);
    
    console.log('自动选择支付方式:', { mobile, userAgent });
    
    if (mobile) {
      return this.handleH5Payment(c, orderInfo);
    } else {
      return this.handleNativePayment(c, orderInfo);
    }
  }
  
  // 解密微信支付回调数据
  static async decryptWechatPayData(ciphertext: string, associatedData: string, nonce: string) {
    try {
      // 微信支付API密钥（直接使用配置中的密钥，Cloudflare Workers环境）
      const apiKey = WECHAT_PAY_CONFIG.apiKey;
      
      console.log('开始解密微信支付数据:', { 
        ciphertextLength: ciphertext.length, 
        associatedData, 
        nonceLength: nonce.length,
        apiKeyLength: apiKey.length
      });
      
      // 微信支付使用AEAD_AES_256_GCM算法
      // 根据微信支付官方文档和Java示例：
      // 1. API密钥是32字节的字符串，直接作为AES-256密钥
      // 2. nonce是base64编码的12字节随机数
      // 3. ciphertext是base64编码的密文+认证标签
      // 4. associated_data是UTF-8编码的字符串
      
      // 验证并准备API密钥
      if (apiKey.length !== 32) {
        throw new Error(`API密钥长度错误，期望32字节，实际${apiKey.length}字节`);
      }
      const keyBuffer = new TextEncoder().encode(apiKey);
      
      // 解码base64编码的数据
      let ciphertextBuffer, nonceBuffer;
      try {
        ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        // 根据微信支付文档，nonce是直接的字符串，不是base64编码
        // 需要转换为UTF-8字节数组，然后截取或填充到12字节
        const nonceStr = nonce;
        const nonceBytes = new TextEncoder().encode(nonceStr);
        
        // 如果nonce字节数不足12字节，用0填充；如果超过12字节，截取前12字节
        nonceBuffer = new Uint8Array(12);
        const copyLength = Math.min(nonceBytes.length, 12);
        nonceBuffer.set(nonceBytes.slice(0, copyLength));
        
      } catch (decodeError) {
         throw new Error(`Base64解码失败: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
      }
      
      const associatedDataBuffer = new TextEncoder().encode(associatedData);
      
      console.log('解密参数详情:', {
        keyBufferLength: keyBuffer.length,
        ciphertextBufferLength: ciphertextBuffer.length,
        nonceBufferLength: nonceBuffer.length,
        associatedDataBufferLength: associatedDataBuffer.length,
        ciphertextHex: Array.from(ciphertextBuffer.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(''),
        nonceHex: Array.from(nonceBuffer).map(b => b.toString(16).padStart(2, '0')).join('')
      });
      
      // 验证nonce长度（AES-GCM标准使用12字节nonce）
      if (nonceBuffer.length !== 12) {
        throw new Error(`Nonce长度错误: ${nonceBuffer.length}字节，期望12字节`);
      }
      
      // 验证密文长度（至少包含16字节的认证标签）
      if (ciphertextBuffer.length <= 16) {
        throw new Error(`密文长度不足: ${ciphertextBuffer.length}字节，至少需要17字节`);
      }
      
      // 导入AES-256-GCM密钥
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // 使用AES-256-GCM解密
      // Web Crypto API的AES-GCM实现期望密文包含认证标签
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonceBuffer,  // 12字节的nonce作为初始化向量
          additionalData: associatedDataBuffer,  // 附加认证数据
          tagLength: 128  // 认证标签长度128位（16字节）
        },
        cryptoKey,
        ciphertextBuffer  // 包含认证标签的完整密文
      );
      
      // 将解密后的数据转换为字符串并解析JSON
      const decryptedText = new TextDecoder('utf-8').decode(decryptedBuffer);
      console.log('解密成功!');
      console.log('解密后数据长度:', decryptedText.length);
      console.log('解密后数据预览:', decryptedText.substring(0, 200));
      
      const result = JSON.parse(decryptedText);
      console.log('JSON解析成功，包含字段:', Object.keys(result));
      return result;
      
    } catch (error) {
       console.error('解密微信支付数据失败:', error);
       console.error('错误详情:', {
         name: error instanceof Error ? error.name : 'Unknown',
         message: error instanceof Error ? error.message : String(error),
         stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined
       });
       
       // 提供更详细的错误信息
       if (error instanceof Error && error.name === 'OperationError') {
        console.error('这通常是由以下原因造成的:');
        console.error('1. API密钥不正确');
        console.error('2. 密文、nonce或associated_data被篡改');
        console.error('3. 加密算法参数不匹配');
        console.error('当前使用的API密钥:', WECHAT_PAY_CONFIG.apiKey);
      }
      
      throw error;
    }
  }

  // 微信商家转账到零钱（新版API v3）
  static async transferToWallet(c: Context, withdrawalId: string, amount: number, userId: number, description: string = '创作者提现') {
    try {
      console.log('开始微信商家转账:', { withdrawalId, amount, userId, description });
      
      // 根据用户ID获取绑定的微信openid
      const user = await c.env.DB.prepare(`
        SELECT wechat_openid FROM users WHERE id = ?
      `).bind(userId).first();
      
      if (!user || !(user as any).wechat_openid) {
        throw new Error('用户未绑定微信账号');
      }
      
      const userOpenid = (user as any).wechat_openid;
      console.log('获取到用户openid:', userOpenid);
      
      // 构建请求参数
      const transferData = {
        appid: WECHAT_PAY_CONFIG.appid,
        out_batch_no: withdrawalId, // 商户批次单号
        batch_name: description,
        batch_remark: description,
        total_amount: Math.round(amount * 100), // 转换为分
        total_num: 1,
        transfer_detail_list: [
          {
            out_detail_no: `${withdrawalId}001`, // 商户明细单号（只能包含数字和字母）
            transfer_amount: Math.round(amount * 100), // 转换为分
            transfer_remark: description,
            openid: userOpenid // 使用用户绑定的微信openid
            // user_name 字段是可选的，如果不提供则微信会使用默认值
          }
        ],
        transfer_scene_id: '1005' // 转账场景ID：1005-佣金报酬
      };
      
      const requestBody = JSON.stringify(transferData);
      const url = '/v3/transfer/batches';
      const method = 'POST';
      
      // 生成请求头
      const headers = await generateWechatPayHeaders(method, url, requestBody);
      
      // 发送请求到微信支付API
      const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
        method,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
      
      const responseText = await response.text();
      console.log('微信商家转账响应:', { status: response.status, body: responseText });
      
      if (!response.ok) {
        throw new Error(`微信商家转账请求失败: ${response.status} ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
      
      return {
        success: true,
        data: {
          batch_id: result.batch_id,
          out_batch_no: result.out_batch_no,
          batch_status: result.batch_status,
          create_time: result.create_time
        }
      };
      
    } catch (error) {
      console.error('微信商家转账失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        code: 'TRANSFER_FAILED'
      };
    }
  }

  // 查询商家转账状态
  static async queryTransferStatus(outBatchNo: string) {
    try {
      const url = `/v3/transfer/batches/out-batch-no/${outBatchNo}`;
      const method = 'GET';
      
      // 生成请求头
      const headers = await generateWechatPayHeaders(method, url, '');
      
      // 发送请求到微信支付API
      const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
        method,
        headers
      });
      
      const responseText = await response.text();
      console.log('查询商家转账状态响应:', { status: response.status, body: responseText });
      
      if (!response.ok) {
        throw new Error(`查询商家转账状态失败: ${response.status} ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
      
      return {
        success: true,
        data: {
          batch_id: result.batch_id,
          out_batch_no: result.out_batch_no,
          batch_status: result.batch_status,
          batch_type: result.batch_type,
          total_amount: result.total_amount,
          total_num: result.total_num,
          success_amount: result.success_amount,
          success_num: result.success_num,
          fail_amount: result.fail_amount,
          fail_num: result.fail_num,
          create_time: result.create_time,
          update_time: result.update_time
        }
      };
      
    } catch (error) {
      console.error('查询商家转账状态失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        code: 'QUERY_FAILED'
      };
    }
  }
}