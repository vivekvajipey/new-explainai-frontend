// src/stores/conversationStore.ts
import { create } from 'zustand';
import { Message } from '@/lib/websocket/types';

interface ConversationStoreState {
  conversations: Map<string, {
    id: string;
    type: 'main' | 'chunk';
    chunkId?: string;
    highlightText?: string;
    messages: Map<string, Message>;
  }>;
  
  // Actions for message management
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  
  // Actions for conversation management
  addConversation: (conversation: {
    id: string;
    type: 'main' | 'chunk';
    chunkId?: string;
    highlightText?: string;
  }) => void;
  
  // Selectors
  getMessages: (conversationId: string) => Message[];
  getConversation: (conversationId: string) => {
    messages: Message[];
    type: 'main' | 'chunk';
    chunkId?: string;
    highlightText?: string;
  } | null;
}

export const useConversationStore = create<ConversationStoreState>((set, get) => ({
  conversations: new Map(),

  addMessage: (conversationId, message) => set(state => {
    const conversation = state.conversations.get(conversationId);
    if (!conversation) return state; // No change if conversation doesn't exist

    const newConversations = new Map(state.conversations);
    const updatedMessages = new Map(conversation.messages);
    updatedMessages.set(message.id, message);
    
    newConversations.set(conversationId, {
      ...conversation,
      messages: updatedMessages
    });

    return { conversations: newConversations };
  }),

  setMessages: (conversationId, messages) => set(state => {
    const conversation = state.conversations.get(conversationId);
    if (!conversation) return state;

    const newConversations = new Map(state.conversations);
    const messagesMap = new Map(messages.map(msg => [msg.id, msg]));
    
    newConversations.set(conversationId, {
      ...conversation,
      messages: messagesMap
    });

    return { conversations: newConversations };
  }),

  removeMessage: (conversationId, messageId) => set(state => {
    const conversation = state.conversations.get(conversationId);
    if (!conversation) return state;

    const newConversations = new Map(state.conversations);
    const updatedMessages = new Map(conversation.messages);
    updatedMessages.delete(messageId);
    
    newConversations.set(conversationId, {
      ...conversation,
      messages: updatedMessages
    });

    return { conversations: newConversations };
  }),

  addConversation: (conversation) => set(state => {
    const newConversations = new Map(state.conversations);
    newConversations.set(conversation.id, {
      ...conversation,
      messages: new Map()
    });
    console.log('STEP 2: [useConversationStore] Conversation added to store:', conversation.id);
    return { conversations: newConversations };
  }),

  getMessages: (conversationId) => {
    const conversation = get().conversations.get(conversationId);
    return conversation 
      ? Array.from(conversation.messages.values()).sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      : [];
  },

  getConversation: (conversationId) => {
    const conversation = get().conversations.get(conversationId);
    if (!conversation) return null;
    
    return {
      ...conversation,
      messages: Array.from(conversation.messages.values()).sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    };
  }
}));