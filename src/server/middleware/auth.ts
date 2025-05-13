import { Context, Next } from 'hono'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'auth-middleware' })

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
  log.error('[认证中间件] Supabase URL 或匿名密钥未配置。认证功能将无法工作。')
}

// 认证中间件
export const authMiddleware = () => {
  return async (c: Context<AuthEnv>, next: Next) => {
    log.info({ path: c.req.path }, '[认证中间件] 已触发')

    if (!supabase) {
      log.error('[认证中间件] Supabase 客户端因配置缺失未初始化。')
      return c.json({ status: 'error', message: '服务器配置错误' }, 500)
    }

    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      log.warn({ path: c.req.path }, '[认证中间件] 未找到令牌，拒绝访问。')
      return c.json({ status: 'error', message: '未提供认证令牌' }, 401)
    }

      try {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        log.warn({ path: c.req.path, error: error?.message, userId: user?.id }, '[认证中间件] supabase.auth.getUser 失败或用户未找到，拒绝访问。')
        return c.json({ status: 'error', message: '无效的认证令牌或用户不存在' }, 401)
      }

      // 将用户ID设置到上下文中
      log.info({ path: c.req.path, userId: user.id }, '[认证中间件] 令牌验证成功。')
      c.set('userId', user.id)

      await next()
    } catch (error) {
      // 这个 catch 块可能更多是捕获 supabase.auth.getUser 本身的意外错误，而不是认证失败
      log.error({ path: c.req.path, error }, '[认证中间件] 令牌验证过程中发生意外错误，拒绝访问。')
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
    log.error({ error: e, token }, '解码 JWT Payload 失败')
    return null
  }
} 