// ChunkConversation.tsx
import BaseConversation from './BaseConversation';
import { MessageSendConfig } from '@/types/conversation'; // we should create this

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
  conversationId: string;
  highlightText: string;
}

export default function ChunkConversation({
  chunkId,
  conversationId,
  highlightText,
}: ChunkConversationProps) {
  const messageSendConfig: MessageSendConfig = {
    type: 'highlight',
    chunkId,
    highlightText
  };

  return (
    <BaseConversation
      conversationId={conversationId}
      messageSendConfig={messageSendConfig}
      placeholder="Ask about this highlighted text..."
      className="border-2 border-yellow-200"
    />
  );
}