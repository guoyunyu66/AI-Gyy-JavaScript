'use client'; // Add this directive

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Corrected import for App Router
import { ChatInput } from './components/chat-input';
import { emit } from '@/lib/event-emitter'; // Import emit
import { useAuth } from '@/contexts/auth-context'; //确保导入
import type { Message } from '@/module/chat/types'; // <--- 使用别名路径导入

// Define a simple message structure for the API call
interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function ChatLandingView() {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth(); // 获取 session
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to manage aborting the fetch request if component unmounts or new request starts
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;
    if (!session?.access_token) {
      console.error('错误：用户未认证，无法发送消息。');
      setError('用户未认证，无法发送消息。请重新登录。'); // 或者进行其他错误处理
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const initialUserMessage: ApiMessage = {
      role: 'user',
      content: input,
    };

    try {
      const response = await fetch('/api/v1/chat/dialog/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // 添加 Authorization header
        },
        body: JSON.stringify({
          messages: [initialUserMessage],
          // No conversationId is sent for a new chat
          // model: "gpt-4o" // Optionally specify model
        }),
        signal, // Pass the abort signal to fetch
      });

      if (signal.aborted) {
        console.log("Fetch aborted for new chat creation");
        return; // Stop processing if the request was aborted
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // We don't need to display the AI's first message here, just wait for conversationComplete
      while (true) {
        const { done, value } = await reader.read();
        if (signal.aborted) {
          console.log("Stream reading aborted");
          break;
        }
        if (done) {
          // This means stream ended without 'conversationComplete', which is unexpected if successful
          setError("对话流意外结束，未能获取会话ID。");
          setIsLoading(false); // Set loading false as stream ended unexpectedly
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: conversationComplete')) {
            const dataLine = lines.find(l => l.startsWith('data: '));
            if (dataLine) {
              try {
                const jsonData = JSON.parse(dataLine.substring(6));
                if (jsonData.conversationId) {
                  console.log('[ChatLandingView] New conversation created:', jsonData.conversationId);
                  emit('conversationsUpdated'); // Emit event before redirecting
                  router.push(`/chat/${jsonData.conversationId}`);
                  return; // Exit the loop and function
                } else {
                  setError("未能从服务器获取有效的会话ID。");
                }
              } catch (e) {
                console.error("Error parsing conversationComplete event:", e);
                setError("解析会话完成事件时出错。");
              }
            }
            setIsLoading(false); // Should be inside the if, or handled by return
            return; // Ensure we stop processing after handling (or failing to handle) complete
          } else if (line.startsWith('event: error')) {
            const dataLine = lines.find(l => l.startsWith('data: '));
            let streamErrorMessage = "创建新对话时发生流错误。";
            if (dataLine) {
              try {
                const errorPayload = JSON.parse(dataLine.substring(6));
                streamErrorMessage = errorPayload.message || streamErrorMessage;
              } catch (e) { console.error('Could not parse stream error event data', e); }
            }
            setError(streamErrorMessage);
            setIsLoading(false);
            return; // Exit loop on stream error
          }
          // We are not processing 'data:' events with message content here
          // as the primary goal is redirection upon conversation creation.
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("New chat request aborted by user.");
        // If aborted, isLoading might have been set by a new send, or should remain true if no new send.
        // For simplicity, let's assume if it's aborted, a new action will manage isLoading or it was a component unmount.
        // If this component is still mounted and request was aborted by *this* instance (e.g. quick double send), reset it.
        if (abortControllerRef.current?.signal.aborted && !isLoading) {
            // This state is tricky, if aborted by THIS controller, what should isLoading be?
            // Let's assume the calling context (a new send) will set it true.
        } else if (!abortControllerRef.current?.signal.aborted) {
             // If not aborted by current controller, it means error happened before abort or no abort
            setIsLoading(false);
        }
        return; // Important to return after handling abort
      }
      console.error("Error creating new chat:", err);
      setError(err.message || "创建新对话失败，请稍后再试。");
      setIsLoading(false); // Ensure isLoading is reset on general errors
    } finally {
      // Resetting isLoading here can be problematic if router.push leads to unmount.
      // It's generally better to set isLoading(false) in specific terminal paths of the try-catch.
      // The AbortController is nulled to allow new requests.
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">开始新的聊天</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            输入您的第一条消息以开始与 AI 的新对话。
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
          {error && (
            <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
              错误: {error}
            </p>
          )}
          {isLoading && (
            <p className="mt-4 text-center text-sm text-blue-600 dark:text-blue-400">
              正在创建新的对话，请稍候...
            </p>
          )}
        </div>

        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          {/* 您可以在此处添加一些提示或示例问题 */}
          例如: "帮我写一封邮件" 或 "今天天气怎么样?"
        </div>
      </div>
    </div>
  );
} 