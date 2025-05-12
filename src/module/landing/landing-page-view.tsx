import Link from 'next/link'
import { Button } from '@/components/ui/button'
import React from 'react'

export function LandingPageView() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header占位 */}
      <header className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-xl font-bold">
          AIGyy
        </Link>
        <nav>
          <Button asChild variant="ghost">
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild className="ml-2">
            <Link href="/register">注册</Link>
          </Button>
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
            <Button size="lg" asChild>
              <Link href="/chat">开始使用</Link>
            </Button>
          </div>
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