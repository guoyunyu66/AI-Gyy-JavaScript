'use client'

import React from 'react'
import Link from 'next/link'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useAuth } from '@/contexts/auth-context'

export function RegisterForm() {
  const { supabase } = useAuth()

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">注册</h1>
        <p className="text-gray-500 dark:text-gray-400">
          创建一个账户以开始使用AIGyy
        </p>
      </div>

      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']} // 保持一致
        redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`}
        onlyThirdPartyProviders={false}
        view="sign_up"
      />

      <div className="text-center text-sm">
        已有账户?{' '}
        <Link href="/login" className="text-blue-500 hover:underline">
          登录
        </Link>
      </div>
    </div>
  )
} 