import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth'
import {
  getAllConversationsHandler,
  getConversationByIdHandler,
  createConversationHandler,
  deleteConversationHandler,
  getConversationMessagesHandler
} from './conversations'
import {
  streamChatHandler,
  completionChatHandler
} from './chat'
import { createConversationValidator, chatRequestSchema, chatRequestValidator } from './schema'

// 定义路由的环境类型
type ChatAppEnv = { Variables: AuthEnv['Variables'] } 

// 创建聊天和会话模块的 Hono 实例
const chatRouter = new Hono<ChatAppEnv>().basePath('/chat')

// --- 会话相关路由 --- 
const conversationsPath = '/conversations'

// 对所有 /conversations 路由应用认证中间件
chatRouter.use(`${conversationsPath}/*`, authMiddleware())

// 获取所有会话
chatRouter.get(conversationsPath, getAllConversationsHandler)
// 获取特定会话
chatRouter.get(`${conversationsPath}/:id`, getConversationByIdHandler)
// 创建新会话
chatRouter.post(
  conversationsPath, 
  createConversationValidator,
  createConversationHandler
)
// 删除会话
chatRouter.delete(`${conversationsPath}/:id`, deleteConversationHandler)
// 获取会话的所有消息
chatRouter.get(`${conversationsPath}/:id/messages`, getConversationMessagesHandler)

// --- 聊天相关路由 --- 
const dialogPath = '/dialog'

// 对所有 /chat 路由应用认证中间件
chatRouter.use(`${dialogPath}/*`, authMiddleware())

// 流式聊天接口
chatRouter.post(
  `${dialogPath}/stream`, 
  chatRequestValidator,
  streamChatHandler
)
// 完整聊天响应接口
chatRouter.post(
  `${dialogPath}/completion`, 
  chatRequestValidator,
  completionChatHandler
)

// 导出路由
export { chatRouter }
