// components/conversation/BaseConversation.tsx
import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStreaming } from '@/hooks/useConversationStreaming';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { Message, MessageRole, MessageSendConfig, StreamingState } from '@/types/conversation';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { SuggestedQuestions } from './SuggestedQuestions';
import DemoLimitModal from '@/components/modals/DemoLimitModal';
import { useConversationQuestions } from '@/hooks/useConversationQuestions';


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
  const {
    questions,
    isLoading: questionsLoading,
    isCollapsed,
    setIsCollapsed,
    fetchQuestions,
    regenerateQuestions
  } = useConversationQuestions(
    conversationId,
    messageSendConfig.type,
    messageSendConfig.chunkId
  );
  const { conversationSocket } = useSocket();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoLimitModalOpen, setIsDemoLimitModalOpen] = useState(false);
  const { trackEvent } = useGoogleAnalytics();
  const [streamingState, setStreamingState] = useState<StreamingState>({
    id: null,
    isStreaming: false,
    content: ''
  });

  const handleQuestionSelect = async (question: { id: string; content: string }) => {
    try {
      await handleSendMessage(question.content, question.id);
      await fetchQuestions();  // We'll need to lift this from the hook
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send question');
    }
  };
  
  useEffect(() => {
    console.log('Streaming state updated:', streamingState);
  }, [streamingState]);

  const loadMessages = async () => {
    if (!conversationId || !conversationSocket) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await conversationSocket.getMessages(conversationId);
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

  const handleSendMessage = async (content: string, questionId?: string) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }
    try {
      trackEvent(
        'Conversation',
        questionId ? 'suggested_question_sent' : 'message_sent',
        messageSendConfig.type
      );
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
      
      await handleStreamingMessage(content, {
        ...messageSendConfig,
        questionId
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      // Check specifically for demo limit error
      if (err instanceof Error && err.message.includes('demo message limit')) {
        setIsDemoLimitModalOpen(true);
        trackEvent('Demo', 'demo_limit_reached');
        return; // Don't reload for demo limit errors
      }
  
      // For other errors, try reloading to sync with backend
      setIsLoading(true);
      setError('Reloading messages...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadMessages();
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <>
      <div className={`flex flex-col h-full ${className}`}>
        <SuggestedQuestions
          questions={questions}
          isLoading={questionsLoading}
          isCollapsed={isCollapsed}
          onCollapse={() => setIsCollapsed(!isCollapsed)}
          onQuestionSelect={handleQuestionSelect}
          onRegenerate={regenerateQuestions}
          isStreaming={streamingState.isStreaming}  // Pass streaming state
          className="border-b border-doc-content-border"
        />
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