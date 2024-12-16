// MainConversation.tsx
import BaseConversation from './BaseConversation';
import { useSocket } from '@/contexts/SocketContext';

interface MainConversationProps {
  documentId: string;
  currentChunkId: string;
  conversationId: string;
}

export default function MainConversation({ 
  documentId,
  currentChunkId,
  conversationId,
}: MainConversationProps) {
  const { conversationSocket } = useSocket();

  const handleSendMessage = async (content: string, conversationId: string) => {
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
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
}