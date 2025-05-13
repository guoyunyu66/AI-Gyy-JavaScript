'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/module/sidebar/sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, session, loading: authLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
  }, [session, authLoading, router])

  const handleNewChat = () => {
    router.push('/chat')
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p>加载认证信息中...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg">
        <Sidebar 
          onNewChat={handleNewChat} 
        />
      </div>
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
} 