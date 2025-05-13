'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface ProfileCardProps {
  onClose?: () => void; // Optional: Callback to close the card, e.g., on mouse leave
}

export function ProfileCard({ onClose }: ProfileCardProps) {
  const { user, signOut, session } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (!session) {
      // Already signed out or session invalid, redirect
      router.push('/login');
      return;
    }
    try {
      // 1. Inform the backend (optional, but good for logging or server-side cleanup if any)
      const backendLogoutResponse = await fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!backendLogoutResponse.ok) {
        console.warn('Backend logout request failed, proceeding with client-side signOut.');
        // Optionally show an error, but still proceed with client-side signOut
      }

      // 2. Perform client-side Supabase signOut (this is the crucial part for clearing auth state)
      const { error } = await signOut(); // signOut from useAuth context

      if (error) {
        console.error('Error signing out from Supabase:', error.message);
        // Display error to user if needed
        alert(`登出失败: ${error.message}`);
      } else {
        console.log('Successfully signed out from Supabase.');
        // 3. Redirect to login page or home page
        router.push('/login'); 
      }
    } catch (error: any) {
      console.error('Error during logout process:', error.message);
      alert(`登出过程中发生错误: ${error.message}`);
    }
    if (onClose) onClose(); // Close card after action
  };

  if (!user) {
    return null; // Or a placeholder if the card is always rendered but content changes
  }

  return (
    <div className="absolute bottom-full mb-2 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3 text-gray-700 dark:text-gray-300 font-semibold">
          {user.email?.charAt(0).toUpperCase() || '👤'}
        </div>
        <div className="flex-grow truncate">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user.email}>
            {user.email}
          </p>
          {/* <p className="text-xs text-gray-500 dark:text-gray-400">在线</p> */}
        </div>
      </div>
      <button
        onClick={() => { router.push('/profile'); if (onClose) onClose(); }}
        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors mb-1"
      >
        查看资料
      </button>
      <button
        onClick={handleLogout}
        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-700 dark:hover:text-white rounded-md transition-colors"
      >
        退出登录
      </button>
    </div>
  );
} 