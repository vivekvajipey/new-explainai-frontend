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
  const updateMessageRef = useRef<NodeJS.Timeout | null>(null);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = async (
    content: string, 
    conversationId: string,
    setStreamingContent: (content: string) => void
  ) => {
    if (!conversationSocket || !conversationId) {
      throw new Error('No active conversation');
    }

    const messageId = `streaming-${Date.now()}`;
    let accumulatedContent = '';
    
    setCurrentStreamingId(messageId);
    setIsStreaming(true);

    try {
      console.log("Sending message to chunk conversation:", conversationId, "with highlightText:", highlightText);
    
      const response = await conversationSocket.sendMessageWithStreaming(
        conversationId,
        content,
        {
          onToken: (fullMessage) => {
            accumulatedContent = fullMessage;
            setStreamingContent(fullMessage);
            
            if (updateMessageRef.current) {
              clearTimeout(updateMessageRef.current);
            }
            
            updateMessageRef.current = setTimeout(() => {
              addMessage(conversationId, {
                id: messageId,
                role: 'assistant',
                content: accumulatedContent,
                timestamp: new Date().toISOString(),
              });
            }, 100);
          },
          onComplete: (message) => {
            console.log("final message equivalent to accumulated content", message === accumulatedContent);

            if (updateMessageRef.current) {
              clearTimeout(updateMessageRef.current);
            }
            
            addMessage(conversationId, {
              id: messageId,
              role: 'assistant',
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
            });
          },
          onError: (error) => {
            if (updateMessageRef.current) {
              clearTimeout(updateMessageRef.current);
            }
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
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateMessageRef.current) {
        clearTimeout(updateMessageRef.current);
      }
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