// src/server/api/v1/chat/lib/chat.lib.ts

import { logger } from '@/lib/logger';
import { OpenAI } from 'openai';
// import { OpenAIStream, StreamingTextResponse, experimental_StreamData } from 'ai'; // <--- 移除
import type { ChatCompletionContentPart, ChatCompletionMessageParam, ChatCompletionContentPartText } from 'openai/resources/chat/completions';
import { conversationService } from '@/server/services/conversation.service'; // 导入服务
// import { Prisma } from '@prisma/client'; // For error types if needed, currently not directly used for Prisma specific errors

const log = logger.child({ module: 'chat-lib' });

// 初始化 OpenAI 客户端
const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;

if (!apiKey) {
  log.warn('[OpenAI 客户端] OPENAI_API_KEY 未设置。OpenAI API 调用可能会失败。');
  // 如果 API 密钥对于应用启动至关重要，您可能需要在此处抛出错误
  // throw new Error('OPENAI_API_KEY 未设置。');
}
// No need to throw error for baseURL, as it might be optional for some users using default OpenAI URL
// But we should log if it's expected by the user.
if (process.env.EXPECT_OPENAI_BASE_URL === 'true' && !baseURL) {
    log.warn('[OpenAI 客户端] EXPECT_OPENAI_BASE_URL 为 true 但 OPENAI_BASE_URL 未设置。');
}

const openai = new OpenAI({
  apiKey: apiKey, 
  baseURL: baseURL, // 在此处添加 baseURL
});

// Helper to extract text content
function getTextContent(content: ChatCompletionMessageParam['content']): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    // Filter for text parts and join them.
    // This will ignore image_url parts, function call parts, tool call parts, and refusal parts.
    return content
      .filter((part): part is ChatCompletionContentPartText => part.type === 'text')
      .map(part => part.text)
      .join('\n');
  }
  // Handle null or undefined content, though ChatCompletionMessageParam['content'] should not be undefined by itself.
  // If it can be null (e.g. from response.choices[0]?.message?.content which can be null for function calls)
  if (content === null) return ''; 
  return ''; // Should ideally not be reached if content is strictly ChatCompletionMessageParam['content']
}

// 定义 streamChatResponse 函数的参数类型
interface StreamChatParams {
  messages: ChatCompletionMessageParam[];
  conversationId?: string; // 初始 conversationId
  userId: string;
  model?: string; // AI 模型，用于创建会话时
  onChunk: (chunk: string) => Promise<void> | void;
  onComplete: (finalConversationId: string, assistantResponse: string) => Promise<void> | void; // 传递最终ID和完整回复
  onError?: (error: any) => Promise<void> | void; // 可选的错误回调
}

/**
 * 处理流式聊天响应的核心逻辑
 */
