// interfaces/types.ts
export interface Chunk {
  id: string;
  sequence: number;
  content: string;
  meta_data: {
    length: number;
    index: number;
  };
}

export interface Conversation {
  id: string;
  document_id: string;
  chunk_id?: string;
  created_at: string;
  meta_data: {
    type: 'main' | 'chunk';
    highlight_range?: [number, number];
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface ChatResponse {
  id: string;
  conversation_id: string;
  content: string;
  role: 'assistant';
  created_at: string;
}