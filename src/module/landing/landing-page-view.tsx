'use client'; // <--- 确保是客户端组件，因为它要用 hooks

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { emit } from '@/lib/event-emitter' // For sidebar refresh

export function LandingPageView() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartNewChat = async () => {
    if (authLoading) return // Don't do anything if auth state is still loading

    if (!session) {
      router.push('/login?next=/') // Redirect to login, then back to landing if successful
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      // 假设我们有一个新的API端点来创建并返回一个空会话的ID
      const response = await fetch('/api/v1/chat/conversations', { // <--- 修改路径
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ model: "gpt-4o" }), // <--- 发送默认model，确保后端能正确处理
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '创建新对话失败')
      }

      const result: { status: string; data?: { id: string; [key: string]: any } } = await response.json()

      if (result.status === 'success' && result.data?.id) {
        emit('conversationsUpdated') // 通知侧边栏刷新
        router.push(`/chat/${result.data.id}`)
      } else {
        throw new Error('未能从服务器获取有效的会话ID')
      }
    } catch (err: any) {
      console.error('Error starting new chat:', err)
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header占位 */}
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold">
          AIGyy
        </Link>
        <nav>
          {session ? (
            <Button variant="ghost" onClick={() => router.push('/chat')}> {/* 通常应该有个最新的或默认的 */}
              进入应用
            </Button>
            // 或者显示用户名和登出按钮
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">登录</Link>
              </Button>
              <Button asChild className="ml-2">
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center md:px-6 md:py-32">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            与未来对话，即刻开始
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-lg text-gray-500 dark:text-gray-400 md:text-xl">
            AIGyy 是一款现代化的智能对话助手，采用尖端技术，为您带来前所未有的流畅交互体验。
          </p>
          <div className="mt-10">
            <Button size="lg" onClick={handleStartNewChat} disabled={isCreating || authLoading}>
              {isCreating ? '创建中...' : '开始使用'}
            </Button>
          </div>
          {error && <p className="mt-4 text-red-500">错误: {error}</p>}
        </section>

        {/* Feature Section (可选) */}
        {/* 可以添加更多介绍功能的区域 */}
      </main>

      {/* Footer占位 */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 md:px-6">
          © {new Date().getFullYear()} AIGyy. 保留所有权利。
        </div>
      </footer>
    </div>
  )
} 