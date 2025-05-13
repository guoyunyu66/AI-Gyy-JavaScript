"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { ChatInput } from './components/chat-input' // Assuming path
import { MessageItem } from './components/message-item' // Assuming path
import { emit } from '@/lib/event-emitter' // Import emit
import type { Message } from './types';
import { useAuth } from '@/contexts/auth-context'; // <--- 引入 useAuth

// Type for the conversation data expected from GET /api/v1/chat/conversations/:id
// Based on conversation.service.ts and what MessageItem might need
interface ConversationData {
  id: string;
  title: string;
  model?: string;
  messages: Array<{
    id: string; // Prisma message ID
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string; // ISO string date
    // tokens?: number;
    // thinkingProcess?: string;
  }>;
  // other fields like createdAt, updatedAt if needed
}

interface ChatSessionViewProps {
  id: string;
}

export function ChatSessionView({ id }: ChatSessionViewProps) {
  const { session } = useAuth(); // <--- 获取 session
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false); // Renamed from isLoading for clarity
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling
  const abortControllerRef = useRef<AbortController | null>(null); // For aborting fetch

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversation history
  useEffect(() => {
    if (!id) return;

    const fetchConversation = async () => {
      setIsLoadingHistory(true);
      setError(null);
      // Abort previous fetch if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        if (!session?.access_token) { // <--- 添加检查
          setError("用户未认证，无法加载会话。");
          setIsLoadingHistory(false);
          return;
        }
        const response = await fetch(`/api/v1/chat/conversations/${id}`, {
          signal,
          credentials: 'include',
          headers: { // <--- 添加 headers
            'Authorization': `Bearer ${session.access_token}`,
            // 'Content-Type': 'application/json', // GET请求通常不需要Content-Type
          },
        });
        if (signal.aborted) return;

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch conversation: ${response.status}`);
        }
        const data: { status: string, data: ConversationData } = await response.json();
        if (data.status === 'success' && data.data) {
          setConversationTitle(data.data.title || `Conversation ${data.data.id.substring(0,8)}`);
          const formattedMessages: Message[] = data.data.messages.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(formattedMessages);
        } else {
          throw new Error('Invalid data structure from server');
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Fetch conversation history aborted.');
        } else {
          setError(err.message);
          console.error("Error fetching conversation:", err);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoadingHistory(false);
        }
      }
    };

    fetchConversation();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, session]); // <--- 添加 session 到依赖数组

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim()) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsSending(true);
    setError(null);

    // Abort previous stream if any
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant') // Send only user/assistant messages
      .map((m) => ({ role: m.role, content: m.content }));
    apiMessages.push({ role: 'user', content: userInput }); // Add current user input
    
    let tempAssistantMessageId: string | null = `assistant-stream-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempAssistantMessageId!, role: 'assistant', content: '', timestamp: new Date() }]);

    try {
      if (!session?.access_token) { // <--- 添加检查
        setError("用户未认证，无法发送消息。");
        setIsSending(false);
        if (tempAssistantMessageId) setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
        return;
      }
      const response = await fetch(`/api/v1/chat/dialog/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // <--- 修改这里
        },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId: id,
        }),
        signal,
        credentials: 'include',
      });

      if (signal.aborted) { // Request was aborted, likely by a new message send or unmount
        console.log('Message stream fetch aborted');
        // Remove temporary assistant message if it was added and then aborted
        if (tempAssistantMessageId) {
             setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
        }
        // setIsSending(false); // State might be stale if a new send started
        return; 
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (tempAssistantMessageId) setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
        tempAssistantMessageId = null;
        throw new Error(errorData.message || `API Error: ${response.status}`);
      }

      if (!response.body) {
        if (tempAssistantMessageId) setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
        tempAssistantMessageId = null;
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAIResponse = '';
      let firstChunkReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (signal.aborted) break; // Exit if aborted during streaming

        if (done) {
            if (tempAssistantMessageId && currentAIResponse) {
                 setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempAssistantMessageId
                        ? { ...msg, content: currentAIResponse, timestamp: new Date() }
                        : msg
                    )
                );
            }
            emit('conversationsUpdated'); // Emit event when stream is done
            console.log('[ChatSessionView] Stream done, emitted conversationsUpdated.');
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.substring(6);
            if (!rawData && !firstChunkReceived) continue; 
            
            if (!firstChunkReceived) {
                firstChunkReceived = true;
                currentAIResponse = rawData;
            } else {
                currentAIResponse += rawData;
            }
            
            if (tempAssistantMessageId) {
                setMessages(prev =>
                    prev.map(msg =>
                    msg.id === tempAssistantMessageId
                        ? { ...msg, content: currentAIResponse }
                        : msg
                    )
                );
            }
          } else if (line.startsWith('event: conversationComplete')) {
            const dataLine = lines.find(l => l.startsWith('data: '));
            if (dataLine) {
              const jsonData = JSON.parse(dataLine.substring(6));
              console.log('[ChatSessionView] Conversation complete event:', jsonData.conversationId);
            }
            if (tempAssistantMessageId && currentAIResponse) { // Ensure final content is set
                 setMessages(prev =>
                    prev.map(msg =>
                        msg.id === tempAssistantMessageId
                        ? { ...msg, content: currentAIResponse, timestamp: new Date() }
                        : msg
                    )
                );
            }
            emit('conversationsUpdated'); // Also emit here as a primary completion signal
            console.log('[ChatSessionView] conversationComplete event, emitted conversationsUpdated.');
            setIsSending(false);
            return; 
          } else if (line.startsWith('event: error')) {
            const dataLine = lines.find(l => l.startsWith('data: '));
            let streamErrorMessage = 'Stream processing error';
            if (dataLine) {
              try {
                const errorPayload = JSON.parse(dataLine.substring(6));
                streamErrorMessage = errorPayload.message || streamErrorMessage;
              } catch (e) { console.error('Could not parse stream error event data', e); }
            }
            setError(streamErrorMessage);
            if (tempAssistantMessageId) setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
            setIsSending(false);
            return; 
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Message send/stream aborted.');
        // If aborted, it might be due to a new message being sent quickly.
        // The current tempAssistantMessageId might already be cleaned up or replaced.
        // No explicit error set here, as it's an intentional abort.
      } else {
        console.error('Error sending message or processing stream:', err);
        setError(err.message);
        if (tempAssistantMessageId) {
           setMessages(prev => prev.filter(msg => msg.id !== tempAssistantMessageId));
        }
      }
    } finally {
      if (!signal.aborted) {
         setIsSending(false); // Only set if not aborted, as abort might be from a new send starting
      }
      // abortControllerRef.current = null; // Controller is managed per send, nulled if a new send starts or on unmount
    }
  }, [id, messages, session]); // <--- 添加 session 到依赖数组
  
  const displayMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');

  return (
    <div className="flex flex-col h-screen">
      {/* 聊天标题 */}
      <div className="border-b p-4 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">{isLoadingHistory ? 'Loading conversation...' : (conversationTitle || `会话 #${id.substring(0,8)}...`)}</h1>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            特定会话的聊天记录将在这里显示 (ChatSessionView)
          </div> */}
          {displayMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              role={msg.role as 'user' | 'assistant'} // Safe cast due to filter
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}
          <div ref={messagesEndRef} /> {/* For auto-scrolling */}
          {isSending && (
             <div className="flex justify-start mb-4">
                <div className="max-w-[80%] rounded-lg p-4 bg-gray-200 dark:bg-gray-700 dark:text-white">
                    AI思考中...
                </div>
             </div>
          )}
          {error && (
            <div className="rounded-md bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4 dark:border-gray-700">
        <div className="max-w-3xl mx-auto">
          {/* <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            聊天输入框将在这里实现 (ChatSessionView)
          </div> */}
          <ChatInput onSend={handleSendMessage} isLoading={isSending} />
        </div>
      </div>
    </div>
  )
} 