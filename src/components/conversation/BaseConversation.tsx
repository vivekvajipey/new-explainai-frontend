// components/conversation/BaseConversation.tsx
import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStreaming } from '@/hooks/useConversationStreaming';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { Message, MessageRole, StreamingState } from '@/types/conversation';
import DemoLimitModal from '@/components/modals/DemoLimitModal';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoLimitModalOpen, setIsDemoLimitModalOpen] = useState(false);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    id: null,
    isStreaming: false,
    content: ''
  });
  
  useEffect(() => {
    console.log('Streaming state updated:', streamingState);
  }, [streamingState]);

  useEffect(() => {
    if (!conversationId || !conversationSocket) return;
    
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await conversationSocket.getMessages(conversationId);
        // Ensure we cast the role to MessageRole
        setMessages(response.messages.map(msg => ({
          ...msg,
          role: msg.role as MessageRole
        })));
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, conversationSocket]);

  const replaceMessage = (finalMessage: Message) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === conversationId ? finalMessage : msg
      )
    );
  };


  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, {
      ...message,
      role: message.role as MessageRole
    }]);
  };

  const { handleStreamingMessage } = useConversationStreaming(
    conversationId,
    addMessage,
    conversationSocket,
    setStreamingState,
    replaceMessage
  );

  const handleSendMessage = async (content: string) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }
    try {
      setError(null);
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMessage);
      
      const assistantMessage: Message = {
        id: conversationId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);
      
      await handleStreamingMessage(content, messageSendConfig);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Check specifically for demo limit error
      if (err instanceof Error && err.message.includes('demo message limit')) {
        setIsDemoLimitModalOpen(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <>
      <div className={`flex flex-col h-full ${className}`}>
        <MessageList
          messages={messages}
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

      <DemoLimitModal 
        isOpen={isDemoLimitModalOpen}
        onClose={() => setIsDemoLimitModalOpen(false)}
      />
    </>
  );
}