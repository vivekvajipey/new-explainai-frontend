export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Conversation {
  id: string;
  document_id: string;
  chunk_id?: string;
  created_at: string;
  messages: Message[];
  meta_data?: {
    type: 'main' | 'chunk';
    highlight_range?: [number, number];
  };
}

export interface Chunk {
  id: string;
  content: string;
  position: number;
}

export interface ChunkConversation extends Conversation {
  isOpen: boolean;
  position?: { x: number; y: number };
  highlightRange: [number, number];
}

export interface ChunkState {
  chunk: Chunk;
  conversations: ChunkConversation[];
}

export interface DocumentState {
  documentId: string;
  chunks: Map<string, ChunkState>;
  activeChunkId: string | null;
  mainConversation: any | null;
  activeChunkConversations: Map<string, ChunkConversation[]>;
}

export interface DocumentAction {
  type: string;
  payload: any;
}

export type DocumentDispatch = (action: DocumentAction) => void;

export interface DocumentContextType {
  state: DocumentState;
  createChunkConversation: (chunkId: string, highlightRange: [number, number]) => Promise<void>;
  toggleConversation: (chunkId: string, conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setActiveChunk: (chunkId: string) => void;
  updateConversationPosition: (chunkId: string, conversationId: string, position: { x: number; y: number }) => void;
  dispatch: DocumentDispatch;
}