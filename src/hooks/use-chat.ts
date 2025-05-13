import { useState, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  thinkingProcess?: string
}

interface UseChatOptions {
  initialMessages?: Message[]
  conversationId?: string
}

export function useChat({ initialMessages = [], conversationId }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    // 添加用户消息到状态
    const userMessage: Message = {
      role: 'user',
      content,
      id: Date.now().toString()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    try {
      // TODO: 实现API调用逻辑
      // 这里添加一个模拟的回复
      setTimeout(() => {
        const aiMessage: Message = {
          role: 'assistant',
          content: `这是对"${content}"的模拟回复`,
          id: (Date.now() + 1).toString()
        }
        
        setMessages(prev => [...prev, aiMessage])
        setIsLoading(false)
      }, 1000)
    } catch (err) {
      setError('发送消息失败')
      setIsLoading(false)
    }
  }, [])
  
  return {
    messages,
    isLoading,
    error,
    sendMessage
  }
} 