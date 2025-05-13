import { Context } from 'hono'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth'
// import { ConversationService } from '@/server/services/conversation.service'

// 定义路由的环境类型，Hono 的 Context 会自动推断，或者可以在 router.ts 中定义
type ConversationEnv = AuthEnv['Variables'] 

// 获取所有会话处理
export const getAllConversationsHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const userId = c.get('userId')
  console.log(`[API /conversations] Fetching conversations for user: ${userId}`);

  // 模拟后端数据
  const mockConversations = [
    { id: 'backend-1', title: '来自后端的React Hook讨论', updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'backend-2', title: '后端提供的Hono实践', updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'backend-3', title: `用户 ${userId} 的专属会话`, updatedAt: new Date().toISOString() },
  ];

  // 模拟延迟（可选，用于测试加载状态）
  // await new Promise(resolve => setTimeout(resolve, 500));

  return c.json({
    status: 'success',
    data: mockConversations, 
    // message: '获取所有会话功能待实现' // 可以移除或保留
  })
}

// 获取特定会话处理
export const getConversationByIdHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  // const conversation = await ConversationService.getConversation(id, userId)
  // TODO: 实现获取特定会话逻辑
  return c.json({
    status: 'success',
    data: { id },
    message: '获取特定会话功能待实现'
  })
}

// 创建新会话处理
export const createConversationHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const { title, model } = await c.req.json()
  const userId = c.get('userId')
  // const newConversation = await ConversationService.createConversation(userId, title, model)
  // TODO: 实现创建会话逻辑
  return c.json({
    status: 'success',
    data: { id: 'new-conversation-id' },
    message: '创建会话功能待实现'
  })
}

// 删除会话处理
export const deleteConversationHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  // await ConversationService.deleteConversation(id, userId)
  // TODO: 实现删除会话逻辑
  return c.json({
    status: 'success',
    message: `删除会话 ${id} 功能待实现`
  })
}

// 获取会话的所有消息处理
export const getConversationMessagesHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const id = c.req.param('id')
  const userId = c.get('userId')
  // const messages = await ConversationService.getConversationMessages(id, userId)
  // TODO: 实现获取会话消息逻辑
  return c.json({
    status: 'success',
    data: [],
    message: `获取会话 ${id} 的消息功能待实现`
  })
} 