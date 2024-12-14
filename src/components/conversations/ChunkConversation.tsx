// ChunkConversation.tsx
import BaseConversation from './BaseConversation';
import { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
  highlightText: string;
}

export default function ChunkConversation({ 
  documentId, 
  chunkId,
  highlightText,
}: ChunkConversationProps) {
  const { conversationSocket } = useSocket();
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const handleInitialize = async () => {
    if (!conversationSocket) {
      throw new Error('WebSocket not connected');
    }

    const newConversationId = await conversationSocket.createChunkConversation(
      chunkId, 
      highlightText
    );
    setConversationId(newConversationId);
    return newConversationId;
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationSocket || !conversationId) {
      throw new Error('No active conversation');
    }
  
    const response = await conversationSocket.sendMessage(
      conversationId, 
      content, 
      chunkId, 
      "highlight"
    );
  
    return { message: response.message };
  };

  return (
    <BaseConversation
      documentId={documentId}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about this highlighted text..."
      className="border-2 border-yellow-200"
    />
  );
}