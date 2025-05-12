import React from 'react'

export function ChatLandingView() {
  return (
    <div className="flex flex-col h-screen">
      {/* 聊天区域 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            聊天区域将在这里实现 (ChatLandingView)
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            聊天输入框将在这里实现 (ChatLandingView)
          </div>
        </div>
      </div>
    </div>
  )
} 