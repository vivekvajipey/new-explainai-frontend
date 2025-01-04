// MainConversation.tsx
import BaseConversation from './BaseConversation';
import { MessageSendConfig } from '@/types/conversation';

interface MainConversationProps {
  documentId: string;
  currentChunkId: string;
  conversationId: string;
}

export default function MainConversation({
  currentChunkId,
  conversationId,
}: MainConversationProps) {
  const messageSendConfig: MessageSendConfig = {
    type: 'main',
    chunkId: currentChunkId
  };
  
  return (
    <div className="main-conversation h-full">
      <BaseConversation
        conversationId={conversationId}
        messageSendConfig={messageSendConfig}
        placeholder="Ask about the entire document..."
      />
    </div>
  );
}