import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';

interface ChunkConversationProps {
  documentId: string;
  sequence: string;  // The chunk sequence number (e.g., "0", "1", "2")
  highlightText: string;
}

export default function ChunkConversation({ 
  documentId, 
  sequence,
  highlightText 
}: ChunkConversationProps) {
  const handleInitialize = async (ws: ConversationWebSocket) => {
    const response = await ws.createChunkConversation(sequence, highlightText);
    return response;
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    await ws.sendMessage(content, sequence);
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