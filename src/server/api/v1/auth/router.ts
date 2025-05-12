import { Hono } from 'hono'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth' // 导入认证中间件和环境类型
import {
  loginHandler,
  registerHandler,
  logoutHandler,
  sessionHandler
} from './auth'
import { loginValidator, registerValidator } from './schema'

// 定义路由的环境类型
type AuthAppEnv = { Variables: AuthEnv['Variables'] } 

// 创建认证模块的 Hono 实例，并应用类型
const authRouter = new Hono<AuthAppEnv>()

// --- 公开路由 (无需认证) ---
authRouter.post(
  '/login',
  loginValidator,
  loginHandler
)
authRouter.post(
  '/register',
  registerValidator,
  registerHandler
)

// --- 应用认证中间件到后续路由 ---
// 这个中间件会作用于下面定义的 /logout 和 /session 路由
authRouter.use(authMiddleware()) 

// --- 受保护路由 (需要认证) ---
authRouter.post('/logout', logoutHandler)
authRouter.get('/session', sessionHandler)

// 导出认证路由
export { authRouter }
