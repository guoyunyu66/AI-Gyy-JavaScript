import React from 'react'
import { ChatSessionView } from '@/module/chat/chat-session-view'

interface ChatPageProps {
  params: {
    id: string // Although typed as string, Next.js provides it async
  }
}

// This page now extracts the ID and passes it to the view component.
// Data fetching and display logic are handled within ChatSessionView.
// Make the component async to await params
export default async function SpecificChatPage({ params }: ChatPageProps) {
  // Await params even if the type doesn't explicitly show Promise here
  // as per Next.js requirements for dynamic server components
  const { id } = params // No explicit await needed if component is async, Next.js handles it

  return <ChatSessionView id={id} />
} 