export async function streamChatResponse(params: StreamChatParams) {
  const { messages, conversationId: initialConversationId, userId, model = 'gpt-4o', onChunk, onComplete, onError } = params;
  log.debug({ function: 'streamChatResponse', params: { userId, initialConversationId, model, messagesCount: messages.length } }, 'streamChatResponse 函数入口参数记录');
  let currentConversationId = initialConversationId;
  let assistantFullResponse = '';
  log.info({ userId, conversationId: currentConversationId, model, baseURL: baseURL || '默认' }, `用户 ${userId} 的流式响应开始`);

  try {
    if (!apiKey) { // Check again, in case the warning was ignored and app continued
        log.error('[OpenAI 客户端] OpenAI API 密钥未配置，无法处理流式聊天。')
        throw new Error('OpenAI API 密钥未配置。');
    }
    log.debug({ userId, model, messagesCount: messages.length }, '准备调用 OpenAI chat.completions.create (stream)');
    const responseStream = await openai.chat.completions.create({
      model: model,
      stream: true,
      messages: messages,
    });
    log.debug({ userId, model }, 'OpenAI chat.completions.create (stream) 调用成功，开始接收数据流');

    for await (const chunk of responseStream) {
      const contentChunk = chunk.choices[0]?.delta?.content || '';
      if (contentChunk) {
        assistantFullResponse += contentChunk;
        await onChunk(contentChunk);
      }
    }
    log.debug({ userId, conversationId: currentConversationId, responseLength: assistantFullResponse.length }, 'OpenAI 数据流接收完毕');
    log.info({ userId, conversationId: currentConversationId, aiResponse: assistantFullResponse }, '完整AI回复内容 (流式)');

    // 流结束，处理会话和消息保存
    if (!currentConversationId) {
      // 创建新会话 (使用用户第一条消息做标题，或默认标题)
      const userFirstMessageContent = getTextContent(messages.find(m => m.role === 'user')?.content) || '新聊天';
      const newConvTitle = userFirstMessageContent.substring(0, 50); // 简单截取作为标题
      log.debug({ userId, title: newConvTitle, model }, '准备创建新会话 (流式)');
      const newConversation = await conversationService.createConversation(userId, newConvTitle, model);
      currentConversationId = newConversation.id;
      log.info({ userId, conversationId: currentConversationId, title: newConvTitle }, '新会话已创建 (流式)');
    }

    // 保存用户发送的消息 (通常是 messages 数组的最后一条)
    const userMessageToSave = messages[messages.length - 1];
    if (userMessageToSave && currentConversationId) { // Ensure currentConversationId is defined
      log.debug({ userId, conversationId: currentConversationId, role: userMessageToSave.role }, '准备保存用户消息 (流式)');
      await conversationService.addMessageToConversation(currentConversationId, {
        role: userMessageToSave.role,
        content: getTextContent(userMessageToSave.content),
      });
      log.debug({ userId, conversationId: currentConversationId }, '用户消息保存成功 (流式)');
    }

    // 保存AI的完整回复
    if (assistantFullResponse && currentConversationId) { // Ensure currentConversationId is defined
      log.debug({ userId, conversationId: currentConversationId, responseLength: assistantFullResponse.length }, '准备保存AI回复 (流式)');
      await conversationService.addMessageToConversation(currentConversationId, {
        role: 'assistant',
        content: assistantFullResponse,
      });
      log.debug({ userId, conversationId: currentConversationId }, 'AI回复保存成功 (流式)');
    }
    
    if (currentConversationId) { // Only call onComplete if we have a valid conversation context
        await onComplete(currentConversationId, assistantFullResponse); 
        log.info({ function: 'streamChatResponse', userId, conversationId: currentConversationId, status: 'success' }, 'streamChatResponse 成功完成');
        return { status: 'success' as const, conversationId: currentConversationId };
    } else {
        // This case should ideally not be reached if conversation creation logic is sound
        // or if initialConversationId was provided.
        log.error({ userId, initialConversationId }, "流式聊天响应：在 onComplete 前 currentConversationId 未定义");
        throw new Error("未能为流式处理建立会话上下文。");
    }

  } catch (error: any) { // Explicitly type error as any to access its properties
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      // 如果是 Prisma 错误，尝试记录更多信息
      code: error.code, // For Prisma errors like P2003
      meta: error.meta, // For Prisma error metadata
      clientVersion: error.clientVersion // For Prisma client version
    };
    log.error({ 
        function: 'streamChatResponse', 
        error: errorDetails, // 使用处理过的错误详情
        userId, 
        conversationId: currentConversationId 
    }, '流式聊天响应出错');
    if (onError) {
      await onError(error); // 仍然传递原始错误对象给回调
    } else {
        try {
            await onChunk(JSON.stringify({ type: 'error', content: '流处理过程中发生错误。' }));
        } catch (writeError) {
            log.error({ error: writeError, userId }, "写入错误信息块到客户端失败");
        }
    }
    if (params.onComplete && typeof params.onComplete === 'function') {
      await params.onComplete(currentConversationId || '错误-无ID', ''); 
    }
    return { status: 'error' as const, message: error.message || '未知错误', conversationId: currentConversationId };
  }
}

// 定义 getChatCompletion 函数的参数类型
interface CompletionChatParams {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
  userId: string;
  model?: string;
}

/**
 * 获取完整聊天响应的核心逻辑
 */
