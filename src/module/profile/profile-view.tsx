import React from 'react'

export function ProfileView() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-semibold">用户名</h2>
              <p className="text-gray-500 dark:text-gray-400">user@example.com</p>
            </div>
          </div>

          <div className="border border-dashed border-gray-300 p-8 rounded-md text-center">
            用户资料表单将在这里实现 (ProfileView)
          </div>
        </div>
      </div>
    </div>
  )
} 