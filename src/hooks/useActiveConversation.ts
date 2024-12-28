import { ActiveConversationType } from '@/components/conversation/types';

export type RawChunkConversation = {
  id: string;
  highlightText: string;
  chunkId: string;
};

/**
 * Hook to compute active conversation details based on ID
 * @param activeConversationId - Current active conversation ID
 * @param mainConversationId - ID of the main conversation
 * @param chunkConversations - Array of chunk conversations
 * @returns Active conversation object
 */
export function useActiveConversation(
  activeConversationId: string | null,
  mainConversationId: string | null,
  chunkConversations: RawChunkConversation[]
): ActiveConversationType | null {
  if (!mainConversationId) {
    return null;
  }

  if (activeConversationId === mainConversationId) {
    return { type: 'main', id: mainConversationId };
  }

  const chunkConv = chunkConversations.find(conv => conv.id === activeConversationId);
  if (chunkConv) {
    return {
      type: 'chunk',
      id: chunkConv.id,
      highlightText: chunkConv.highlightText,
      chunkId: chunkConv.chunkId
    };
  }

  return null;
}