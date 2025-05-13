'use client';

import React, { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
}

export function ChatInput({ onSend, isLoading = false }: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSend(message)
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-4 pr-16 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150 ease-in-out"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-500 p-2.5 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
        disabled={isLoading || !message.trim()}
      >
        发送
      </button>
    </form>
  )
} 