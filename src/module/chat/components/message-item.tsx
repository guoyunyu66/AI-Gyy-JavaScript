import React from 'react'

interface MessageItemProps {
  content: string
  role: 'user' | 'assistant'
  timestamp?: Date
  thinkingProcess?: string
  showThinking?: boolean
}

export function MessageItem({
  content,
  role,
  timestamp,
  thinkingProcess,
  showThinking = false,
}: MessageItemProps) {
  const isUser = role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
        }`}
      >
        <div className="mb-1 whitespace-pre-wrap">{content}</div>
        {timestamp && (
          <div className="mt-1 text-xs opacity-70">
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* 思考过程显示 */}
      {!isUser && thinkingProcess && showThinking && (
        <div className="mt-2 max-w-full rounded border border-gray-200 dark:border-gray-700 p-3 text-sm bg-gray-50 dark:bg-gray-800">
          <div className="font-semibold mb-1">思考过程:</div>
          <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
            {thinkingProcess}
          </div>
        </div>
      )}
    </div>
  )
} 