import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';
import { useState } from 'react';

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
  highlightText: string;
  websocket: ConversationWebSocket | null;
}

export default function ChunkConversation({ 
  documentId, 
  chunkId,
  highlightText,
  websocket
}: ChunkConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const handleInitialize = async (ws: ConversationWebSocket) => {
    const newConversationId = await ws.createChunkConversation(chunkId, highlightText);
    setConversationId(newConversationId);
    return newConversationId;
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    await ws.sendMessage(conversationId!, content);
  };

  if (!websocket) {
    return <div>Loading...</div>;
  }

  return (
    <BaseConversation
      documentId={documentId}
      websocket={websocket}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about this highlighted text..."
      className="border-2 border-yellow-200"
    />
  );
} 