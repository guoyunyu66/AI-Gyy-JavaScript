import { Context } from 'hono'
import { streamSSE, SSEStreamingApi } from 'hono/streaming'
import { streamChatResponse, getChatCompletion } from './lib/chat.lib'
import { AuthEnv } from '@/server/middleware/auth' // authMiddleware is not directly used in handlers but AuthEnv is
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'chat-handler' });

type ChatEnv = AuthEnv['Variables']

interface ChatRequestBody {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
  model?: string; // Allow client to specify model
}

export const streamChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  let requestBody: ChatRequestBody | null = null;
  try {
    requestBody = await c.req.json<ChatRequestBody>();
    log.info({ path: c.req.path, method: c.req.method, requestBody: { conversationId: requestBody.conversationId, model: requestBody.model, messagesCount: requestBody.messages.length } }, '流式聊天接口请求参数');
  } catch (error) {
    log.error({ path: c.req.path, method: c.req.method, error }, '解析流式聊天请求参数失败');
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const { messages, conversationId, model } = requestBody;
  const userId = c.get('userId');

  if (!userId) {
    log.warn('streamChatHandler: 未授权的访问尝试');
    return c.json({ error: 'Unauthorized' }, 401);
  }
  log.info({ userId, conversationId, model }, '开始处理流式聊天请求，调用 streamChatResponse');

  return streamSSE(c, async (stream: SSEStreamingApi) => {
    let finalConversationIdFromServer: string | undefined;
    log.debug({ userId, conversationId, model }, 'streamSSE 回调开始');

    await streamChatResponse({
      messages,
      conversationId,
      userId,
      model,
      onChunk: async (chunk) => {
        try {
          await stream.writeSSE({ data: chunk });
        } catch (e) {
          log.error({ error: e, userId, conversationId }, "写入SSE数据块时出错");
        }
      },
      onComplete: async (finalConversationId, assistantResponse) => {
        finalConversationIdFromServer = finalConversationId;
        try {
          await stream.writeSSE({
            event: 'conversationComplete',
            data: JSON.stringify({ conversationId: finalConversationId }),
          });
          log.info({ userId, conversationId: finalConversationId, responseLength: assistantResponse.length }, '流式聊天完成，已发送完成事件 (conversationComplete)');
        } catch (e) {
          log.error({ error: e, userId, conversationId: finalConversationId }, "写入 conversationComplete SSE 事件时出错");
        }
        await stream.close();
        log.debug({ userId, conversationId: finalConversationIdFromServer }, 'SSE流已关闭 (onComplete)');
      },
      onError: async (error) => {
        log.error({ error, userId, conversationId }, 'streamChatResponse 内部回调 onError 触发');
        try {
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({ message: error instanceof Error ? error.message : 'Stream processing error' })
          });
        } catch (e) {
          log.error({ error: e, userId, conversationId }, "写入 error SSE 事件时出错");
        }
        await stream.close();
        log.debug({ userId, conversationId }, 'SSE流已关闭 (onError)');
      }
    });
    log.info({ userId, finalConversationId: finalConversationIdFromServer }, 'streamChatResponse 调用结束，流式处理已设置');
  });
}

export const completionChatHandler = async (c: Context<{ Variables: ChatEnv }>) => {
  let requestBody: ChatRequestBody | null = null;
  try {
    requestBody = await c.req.json<ChatRequestBody>();
    log.info({ path: c.req.path, method: c.req.method, requestBody: { conversationId: requestBody.conversationId, model: requestBody.model, messagesCount: requestBody.messages.length } }, '普通聊天接口请求参数');
  } catch (error) {
    log.error({ path: c.req.path, method: c.req.method, error }, '解析普通聊天请求参数失败');
    return c.json({ error: 'Invalid request body' }, 400);
  }
  const { messages, conversationId, model } = requestBody;
  const userId = c.get('userId');

  if (!userId) {
    log.warn('completionChatHandler: 未授权的访问尝试');
    return c.json({ error: 'Unauthorized' }, 401);
  }
  log.info({ userId, conversationId, model }, '开始处理普通聊天补全请求，调用 getChatCompletion');
  
  const response = await getChatCompletion({ messages, conversationId, userId, model }); 
  
  if (response.status === 'success') {
    log.info({ userId, conversationId: response.conversationId, responseTextLength: response.text?.length }, '普通聊天补全成功，准备响应');
    return c.json({ text: response.text, conversationId: response.conversationId });
  } else {
    log.error({ userId, conversationId: response.conversationId, error: response.message }, '普通聊天补全失败，准备错误响应');
    return c.json({ error: response.message || 'Failed to get completion', conversationId: response.conversationId }, 500);
  }
} 