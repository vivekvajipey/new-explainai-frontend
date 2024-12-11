import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';

interface MainConversationProps {
  documentId: string;
}

export default function MainConversation({ documentId }: MainConversationProps) {
  const handleInitialize = async (ws: ConversationWebSocket) => {
    return await ws.createMainConversation();
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    await ws.sendMessage(content, "0");
  };

  return (
    <BaseConversation
      documentId={documentId}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the document..."
    />
  );
} 