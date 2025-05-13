'use client' // Add the directive to make this a Client Component

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { User } from '@supabase/supabase-js' // Import User type

export function ProfileView() {
  const { user, loading: authLoading, session } = useAuth()
  // State for profile data, potentially fetched if different from auth context user
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Option 1: Use user directly from auth context
    if (!authLoading) {
      if (user) {
        setProfileUser(user)
        setLoading(false)
      } else {
        setError('用户未登录或无法加载用户信息。')
        setLoading(false)
      }
    }
    // Option 2: Fetch from /api/v1/auth/session if needed (example below)
    /*
    const fetchProfile = async () => {
      if (session?.access_token) {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/v1/auth/session', { // Use correct API path
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          if (!response.ok) throw new Error('获取用户信息失败');
          const result = await response.json();
          if (result.status === 'success' && result.data?.user) {
            setProfileUser(result.data.user);
          } else {
            throw new Error(result.message || '无法解析用户信息');
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        setError('用户未登录');
        setLoading(false);
      }
    };
    fetchProfile();
    */
  }, [user, authLoading, session]) // Add dependencies

  if (loading || authLoading) {
    return <div className="container mx-auto py-8 px-4 text-center">加载中...</div>
  }

  if (error) {
    return <div className="container mx-auto py-8 px-4 text-center text-red-500">错误: {error}</div>
  }

  if (!profileUser) {
     return <div className="container mx-auto py-8 px-4 text-center">无法加载用户数据。</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
              {/* Display initials */} 
              {profileUser.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div>
              {/* Display email for now, replace with username if available */}
              <h2 className="text-xl font-semibold">{profileUser.email}</h2> 
              {/* Maybe display other info like join date? */} 
              {profileUser.created_at && 
                <p className="text-gray-500 dark:text-gray-400">
                  加入时间: {new Date(profileUser.created_at).toLocaleDateString()}
                </p>
              }
            </div>
          </div>

          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            用户资料表单（如修改密码、用户名等）将在这里实现
          </div>
        </div>
      </div>
    </div>
  )
} 