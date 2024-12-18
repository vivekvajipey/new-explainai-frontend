// ChunkConversation.tsx
import BaseConversation from './BaseConversation';
import { useSocket } from '@/contexts/SocketContext';

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
  conversationId: string;
  highlightText: string;
}

export default function ChunkConversation({ 
  documentId, 
  chunkId,
  conversationId,
  highlightText,
}: ChunkConversationProps) {
  const { conversationSocket } = useSocket();
   
  const handleSendMessage = async (content: string, conversationId: string) => {
    if (!conversationSocket || !conversationId) {
      throw new Error('No active conversation');
    }

    console.log("Sending message to chunk conversation:", conversationId, "with highlightText:", highlightText);
  
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
      conversationId={conversationId}
      onSendMessage={handleSendMessage}
      placeholder="Ask about this highlighted text..."
      className="border-2 border-yellow-200"
    />
  );
}