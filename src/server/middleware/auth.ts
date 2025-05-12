import { Context, Next } from 'hono'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 定义认证中间件使用的环境变量类型
export type AuthEnv = {
  Variables: {
    userId: string // 从 JWT 的 sub 字段获取
  }
}

// 在中间件外部或在一个可以按需创建客户端的地方初始化 Supabase Client
// 确保环境变量已加载
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // 为了在 Edge 函数中正确处理，你可能需要配置 storage and persistSession
      // 对于仅验证 token 的 getUser，默认配置通常足够
      // 如果遇到问题，可以查阅 Supabase JS 库关于 Edge 环境的文档
      autoRefreshToken: false, // 通常在后端/中间件中不需要自动刷新
      persistSession: false,   // 后端通常不持久化会话
    }
  });
} else {
  console.error('[AuthMiddleware] Supabase URL or Anon Key not configured. Auth will not work.')
}

// 认证中间件
export const authMiddleware = () => {
  return async (c: Context<AuthEnv>, next: Next) => {
    console.log('[AuthMiddleware] Triggered for path:', c.req.path);

    if (!supabase) {
      console.error('[AuthMiddleware] Supabase client not initialized due to missing config.')
      return c.json({ status: 'error', message: '服务器配置错误' }, 500)
    }

    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    console.log('[AuthMiddleware] Authorization Header:', authHeader ? 'Present' : 'Missing');
    console.log('[AuthMiddleware] Extracted Token:', token ? `***${token.slice(-6)}` : 'None'); // 只打印 token 尾部以保护敏感信息

    if (!token) {
      console.log('[AuthMiddleware] No token found, denying access.');
      return c.json({ status: 'error', message: '未提供认证令牌' }, 401)
    }

    try {
      console.log('[AuthMiddleware] Calling supabase.auth.getUser(token)...');
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        console.warn('[AuthMiddleware] supabase.auth.getUser failed or user not found.');
        console.warn('[AuthMiddleware] Error:', error?.message);
        console.warn('[AuthMiddleware] User:', user);
        console.log('[AuthMiddleware] Denying access.');
        return c.json({ status: 'error', message: '无效的认证令牌或用户不存在' }, 401)
      }

      // 将用户ID设置到上下文中
      console.log('[AuthMiddleware] Token validated successfully. User ID:', user.id);
      c.set('userId', user.id)

      // 继续执行
      console.log('[AuthMiddleware] Granting access and calling next().');
      await next()
    } catch (error) {
      // 这个 catch 块可能更多是捕获 supabase.auth.getUser 本身的意外错误，而不是认证失败
      console.error('[AuthMiddleware] Unexpected error during token validation process:', error)
      console.log('[AuthMiddleware] Denying access due to unexpected error.');
      return c.json({ status: 'error', message: '认证过程中发生错误' }, 500)
    }
  }
}

// 辅助函数：解码JWT Payload (无需验证签名，因为verify已做)
// 注意：实际应用中可能需要更健壮的库或方法
function decodeJwtPayload(token: string): { sub?: string; [key: string]: any } | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error("解码 JWT Payload 失败:", e)
    return null
  }
} 