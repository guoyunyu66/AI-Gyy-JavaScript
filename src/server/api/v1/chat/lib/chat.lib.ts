// src/server/api/v1/chat/lib/chat.lib.ts

import { OpenAI } from 'openai';
// import { OpenAIStream, StreamingTextResponse, experimental_StreamData } from 'ai'; // <--- 移除
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 初始化 OpenAI 客户端
// 确保你的环境变量 OPENAI_API_KEY 已经设置
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 定义 streamChatResponse 函数的参数类型
interface StreamChatParams {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
  userId: string;
  onChunk: (chunk: string) => Promise<void> | void;
  onComplete: () => Promise<void> | void;
}

/**
 * 处理流式聊天响应的核心逻辑
 */
export async function streamChatResponse(params: StreamChatParams) {
  const { messages, conversationId, userId, onChunk, onComplete } = params;
  console.log(`Streaming response for user ${userId}, conversation ${conversationId || 'new'}`);

  try {
    const responseStream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: messages,
    });

    // 直接迭代 OpenAI SDK 返回的 Stream
    for await (const chunk of responseStream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // 将获取到的内容块传递给 onChunk 回调
        // chat.ts 中的 streamSSE 会处理 SSE 格式包装
        await params.onChunk(content);
      }
      // 如果需要，可以在这里处理其他 chunk 信息，比如 function calls
    }

    // 流结束时调用 onComplete
    await params.onComplete();

    return { status: 'success', conversationId: conversationId || 'temp-stream-id' };

  } catch (error) {
    console.error('Error streaming chat response:', error);
    // TODO: 更健壮的错误处理
    // 示例：发送一个错误类型的 chunk（如果前端能处理）
    try {
       await params.onChunk(JSON.stringify({ type: 'error', content: 'An error occurred during streaming.' }));
    } catch (writeError) {
        console.error("Failed to write error chunk:", writeError);
    }
    await params.onComplete(); // 确保关闭
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// 定义 getChatCompletion 函数的参数类型
interface CompletionChatParams {
  messages: ChatCompletionMessageParam[];
  conversationId?: string;
  userId: string;
}

/**
 * 获取完整聊天响应的核心逻辑
 */
export async function getChatCompletion(params: CompletionChatParams) {
  const { messages, conversationId, userId } = params;
  console.log(`Getting completion for user ${userId}, conversation ${conversationId || 'new'}`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: false,
      messages: messages,
    });

    const completion = response.choices[0]?.message?.content;

    if (!completion) {
      throw new Error('No completion content received from OpenAI.');
    }

    return {
      text: completion,
      conversationId: conversationId || 'temp-completion-id',
      status: 'success'
    };

  } catch (error) {
    console.error('Error getting chat completion:', error);
    return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        text: null
    };
  }
}
