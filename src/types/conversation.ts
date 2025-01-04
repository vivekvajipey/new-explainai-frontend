// types/conversation.ts
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface StreamingState {
  id: string | null;
  isStreaming: boolean;
  content: string;  // renamed from partialMessage for consistency
}

export interface MessageSendConfig {
  type: 'main' | 'highlight';
  chunkId: string;
  highlightText?: string;
  questionId?: string;
}

export interface Question {
  id: string;
  content: string;
  answered: boolean;
  created_at: string;
  meta_data?: {
    chunk_id?: string;
  };
}

export interface RegenerateQuestionsResponse {
  conversation_id: string;
  questions: Question[];
  request_id?: string;
}