import React from 'react'
import { ChatSessionView } from '@/module/chat/chat-session-view'

interface ChatPageProps {
  params: {
    id: string
  }
}

// This page now extracts the ID and passes it to the view component.
// Data fetching and display logic are handled within ChatSessionView.
// Make the component async to await params
export default async function SpecificChatPage({ params }: ChatPageProps) {
  // const id = params.id; // 之前的直接访问方式

  // 尝试: 解构并提供一个不太可能匹配的默认值，看看 id 是否真的 undefined
  const resolvedParams = await params; // Await params and store the result
  const { id = "DEFAULT_ID_IF_UNDEFINED" } = resolvedParams; // Use the resolvedParams for destructuring

  console.log(`[SpecificChatPage] Attempting to use id: ${id}`);

  if (!id || id === "DEFAULT_ID_IF_UNDEFINED") {
    console.error(`[SpecificChatPage] Error: Conversation ID is effectively missing. Received id: ${id}`);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>错误</h1>
        <p>未能加载对话，ID 无效或缺失。</p>
      </div>
    );
  }

  // 使用 key={id} 来确保当 id 变化时，ChatSessionView 组件能够正确地重新挂载或更新其内部状态
  return <ChatSessionView key={id} id={id} />;
} 