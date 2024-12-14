// MainConversation.tsx
import BaseConversation from './BaseConversation';
import { useSocket } from '@/contexts/SocketContext';

interface MainConversationProps {
  documentId: string;
  conversationId: string;
  currentChunkId: string;
}

export default function MainConversation({ 
  documentId,
  conversationId,
  currentChunkId,
}: MainConversationProps) {
  const { conversationSocket } = useSocket();

  const handleInitialize = async () => {
    return conversationId;
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationSocket) {
      throw new Error('WebSocket not connected');
    }

    const response = await conversationSocket.sendMessage(
      conversationId, 
      content, 
      currentChunkId, 
      "main"
    );
  
    return { message: response.message };
  };

  return (
    <BaseConversation
      documentId={documentId}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
}