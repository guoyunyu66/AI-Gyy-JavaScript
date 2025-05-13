import React from 'react'
import Link from 'next/link'
import type { Conversation } from '@/types'
import { User } from '@supabase/supabase-js'

interface SidebarProps {
  conversations: Conversation[]
  onNewChat: () => void
  user: User | null
}

export function Sidebar({ conversations, onNewChat, user }: SidebarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 新对话按钮 */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          新对话
        </button>
      </div>
      
      {/* 会话列表 */}
      <div className="flex-1 overflow-auto">
        {conversations.length > 0 ? (
          <ul className="space-y-1 px-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  className="block p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="truncate font-medium">{conversation.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {conversation.updatedAt.toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            没有历史会话
          </div>
        )}
      </div>
      
      {/* 用户资料 */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 mt-auto">
        {user ? (
          <Link href="/profile" className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2">
              {user.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div>
              <div className="font-medium truncate">{user.email}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">查看资料</div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center p-2 rounded-md text-gray-500">
             <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2">👤</div>
             <div>加载中...</div>
          </div>
        )}
      </div>
    </div>
  )
} 