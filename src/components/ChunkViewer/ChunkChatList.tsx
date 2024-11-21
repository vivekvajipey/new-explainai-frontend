'use client';

import { useDocument } from '@/context/DocumentContext';
import ChunkChatWindow from './ChunkChatWindow';

export default function ChunkChatList({ chunkId }: { chunkId: string }) {
  const { state, toggleConversation } = useDocument();
  const conversations = state.activeChunkConversations.get(chunkId) || [];

  return (
    <>
      {conversations.map((conversation) => (
        conversation.isOpen && (
          <ChunkChatWindow
            key={conversation.id}
            chunkId={chunkId}
            conversation={conversation}
            onClose={() => toggleConversation(chunkId, conversation.id)}
          />
        )
      ))}
    </>
  );
}