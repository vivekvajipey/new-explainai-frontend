import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';

interface MainConversationProps {
  documentId: string;
  conversationId: string;
  currentChunkId: string;
  websocket: ConversationWebSocket;
}

export default function MainConversation({ 
  documentId,
  conversationId,
  currentChunkId,
  websocket 
}: MainConversationProps) {
  const handleInitialize = async () => {
    return conversationId;
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    return ws.sendMessage(conversationId, content, currentChunkId, "main");
  };

  return (
    <BaseConversation
      documentId={documentId}
      websocket={websocket}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
} 