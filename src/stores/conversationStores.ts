// src/stores/conversationStore.ts
import { create } from 'zustand';
import { Message } from '@/lib/websocket/types';

const EMPTY_ARRAY: Message[] = [];
const sortedMessagesCache = new WeakMap<Map<string, Message>, Message[]>();

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
    console.log("[DEBUG] store.addMessage called with", { conversationId, message });
    const conversation = state.conversations.get(conversationId);
    if (!conversation) return state; // No change if conversation doesn't exist
  
    const updatedMessages = new Map(conversation.messages);
  
    // 1) Check for an existing message with the same ID
    if (updatedMessages.has(message.id)) {
      console.log("[DEBUG] Duplicate message prevented. Already have message with id=", message.id);
      return state;
    }
  
    // Optionally, also guard if the content & role are exactly the same as an existing message.
    // But ID alone usually suffices, as long as it’s stable.
    
    updatedMessages.set(message.id, message);
  
    const newConversations = new Map(state.conversations);
    newConversations.set(conversationId, {
      ...conversation,
      messages: updatedMessages
    });
  
    return { conversations: newConversations };
  }),

  setMessages: (conversationId, messages) => set(state => {
    console.log("[DEBUG] store.setMessages called with", { conversationId, messages });
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
    console.log("[DEBUG] store.removeMessage called with", { conversationId, messageId });
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
    console.log("[DEBUG] store.addConversation called with", conversation);
    const newConversations = new Map(state.conversations);
    newConversations.set(conversation.id, {
      ...conversation,
      messages: new Map()
    });
    console.log('STEP 3: [useConversationStore] Conversation added to store:', conversation.id);
    return { conversations: newConversations };
  }),

  getMessages: (conversationId) => {
    const conversation = get().conversations.get(conversationId);
    if (!conversation || conversation.messages.size === 0) {
      console.log("[DEBUG] store.getMessages returning the same empty array reference");
      return EMPTY_ARRAY;
    }

    // Check cache first
    if (sortedMessagesCache.has(conversation.messages)) {
      const cachedArray = sortedMessagesCache.get(conversation.messages);
      console.log("[DEBUG] returning cached array reference. messageCount =", cachedArray!.length);
      return cachedArray!;
    }

    // If not cached, create new sorted array
    const messagesArray = Array.from(conversation.messages.values()).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    console.log("[DEBUG] store.getMessages called. conversationId =", conversationId, "messagesCount =", messagesArray.length);
    console.log("[DEBUG] store.getMessages returning array object:", messagesArray);

    // Cache the sorted array
    sortedMessagesCache.set(conversation.messages, messagesArray);

    return messagesArray;
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