export async function getChatCompletion(params: CompletionChatParams) {
  const { messages, conversationId: initialConversationId, userId, model = 'gpt-3.5-turbo' } = params;
  log.debug({ function: 'getChatCompletion', params: { userId, initialConversationId, model, messagesCount: messages.length } }, 'getChatCompletion 函数入口参数记录');
  let currentConversationId = initialConversationId;
  log.info({ userId, conversationId: currentConversationId, model, baseURL: baseURL || '默认' }, `用户 ${userId} 的普通聊天响应开始`);

  try {
    if (!apiKey) { // Check again
        log.error('[OpenAI 客户端] OpenAI API 密钥未配置，无法获取聊天补全。')
        throw new Error('OpenAI API 密钥未配置。');
    }
    log.debug({ userId, model, messagesCount: messages.length }, '准备调用 OpenAI chat.completions.create (non-stream)');
    const response = await openai.chat.completions.create({
      model: model,
      stream: false,
      messages: messages,
    });
    log.debug({ userId, model, choiceCount: response.choices.length }, 'OpenAI chat.completions.create (non-stream) 调用成功');

    const assistantRawContent = response.choices[0]?.message?.content;
    const assistantCompletion = getTextContent(assistantRawContent);
    log.debug({ userId, conversationId: currentConversationId, completionLength: assistantCompletion.length, hasRawContent: !!assistantRawContent }, '获取到AI补全内容');
    log.info({ userId, conversationId: currentConversationId, aiResponse: assistantCompletion }, '完整AI回复内容 (补全模式)');

    if (assistantCompletion === '' && assistantRawContent !== null && typeof assistantRawContent !== 'string') {
      // This means content was an array of non-text parts, or an unsupported structure
      log.warn({ userId, conversationId: currentConversationId, rawContent: assistantRawContent }, "OpenAI 返回了非文本或复杂内容部分，导致文本补全为空。");
      // Depending on application logic, this might be an error or an acceptable empty response.
      // For now, we proceed with the empty string, but an error might be more appropriate if text is strictly expected.
    }
    if (assistantCompletion === '' && assistantRawContent === null) {
        // This means OpenAI explicitly returned null content. Could be a function/tool call response without text.
        // If we only expect text, this is effectively no completion.
        log.info({ userId, conversationId: currentConversationId }, "OpenAI 为补全返回了 null 内容，视为空字符串处理。");
    }

    // 处理会话和消息保存
    if (!currentConversationId) {
      const userFirstMessageContent = getTextContent(messages.find(m => m.role === 'user')?.content) || '新聊天';
      const newConvTitle = userFirstMessageContent.substring(0, 50);
      log.debug({ userId, title: newConvTitle, model }, '准备创建新会话 (补全模式)');
      const newConversation = await conversationService.createConversation(userId, newConvTitle, model);
      currentConversationId = newConversation.id;
      log.info({ userId, conversationId: currentConversationId, title: newConvTitle }, '新会话已创建 (补全模式)');
    }

    const userMessageToSave = messages[messages.length - 1];
    if (userMessageToSave && currentConversationId) { // Ensure currentConversationId is defined
      log.debug({ userId, conversationId: currentConversationId, role: userMessageToSave.role }, '准备保存用户消息 (补全模式)');
      await conversationService.addMessageToConversation(currentConversationId, {
        role: userMessageToSave.role,
        content: getTextContent(userMessageToSave.content),
      });
      log.debug({ userId, conversationId: currentConversationId }, '用户消息保存成功 (补全模式)');
    }

    // Save AI completion even if it's an empty string (if that's valid for the application)
    if (currentConversationId) { // Ensure currentConversationId is defined
        log.debug({ userId, conversationId: currentConversationId, completionLength: assistantCompletion.length }, '准备保存AI回复 (补全模式)');
        await conversationService.addMessageToConversation(currentConversationId, {
            role: 'assistant',
            content: assistantCompletion, // assistantCompletion is already a string here
        });
        log.debug({ userId, conversationId: currentConversationId }, 'AI回复保存成功 (补全模式)');
    }

    if (!currentConversationId) {
        // This should not be reached if logic is correct
        log.error({ userId, initialConversationId }, "获取聊天补全：在返回成功前 currentConversationId 未定义");
        throw new Error("未能为补全建立会话上下文。");
    }

    const result = {
      text: assistantCompletion,
      conversationId: currentConversationId,
      status: 'success' as const
    };
    log.info({ function: 'getChatCompletion', userId, conversationId: currentConversationId, status: 'success' }, 'getChatCompletion 成功完成');
    return result;

  } catch (error: any) { // Explicitly type error as any
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion
    };
    log.error({ 
        function: 'getChatCompletion', 
        error: errorDetails, 
        userId, 
        conversationId: currentConversationId 
    }, '获取聊天补全出错');
    return {
        status: 'error' as const,
        message: error.message || '未知错误',
        text: null,
        conversationId: currentConversationId
    };
  }
}
