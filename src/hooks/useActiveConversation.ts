import { useState } from 'react';
import { ActiveConversationType } from '@/components/conversation/types';

export type RawChunkConversation = {
  id: string;
  highlightText: string;
  chunkId: string;
};

/**
 * Hook to manage the active conversation state and logic
 * @param mainConversationId - ID of the main conversation
 * @param chunkConversations - Array of chunk conversations
 * @returns Object containing active conversation state and setter
 */
export function useActiveConversation(
  mainConversationId: string | null,
  chunkConversations: RawChunkConversation[]
) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    mainConversationId ?? null
  );

  // Compute current active conversation
  const activeConversation: ActiveConversationType | null = mainConversationId ? (
    activeConversationId === mainConversationId 
      ? { type: 'main', id: mainConversationId }
      : (() => {
          const chunkConv = chunkConversations.find(conv => conv.id === activeConversationId);
          return chunkConv
            ? {
                type: 'chunk',
                id: chunkConv.id,
                highlightText: chunkConv.highlightText,
                chunkId: chunkConv.chunkId
              }
            : null;
        })()
  ) : null;

  return {
    activeConversationId,
    activeConversation,
    setActiveConversationId,
  };
}
