// types/conversation.ts
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface MessageSendConfig {
  type: 'main' | 'highlight';
  chunkId: string;
  highlightText?: string;
}