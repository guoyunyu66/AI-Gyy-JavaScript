'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/module/sidebar/sidebar'
import type { Conversation } from '@/types'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationsError, setConversationsError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
  }, [session, authLoading, router])

  useEffect(() => {
    const fetchConversations = async () => {
      if (session?.access_token) {
        setConversationsLoading(true)
        setConversationsError(null)
        try {
          const response = await fetch('/api/conversations', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          })
          if (!response.ok) {
            if (response.status === 401) {
              console.warn('[DashboardLayout] Received 401 from /api/conversations, redirecting to login.')
              router.push('/login')
              return
            }
            const errorData = await response.json()
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
          }
          const result = await response.json()
          if (result.status === 'success' && Array.isArray(result.data)) {
            const transformedData: Conversation[] = result.data.map((conv: any) => ({
              id: conv.id,
              title: conv.title,
              updatedAt: new Date(conv.updatedAt),
            }))
            setConversations(transformedData)
          } else {
            throw new Error('Failed to fetch conversations or invalid data format')
          }
        } catch (error: any) {
          console.error("Failed to fetch conversations:", error)
          setConversationsError(error.message || 'An unknown error occurred')
        }
        setConversationsLoading(false)
      }
    }

    if (session) {
      fetchConversations()
    } else {
      setConversations([])
      setConversationsLoading(false)
    }
  }, [session, router]) // Added router dependency because it's used inside the effect

  if (authLoading || conversationsLoading) {
    return <div>加载中...</div>
  }

  if (!session) {
    return null
  }

  const handleNewChat = () => {
    router.push('/chat')
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 fixed h-full">
        <Sidebar conversations={conversations} onNewChat={handleNewChat} />
        {conversationsError && <div className="p-2 text-red-500 text-xs">加载会话失败: {conversationsError}</div>}
      </div>
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
} 