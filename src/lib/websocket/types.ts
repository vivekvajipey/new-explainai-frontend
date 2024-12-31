// new-explainai-frontend/src/lib/websocket/types.ts

import { MessageRole } from "@/types/conversation";

export interface Message {
  id: string;
  role: MessageRole;
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
  messages: {
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }[];
}

export interface ChunkConversationsResponse {
  conversations: Record<string, {
    chunk_id: string;
    highlight_text: string;
    highlight_range?: { start: number; end: number };
  }>;
}

export interface MessageSendError {
  message: string;
  request_id?: string;
}

export interface ConversationCreateCompleted {
  conversation_id: string;
  request_id?: string;
}

export interface ConversationCreateError {
  message: string;
  request_id?: string;
}

export type MessageHandler<T = unknown> = (data: T) => void;

export interface WebSocketError {
  message: string;
  request_id?: string;
  status?: number;
  data?: {
    error?: string;
    user_cost?: number;
    cost_limit?: number;
    message?: string;
    details?: unknown;
  };
}

export interface ConversationMessageSendCompleted {
  message: string;
  conversation_id: string;
  user_message_id: string;
  request_id?: string;
}

export interface ConversationMessagesCompleted {
  conversation_id: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
  }>;
  request_id?: string;
}

export interface ConversationChunkGetCompleted {
  conversations: Record<string, {
    chunk_id: string;
    highlight_text: string;
  }>;
  request_id?: string;
}

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  request_id?: string;
}

export interface StreamingMessageHandlers {
  onToken: (partialMessage: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface ChunkConversationPayload {
  document_id: string;
  chunk_id: string;
  highlight_text: string;
  highlight_range?: { start: number; end: number };
  request_id?: string;
}