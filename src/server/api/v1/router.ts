import { Hono } from 'hono'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth' // 导入认证中间件
import { authRouter } from './auth/router'
import { chatRouter } from './chat/router'

// 定义路由的环境类型，确保中间件能正确设置变量
// 注意：如果 authMiddleware 和 chatRouter 内部的 Env 不同，需要合并或使用更通用的类型
type V1Env = { Variables: AuthEnv['Variables'] } 

// 创建 V1 版本的 API 路由
const v1Router = new Hono<V1Env>()

// --- 挂载现有模块路由 ---

// 挂载认证模块路由，基础路径为 /v1/auth
v1Router.route('/', authRouter) // 修正路径

// --- 应用全局认证中间件到所有后续路由 ---
// 这个中间件会作用于将来添加到 v1Router 的、定义在此之后的任何新路由
// 它不会影响上面已经挂载的 authRouter 和 chatRouter (因为它们内部已经处理了自己的认证)
v1Router.use(authMiddleware()) 

// 挂载聊天模块路由，基础路径为 /v1 (内部路径 /chat, /conversations)
v1Router.route('/', chatRouter) 

// --- 未来可能添加的受保护路由示例 ---
// v1Router.route('/', ...)
// v1Router.route('/', ...)

export { v1Router }
