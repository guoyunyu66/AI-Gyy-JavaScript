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
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-4 pr-16 dark:bg-gray-800"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="absolute right-2 top-2 rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:opacity-50"
        disabled={isLoading || !message.trim()}
      >
        发送
      </button>
    </form>
  )
} 