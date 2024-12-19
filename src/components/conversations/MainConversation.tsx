// MainConversation.tsx
import BaseConversation from './BaseConversation';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/stores/conversationStores';
import { useState, useRef } from 'react';

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
  const addMessage = useConversationStore(state => state.addMessage);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const accumulatedContentRef = useRef<string>('');

  const handleSendMessage = async (
    content: string, 
    conversationId: string,
    setStreamingContent: (content: string) => void
  ) => {
    if (!conversationSocket) {
      throw new Error('WebSocket not connected');
    }

    const messageId = `streaming-${Date.now()}`;
    accumulatedContentRef.current = '';
    
    setCurrentStreamingId(messageId);
    setIsStreaming(true);

    addMessage(conversationId, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await conversationSocket.sendMessageWithStreaming(
        conversationId, 
        content,
        {
          onToken: (fullMessage) => {
            accumulatedContentRef.current = fullMessage;
            setStreamingContent(fullMessage);
            
            addMessage(conversationId, {
              id: messageId,
              role: 'assistant',
              content: fullMessage,
              timestamp: new Date().toISOString(),
            });
          },
          onComplete: (message) => {
            const finalContent = accumulatedContentRef.current;
            console.log("Stream completed, final content length:", finalContent.length);
            console.log("message: ", message);
            
            addMessage(conversationId, {
              id: messageId,
              role: 'assistant',
              content: finalContent,
              timestamp: new Date().toISOString(),
            });
          },
          onError: (error) => {
            throw new Error(error);
          }
        },
        currentChunkId, 
        "main"
      );
      
      console.log("sendMessageWithStreaming response: ", response);

      return { message: accumulatedContentRef.current };
    } finally {
      setCurrentStreamingId(null);
      setIsStreaming(false);
      accumulatedContentRef.current = '';
    }
  };

  return (
    <BaseConversation
      documentId={documentId}
      conversationId={conversationId}
      streamingMessageId={currentStreamingId ?? undefined}
      isStreaming={isStreaming}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
}