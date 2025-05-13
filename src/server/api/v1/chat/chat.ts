import { Context } from 'hono'
import { streamSSE, SSEStreamingApi } from 'hono/streaming'
import { streamChatResponse, getChatCompletion } from './lib/chat.lib'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth'

// 定义路由的环境类型
type ChatEnv = AuthEnv['Variables'] 

// 流式聊天接口处理
export const streamChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  const { messages, conversationId } = await c.req.json()
  const userId = c.get('userId')

  return streamSSE(c, async (stream: SSEStreamingApi) => {
    await streamChatResponse({
      messages,
      conversationId,
      userId,
      onChunk: (chunk) => stream.writeln(chunk),
      onComplete: () => stream.close(),
    })
  })
}

// 完整聊天响应接口处理
export const completionChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  const { messages, conversationId } = await c.req.json()
  const userId = c.get('userId')
  
  const response = await getChatCompletion(messages, conversationId, userId)
  return c.json(response)
} 