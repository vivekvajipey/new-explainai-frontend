import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
  highlightText: string;
}

export default function ChunkConversation({ 
  documentId, 
  chunkId,
  highlightText 
}: ChunkConversationProps) {
  const handleInitialize = async (ws: ConversationWebSocket) => {
    const response = await ws.send('conversation.chunk.create', {
      document_id: documentId,
      chunk_id: chunkId,
      highlight_text: highlightText
    });
    return response.conversation_id;
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    await ws.sendMessage(content);
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