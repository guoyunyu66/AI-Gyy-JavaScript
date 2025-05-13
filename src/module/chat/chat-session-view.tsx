import React from 'react'

interface ChatSessionViewProps {
  id: string;
}

export function ChatSessionView({ id }: ChatSessionViewProps) {

  // TODO: Fetch chat data based on id

  return (
    <div className="flex flex-col h-screen">
      {/* 聊天标题 */}
      <div className="border-b p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold">会话 #{id}</h1>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            特定会话的聊天记录将在这里显示 (ChatSessionView)
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            聊天输入框将在这里实现 (ChatSessionView)
          </div>
        </div>
      </div>
    </div>
  )
} 