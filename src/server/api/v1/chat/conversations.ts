import { Context } from 'hono'
import { AuthEnv } from '@/server/middleware/auth' // authMiddleware is not directly used here, but AuthEnv might be useful for context typing if extended.
import { conversationService } from '@/server/services/conversation.service' // Import the instance
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'conversations-handler' })

// 定义路由的环境类型
type ConversationEnv = AuthEnv['Variables']

// 获取所有会话处理
export const getAllConversationsHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const userId = c.get('userId')
  log.info({ path: c.req.path, method: c.req.method, userId }, '获取所有会话请求')
  if (!userId) {
    log.warn('getAllConversationsHandler: 未授权访问')
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }

  try {
    log.debug({ userId }, '调用 conversationService.getAllConversations')
    const conversations = await conversationService.getAllConversations(userId)
    const response = { status: 'success', data: conversations }
    log.info({ userId, count: conversations.length, responseStatus: response.status }, '成功获取所有会话，准备响应')
    return c.json(response)
  } catch (error) {
    log.error({ userId, error }, '获取所有会话列表时出错')
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Failed to fetch conversations' }, 500)
  }
}

// 获取特定会话处理
export const getConversationByIdHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const conversationId = c.req.param('id')
  const userId = c.get('userId')
  log.info({ path: c.req.path, method: c.req.method, userId, conversationId }, '获取特定会话请求')

  if (!userId) {
    log.warn({ conversationId }, 'getConversationByIdHandler: 未授权访问')
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }
  if (!conversationId) {
    log.warn({ userId }, 'getConversationByIdHandler: 未提供会话ID')
    return c.json({ status: 'error', message: 'Conversation ID is required' }, 400)
  }

  try {
    log.debug({ userId, conversationId }, '调用 conversationService.getConversationById')
    const conversation = await conversationService.getConversationById(conversationId, userId)
    if (!conversation) {
      log.warn({ userId, conversationId }, '会话未找到或无权访问')
      return c.json({ status: 'error', message: 'Conversation not found or access denied' }, 404)
    }
    const response = { status: 'success', data: conversation }
    log.info({ userId, conversationId, responseStatus: response.status }, '成功获取特定会话，准备响应')
    return c.json(response)
  } catch (error) {
    log.error({ userId, conversationId, error }, `获取特定会话 ${conversationId} 时出错`)
    return c.json({ status: 'error', message: error instanceof Error ? error.message : 'Failed to fetch conversation' }, 500)
  }
}

// 修改后的创建新会话处理
export const createConversationHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const userId = c.get('userId');
  if (!userId) {
    log.warn({ path: c.req.path }, 'CreateConversationHandler: 无法获取 userId');
    return c.json({ status: 'error', message: '用户未认证或无法识别用户' }, 401);
  }

  let requestBody: { title?: string; model?: string } = {};
  try {
    if (c.req.raw.headers.get("content-type")?.includes("application/json")) {
        requestBody = await c.req.json();
    } else if (c.req.header('content-length') && c.req.header('content-length') !== '0') {
        // Content-Type 不对，但又有内容，记录警告
        log.warn({ path: c.req.path, method: c.req.method, userId, headers: JSON.stringify(c.req.raw.headers) }, '创建新会话请求Content-Type不正确但有内容');
    }
    log.info({ path: c.req.path, method: c.req.method, userId, requestBody }, '创建新会话请求参数 (通用接口)');
  } catch (error) {
    log.warn({ path: c.req.path, method: c.req.method, userId, error }, '解析创建新会话请求参数失败 (可能body为空或非JSON) (通用接口)');
    // 即使解析失败，requestBody 也会是 {}，允许继续尝试使用默认值
  }

  const titleFromRequest = requestBody.title;
  const modelFromRequest = requestBody.model;

  const finalTitle = titleFromRequest || `新对话 ${new Date().toLocaleDateString()}`;
  const finalModel = modelFromRequest || 'gpt-4o';

  log.info({ userId, title: finalTitle, model: finalModel, titleProvided: !!titleFromRequest, modelProvided: !!modelFromRequest }, '准备调用 conversationService.createConversation (通用接口)');

  try {
    const newConversation = await conversationService.createConversation(userId, finalTitle, finalModel);
    const response = { status: 'success', data: newConversation }; // Prisma 对象通常直接包含 id 等字段
    log.info({ userId, conversationId: newConversation.id, title: finalTitle, model: finalModel, responseStatus: response.status }, '成功创建新会话，准备响应 (通用接口)');
    return c.json(response, 201);
  } catch (error: any) {
    log.error({ userId, title: finalTitle, model: finalModel, error: error.message, stack: error.stack }, '创建新会话时发生服务端错误 (通用接口)');
    return c.json({ status: 'error', message: error.message || 'Failed to create conversation' }, 500);
  }
};

// 删除会话处理
export const deleteConversationHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const conversationId = c.req.param('id')
  const userId = c.get('userId')
  log.info({ path: c.req.path, method: c.req.method, userId, conversationId }, '删除会话请求')

  if (!userId) {
    log.warn({ conversationId }, 'deleteConversationHandler: 未授权访问')
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }
  if (!conversationId) {
    log.warn({ userId }, 'deleteConversationHandler: 未提供会话ID')
    return c.json({ status: 'error', message: 'Conversation ID is required' }, 400)
  }

  try {
    log.debug({ userId, conversationId }, '调用 conversationService.deleteConversation')
    const result = await conversationService.deleteConversation(conversationId, userId)
    if (!result.success) {
      log.warn({ userId, conversationId, resultMessage: result.message }, '删除会话失败（业务逻辑）')
      return c.json({ status: 'error', message: result.message || 'Failed to delete conversation' }, 404)
    }
    const response = { status: 'success', message: result.message || 'Conversation deleted successfully' }
    log.info({ userId, conversationId, responseStatus: response.status }, '成功删除会话，准备响应')
    return c.json(response)
  } catch (error) {
    log.error({ userId, conversationId, error }, `删除会话 ${conversationId} 时出错`)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation'
    const statusCode = errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('access denied') ? 404 : 500
    return c.json({ status: 'error', message: errorMessage }, statusCode)
  }
}

// 获取会话的所有消息处理
export const getConversationMessagesHandler = async (c: Context<{ Variables: ConversationEnv }>) => {
  const conversationId = c.req.param('id')
  const userId = c.get('userId')
  log.info({ path: c.req.path, method: c.req.method, userId, conversationId }, '获取会话消息请求')

  if (!userId) {
    log.warn({ conversationId }, 'getConversationMessagesHandler: 未授权访问')
    return c.json({ status: 'error', message: 'Unauthorized' }, 401)
  }
  if (!conversationId) {
    log.warn({ userId }, 'getConversationMessagesHandler: 未提供会话ID')
    return c.json({ status: 'error', message: 'Conversation ID is required' }, 400)
  }

  try {
    log.debug({ userId, conversationId }, '调用 conversationService.getConversationMessages')
    const messages = await conversationService.getConversationMessages(conversationId, userId)
    const response = { status: 'success', data: messages }
    log.info({ userId, conversationId, count: messages.length, responseStatus: response.status }, '成功获取会话消息，准备响应')
    return c.json(response)
  } catch (error) {
    log.error({ userId, conversationId, error }, `获取会话 ${conversationId} 的消息时出错`)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch messages'
    const statusCode = errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('access denied') ? 404 : 500
    return c.json({ status: 'error', message: errorMessage }, statusCode)
  }
} 