// ChunkConversation.tsx
import BaseConversation from './BaseConversation';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/stores/conversationStores';
import { useEffect, useRef, useState } from 'react';

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
  const addMessage = useConversationStore(state => state.addMessage);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const accumulatedContentRef = useRef<string>('');

  const handleSendMessage = async (
    content: string, 
    conversationId: string,
    setStreamingContent: (content: string) => void
  ) => {
    if (!conversationSocket || !conversationId) {
      throw new Error('No active conversation');
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
      console.log("Sending message to chunk conversation:", conversationId, "with highlightText:", highlightText);
    
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
          onComplete: () => {
            const finalContent = accumulatedContentRef.current;
            console.log("Stream completed, final content:", finalContent);

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
        chunkId,
        "highlight"
      );
    
      return { message: response.message };
    } finally {
      setCurrentStreamingId(null);
      setIsStreaming(false);
      accumulatedContentRef.current = '';
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      // No cleanup needed
    };
  }, []);

  return (
    <BaseConversation
      documentId={documentId}
      conversationId={conversationId}
      streamingMessageId={currentStreamingId ?? undefined}
      isStreaming={isStreaming}
      onSendMessage={handleSendMessage}
      placeholder="Ask about this highlighted text..."
      className="border-2 border-yellow-200"
    />
  );
}