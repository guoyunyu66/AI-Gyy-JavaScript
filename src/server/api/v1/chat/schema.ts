// src/server/api/v1/chat/schema.ts
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

/**
 * 定义聊天和会话相关请求参数的校验 Schema
 * 例如使用 Zod
 */

// 聊天消息基础 Schema
const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, '消息内容不能为空'),
});

// 聊天（流式和非流式）请求体验证 Schema
export const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1, '至少需要一条消息'),
  conversationId: z.string().optional(), // 或者是 z.string().uuid() 如果需要
});

// 创建会话请求体验证 Schema
export const createConversationSchema = z.object({
  // 允许 title 为空或不传，如果需要必须传则去掉 .optional()
  title: z.string().optional(), 
  // 允许 model 为空或不传，后续可以加入枚举或其他校验
  model: z.string().optional(), 
});

// Export the validator for creating conversations
export const createConversationValidator = zValidator('json', createConversationSchema);

// Export the validator for chat requests
export const chatRequestValidator = zValidator('json', chatRequestSchema); 