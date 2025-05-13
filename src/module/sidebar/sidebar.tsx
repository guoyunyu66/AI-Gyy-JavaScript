import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Conversation as ConversationType } from '@/types'
import { User } from '@supabase/supabase-js'
import { on } from '@/lib/event-emitter'
import { useAuth } from '@/contexts/auth-context'
import { ProfileCard } from '@/module/profile/components/profile-card'

// Define the structure of conversation data expected from the API
interface ApiConversation {
  id: string
  title: string
  model?: string
  createdAt: string // Assuming ISO string date
  updatedAt: string // Assuming ISO string date
}

interface SidebarProps {
  onNewChat: () => void
}

export function Sidebar({ onNewChat }: SidebarProps) {
  const [conversations, setConversations] = useState<ApiConversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, session, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showProfileCard, setShowProfileCard] = useState(false)
  const profileAreaRef = useRef<HTMLDivElement>(null)
  const cardTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchConversations = useCallback(async (isManuallyTriggered = false) => {
    if (authLoading && !isManuallyTriggered) {
      console.log('[Sidebar] 认证加载中，延迟获取会话。')
      return
    }

    if (isRedirecting) {
      console.log('[Sidebar] 正在重定向到登录页，跳过获取会话。')
      return
    }

    if (!session?.access_token) {
      if (!authLoading) {
        console.warn('[Sidebar] 无会话或访问令牌。无法获取会话。')
      }
      setConversations([])
      setIsLoading(false)
      return
    }

    console.log('[Sidebar] 携带令牌获取会话中...')
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/v1/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '无法解析错误响应体' }))
        if (response.status === 401) {
          setError('认证失败，请重新登录。')
          console.warn('[Sidebar] 获取会话时认证失败 (401)。正在登出并跳转到登录页...')
          setIsRedirecting(true)
          await signOut()
          router.push('/login')
          return
        }
        throw new Error(errorData.message || '获取会话失败')
      }
      const result: { status: string; data: ApiConversation[] } = await response.json()
      if (result.status === 'success' && Array.isArray(result.data)) {
        setConversations(result.data)
        console.log('[Sidebar] 会话获取成功:数量', result.data.length)
      } else {
        console.error('[Sidebar] 获取到的会话数据结构无效: ', result)
        throw new Error('获取到的会话数据结构无效')
      }
    } catch (err: any) {
      if (!isRedirecting) {
        if (err.message.includes('获取会话失败') && error === '认证失败，请重新登录。') {
          // Don't overwrite specific auth error already set by 401 handling
        } else {
          setError(err.message)
          console.error("[Sidebar] 获取会话时发生错误:", err)
        }
      }
    } finally {
      if (!isRedirecting) {
        setIsLoading(false)
      }
    }
  }, [session, authLoading, signOut, router, error, isRedirecting])

  useEffect(() => {
    if (!authLoading && session && !isRedirecting) {
      fetchConversations()
    } else if (!authLoading && !session) {
      setConversations([])
      setIsLoading(false)
    }

    const unsubscribe = on('conversationsUpdated', () => {
      console.log('[Sidebar] 收到 conversationsUpdated 事件，重新获取...')
      if (!authLoading && session && !isRedirecting) {
        fetchConversations(true)
      }
    })

    return () => {
      console.log('[Sidebar] 取消订阅 conversationsUpdated 事件。')
      unsubscribe()
    }
  }, [session, authLoading, fetchConversations, isRedirecting])

  const handleMouseEnterProfile = () => {
    if (cardTimeoutRef.current) {
      clearTimeout(cardTimeoutRef.current)
      cardTimeoutRef.current = null
    }
    setShowProfileCard(true)
  }

  const handleMouseLeaveProfileArea = () => {
    // Delay hiding to allow mouse to move to the card
    cardTimeoutRef.current = setTimeout(() => {
      setShowProfileCard(false)
    }, 200) // 200ms delay, adjust as needed
  }

  const handleCardMouseEnter = () => {
    if (cardTimeoutRef.current) {
      clearTimeout(cardTimeoutRef.current)
      cardTimeoutRef.current = null
    }
  }

  const handleCardMouseLeave = () => {
    setShowProfileCard(false)
  }

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (cardTimeoutRef.current) {
        clearTimeout(cardTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* 新对话按钮 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-70"
          disabled={authLoading || !session}
        >
          新对话
        </button>
      </div>
      
      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">加载会话列表中...</div>
        )}
        {!isLoading && error && (
          <div className="p-4 text-center text-red-500 dark:text-red-400">错误: {error}</div>
        )}
        {!isLoading && !error && !authLoading && session && conversations.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            没有历史会话
          </div>
        )}
        {!authLoading && !session && !error && !isLoading && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            请先登录以查看会话。
          </div>
        )}
        {!isLoading && !error && conversations.length > 0 ? (
          <ul className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  className="block p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={conversation.title}
                >
                  <div className="truncate font-medium text-sm text-gray-800 dark:text-gray-200">{conversation.title || '未命名会话'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(conversation.updatedAt).toLocaleString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      
      {/* 用户资料 */}
      <div 
        ref={profileAreaRef}
        className="border-t border-gray-200 dark:border-gray-700 p-3 mt-auto relative" 
        onMouseEnter={handleMouseEnterProfile}
        onMouseLeave={handleMouseLeaveProfileArea}
      >
        {authLoading ? (
          <div className="flex items-center p-2 rounded-md text-gray-500 dark:text-gray-400">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 animate-pulse">👤</div>
            <div className="text-sm">用户加载中...</div>
          </div>
        ) : user && session ? (
          <Link href="/profile" className="flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-md transition-colors">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3 text-gray-700 dark:text-gray-300 font-semibold">
              {user.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="flex-grow truncate">
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{user.email}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">查看资料</div>
            </div>
          </Link>
        ) : (
          <div className="flex items-center p-2 rounded-md text-gray-500 dark:text-gray-400">
             <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">👤</div>
             <div className="text-sm">未登录</div>
          </div>
        )}
        {showProfileCard && user && session && (
          <div onMouseEnter={handleCardMouseEnter} onMouseLeave={handleCardMouseLeave}>
            <ProfileCard onClose={() => setShowProfileCard(false)} />
          </div>
        )}
      </div>
    </div>
  )
} 