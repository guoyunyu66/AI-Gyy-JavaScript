'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  session: Session | null
  user: User | null
  supabase: SupabaseClient
  loading: boolean
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 尝试获取初始 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[AuthContext] onAuthStateChange event:', _event);
        console.log('[AuthContext] onAuthStateChange session:', session);
        if (_event === 'SIGNED_IN') {
          console.log('[AuthContext] User signed in. Session user:', session?.user);
        }
        if (_event === 'USER_UPDATED') {
          console.log('[AuthContext] User updated. Session user:', session?.user);
        }
        if (_event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out.');
        }
        if (_event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Token refreshed.');
        }
        if ((_event as string) === 'USER_DELETED') {
          console.log('[AuthContext] User deleted.');
        }
        // Check for errors that might be passed in the session object itself, though usually errors come through callbacks or redirects
        if (session?.user && (session.user as any).error) {
          console.error('[AuthContext] Error in session user object:', (session.user as any).error);
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // 清理监听器
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  // Define signOut function
  const signOut = useCallback(async () => {
    setLoading(true); // Optionally set loading true during sign out
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
    }
    // setLoading(false); // Loading will be set by onAuthStateChange anyway
    return { error };
  }, []);

  const value = {
    session,
    user,
    supabase,
    loading,
    signOut, // Added signOut to context value
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 