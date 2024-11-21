'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { DocumentState, ChunkConversation, Message } from '@/interfaces/document';
import { api } from '@/lib/api';

const initialState: DocumentState = {
  documentId: '',
  chunks: new Map(),
  activeChunkId: null,
  mainConversation: null,
  activeChunkConversations: new Map(),
};

type Action =
  | { type: 'SET_DOCUMENT_ID'; payload: string }
  | { type: 'SET_CHUNKS'; payload: Map<string, any> }
  | { type: 'SET_ACTIVE_CHUNK'; payload: string }
  | { type: 'SET_MAIN_CONVERSATION'; payload: any }
  | { type: 'ADD_CHUNK_CONVERSATION'; payload: { chunkId: string; conversation: ChunkConversation } }
  | { type: 'TOGGLE_CONVERSATION'; payload: { chunkId: string; conversationId: string } }
  | { type: 'UPDATE_CONVERSATION_POSITION'; payload: { chunkId: string; conversationId: string; position: { x: number; y: number } } }
  | { type: 'ADD_MESSAGE'; payload: { conversationId: string; message: Message } };

function documentReducer(state: DocumentState, action: Action): DocumentState {
  switch (action.type) {
    case 'SET_DOCUMENT_ID':
      if (state.documentId === action.payload) {
        return state;
      }
      return { ...state, documentId: action.payload };
    
    case 'SET_CHUNKS':
      if (state.chunks === action.payload) {
        return state;
      }
      return { ...state, chunks: action.payload };
    
    case 'SET_ACTIVE_CHUNK':
      if (state.activeChunkId === action.payload) {
        return state;
      }
      return { ...state, activeChunkId: action.payload };
    
    case 'SET_MAIN_CONVERSATION':
      if (state.mainConversation?.id === action.payload?.id) {
        return state;
      }
      return { ...state, mainConversation: action.payload };
    
    case 'ADD_CHUNK_CONVERSATION': {
      const { chunkId, conversation } = action.payload;
      const currentChunkState = state.chunks.get(chunkId);
      if (!currentChunkState) return state;

      const updatedChunkState = {
        ...currentChunkState,
        conversations: [...currentChunkState.conversations, { ...conversation, position: { x: 0, y: 0 } }]
      };

      const newChunks = new Map(state.chunks);
      newChunks.set(chunkId, updatedChunkState);

      return {
        ...state,
        chunks: newChunks,
        activeChunkConversations: new Map(state.activeChunkConversations).set(
          chunkId,
          updatedChunkState.conversations
        )
      };
    }

    case 'TOGGLE_CONVERSATION': {
      const { chunkId, conversationId } = action.payload;
      const currentChunkState = state.chunks.get(chunkId);
      if (!currentChunkState) return state;

      const updatedConversations = currentChunkState.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, isOpen: !conv.isOpen } : { ...conv }
      );

      const updatedChunkState = {
        ...currentChunkState,
        conversations: updatedConversations
      };

      const newChunks = new Map(state.chunks);
      newChunks.set(chunkId, updatedChunkState);

      return {
        ...state,
        chunks: newChunks,
        activeChunkConversations: new Map(state.activeChunkConversations).set(
          chunkId,
          updatedConversations
        )
      };
    }

    case 'UPDATE_CONVERSATION_POSITION': {
      const { chunkId, conversationId, position } = action.payload;
      const currentChunkState = state.chunks.get(chunkId);
      if (!currentChunkState) return state;

      const updatedConversations = currentChunkState.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, position } : conv
      );

      const updatedChunkState = {
        ...currentChunkState,
        conversations: updatedConversations
      };

      const newChunks = new Map(state.chunks);
      newChunks.set(chunkId, updatedChunkState);

      return {
        ...state,
        chunks: newChunks,
        activeChunkConversations: new Map(state.activeChunkConversations).set(
          chunkId,
          updatedConversations
        )
      };
    }

    case 'ADD_MESSAGE': {
      const { conversationId, message } = action.payload;
      const updatedChunks = new Map(state.chunks);
      
      // Update message in chunk conversations
      for (const [chunkId, chunkState] of updatedChunks.entries()) {
        const updatedConversations = chunkState.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, message]
            };
          }
          return conv;
        });
        
        if (updatedConversations !== chunkState.conversations) {
          updatedChunks.set(chunkId, {
            ...chunkState,
            conversations: updatedConversations
          });
        }
      }

      // Update message in main conversation if it exists
      if (state.mainConversation?.id === conversationId) {
        return {
          ...state,
          chunks: updatedChunks,
          mainConversation: {
            ...state.mainConversation,
            messages: [...state.mainConversation.messages, message]
          }
        };
      }

      return {
        ...state,
        chunks: updatedChunks
      };
    }

    default:
      return state;
  }
}

type DocumentContextValue = {
  state: DocumentState;
  dispatch: React.Dispatch<Action>;
  createChunkConversation: (chunkId: string, highlightRange: [number, number], highlightedText: string) => Promise<any>;
  toggleConversation: (chunkId: string, conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  setActiveChunk: (chunkId: string) => void;
  updateConversationPosition: (chunkId: string, conversationId: string, position: { x: number; y: number }) => void;
};

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function DocumentProvider({ children, documentId }: { children: ReactNode; documentId: string }) {
  const [state, dispatch] = useReducer(documentReducer, {
    ...initialState,
    documentId
  });

  const createChunkConversation = async (
    chunkId: string, 
    highlightRange: [number, number],
    highlightedText: string
  ) => {
    try {
      const conversation = await api.createConversation(
        state.documentId, 
        'chunk', 
        chunkId, 
        highlightRange,
        highlightedText
      );
      
      const chunkConversation: ChunkConversation = {
        ...conversation,
        isOpen: true,
        position: { x: 0, y: 0 },
        highlightRange,
        highlightedText,
        messages: []
      };
      
      dispatch({ 
        type: 'ADD_CHUNK_CONVERSATION', 
        payload: { chunkId, conversation: chunkConversation }
      });
      
      return conversation;
    } catch (error) {
      console.error('Error creating chunk conversation:', error);
      throw error;
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      // Create and dispatch user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: 'user',
        timestamp: new Date().toISOString()
      };
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { conversationId, message: userMessage }
      });

      // Send to API and dispatch response
      const response = await api.sendMessage(conversationId, content);
      const assistantMessage: Message = {
        id: response.id,
        content: response.content,
        role: 'assistant',
        timestamp: response.created_at
      };
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { conversationId, message: assistantMessage }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally dispatch an error message
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          conversationId,
          message: {
            id: crypto.randomUUID(),
            content: 'Failed to send message. Please try again.',
            role: 'assistant',
            timestamp: new Date().toISOString()
          }
        }
      });
    }
  };

  const toggleConversation = (chunkId: string, conversationId: string) => {
    dispatch({ 
      type: 'TOGGLE_CONVERSATION', 
      payload: { chunkId, conversationId }
    });
  };

  const setActiveChunk = (chunkId: string) => {
    dispatch({ type: 'SET_ACTIVE_CHUNK', payload: chunkId });
  };

  const updateConversationPosition = (
    chunkId: string,
    conversationId: string,
    position: { x: number; y: number }
  ) => {
    dispatch({
      type: 'UPDATE_CONVERSATION_POSITION',
      payload: { chunkId, conversationId, position }
    });
  };

  return (
    <DocumentContext.Provider
      value={{
        state,
        dispatch,
        createChunkConversation,
        toggleConversation,
        sendMessage,
        setActiveChunk,
        updateConversationPosition
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}