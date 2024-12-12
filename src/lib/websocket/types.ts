export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationData {
  id: string;
  type: 'main' | 'chunk';
  chunkId?: string;
  highlightText?: string;
  messages: Message[];
}

export interface ConversationResponse {
  conversation_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
  }>;
}

export interface ChunkConversationsResponse {
  conversations: Record<string, {
    chunk_id: string;
    highlight_text: string;
  }>;
}

export interface MessageSendCompleted {
  message: string;
}

export interface MessageSendError {
  message: string;
}

export interface ConversationCreateCompleted {
  conversation_id: string;
}

export interface ConversationCreateError {
  message: string;
}

export type MessageHandler<T = unknown> = (data: T) => void;

export interface WebSocketError {
  message: string;
}

export interface ConversationMessageSendCompleted {
  message: string;
}

export interface ConversationMessagesCompleted {
  conversation_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    message: string;
    created_at: string;
  }>;
}

export interface ConversationChunkGetCompleted {
  conversations: Record<string, {
    chunk_id: string;
    highlight_text: string;
  }>;
} 