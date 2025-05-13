// src/module/chat/types.ts

export interface Message {
  id?: string; // Can be useful for keys or if backend assigns unique IDs to messages
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
} 