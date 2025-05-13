import { Context } from 'hono'
import { streamSSE, SSEStreamingApi } from 'hono/streaming'
import { streamChatResponse, getChatCompletion } from './lib/chat.lib'
import { authMiddleware, AuthEnv } from '@/server/middleware/auth'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'; // 引入类型

// 定义路由的环境类型
type ChatEnv = AuthEnv['Variables'] 

// 流式聊天接口处理
export const streamChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  // 显式定义请求体类型或使用 zod schema 推断
  const { messages, conversationId } = await c.req.json<{ messages: ChatCompletionMessageParam[], conversationId?: string }>(); 
  const userId = c.get('userId')

  // 确保 userId 存在
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  return streamSSE(c, async (stream: SSEStreamingApi) => {
    // 注意：直接传递 stream.writeln 可能导致类型问题，改为包装一下
    await streamChatResponse({
      messages,
      conversationId,
      userId, // 传递 userId
      onChunk: async (chunk) => {
        // Hono/streaming 要求数据以 'data: ...\n\n' 格式发送
        // stream.writeln 会自动处理部分格式，但最好明确
        // 如果 chunk 是纯文本，可以直接 writeln
        // 如果 chunk 是 JSON 字符串 (比如我们错误处理时)，需要确保格式正确
        // 假设 chat.lib.ts 的 onChunk 传递的是纯文本 delta
        try {
          await stream.writeSSE({ data: chunk }); // 使用 writeSSE 保证格式
        } catch (e) {
          console.error("Error writing SSE chunk:", e);
          // 尝试关闭流或进行其他错误处理
          stream.close(); // 尝试关闭
        }
      },
      onComplete: async () => {
        await stream.close(); // 确保流被关闭
      },
    })
  })
}

// 完整聊天响应接口处理
export const completionChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  const { messages, conversationId } = await c.req.json<{ messages: ChatCompletionMessageParam[], conversationId?: string }>();
  const userId = c.get('userId')

  // 确保 userId 存在
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // 将参数包装成对象传递
  const response = await getChatCompletion({ messages, conversationId, userId }); 
  
  // 根据 chat.lib.ts 返回的状态决定响应
  if (response.status === 'success') {
     return c.json({ text: response.text, conversationId: response.conversationId });
  } else {
     // 返回错误信息和适当的状态码
     return c.json({ error: response.message || 'Failed to get completion' }, 500);
  }
} 