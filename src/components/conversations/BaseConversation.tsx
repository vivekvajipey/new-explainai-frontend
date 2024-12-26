import { useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/stores/conversationStores';
import { useConversationStreaming } from '@/hooks/useConversationStreaming';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';

interface MessageSendConfig {
  type: 'main' | 'highlight';
  chunkId: string;
  highlightText?: string;
}

interface BaseConversationProps {
  conversationId: string;
  messageSendConfig: MessageSendConfig;
  placeholder?: string;
  className?: string;
}

export default function BaseConversation({ 
  conversationId,
  messageSendConfig,
  placeholder = 'Type a message...',
  className = '',
}: BaseConversationProps) {
  const { conversationSocket } = useSocket();
  const [error, setError] = useState<string | null>(null);
  
  const messages = useConversationStore((state) => 
    conversationId ? state.getMessages(conversationId) : []
  );
  const addMessage = useConversationStore(state => state.addMessage);

  const { streamingState, handleStreamingMessage } = useConversationStreaming(
    conversationId,
    addMessage,
    conversationSocket
  );

  const handleSendMessage = async (content: string) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }
  
    try {
      setError(null);
      
      addMessage(conversationId, {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      });

      await handleStreamingMessage(content, messageSendConfig);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className={`flex flex-col h-[500px] ${className}`}>
      <MessageList 
        messages={messages.filter(msg => msg.role !== 'system')}
        streamingState={streamingState}
        error={error}
      />
      <MessageInput
        onSendMessage={handleSendMessage}
        isStreaming={streamingState.isStreaming}
        placeholder={placeholder}
        disabled={!conversationId}
      />
    </div>
  );
}