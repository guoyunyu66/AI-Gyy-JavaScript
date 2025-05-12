'use client'

import React from 'react'
import Link from 'next/link'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuth } from '@/contexts/auth-context'

export function LoginForm() {
  const { supabase } = useAuth()

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">登录</h1>
        <p className="text-gray-500 dark:text-gray-400">
          使用您的账户登录 AIGyy
        </p>
      </div>

      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']} // 可选：添加社交登录，需在Supabase后台配置
        redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`} // 重要：OAuth回调地址
        onlyThirdPartyProviders={false} // 显示邮箱/密码登录
        view="sign_in"
      />

      <div className="text-center text-sm">
        还没有账户?{' '}
        <Link href="/register" className="text-blue-500 hover:underline">
          注册
        </Link>
      </div>
    </div>
  )
} 