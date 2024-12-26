// hooks/useConversationStreaming.ts

import { useState, useRef } from 'react';
import { Message } from '@/types/conversation';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';

interface StreamingState {
  id: string | null;
  isStreaming: boolean;
  content: string;
}

interface MessageSendConfig {
  type: 'main' | 'highlight';
  chunkId: string;
  highlightText?: string;
}

export function useConversationStreaming(
  conversationId: string,
  addMessage: (conversationId: string, message: Message) => void,
  conversationSocket: ConversationWebSocket | null
) {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    id: null,
    isStreaming: false,
    content: ''
  });
  const accumulatedContentRef = useRef<string>('');

  const handleStreamingMessage = async (
    content: string,
    config: MessageSendConfig
  ) => {
    if (!conversationSocket?.isConnected) {
      throw new Error('WebSocket is not connected');
    }

    const messageId = `streaming-${Date.now()}`;
    accumulatedContentRef.current = '';
    
    setStreamingState({
      id: messageId,
      isStreaming: true,
      content: ''
    });

    // Add initial empty assistant message
    addMessage(conversationId, {
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    });

    try {
      const response = await conversationSocket.sendMessageWithStreaming(
        conversationId,
        content,
        {
          onToken: (fullMessage: string) => {
            accumulatedContentRef.current = fullMessage;
            setStreamingState(prev => ({
              ...prev,
              content: fullMessage
            }));
            addMessage(conversationId, {
              id: messageId,
              role: 'assistant',
              content: fullMessage,
              timestamp: new Date().toISOString()
            });
          },
          onComplete: () => {
            const finalContent = accumulatedContentRef.current;
            addMessage(conversationId, {
              id: messageId,
              role: 'assistant',
              content: finalContent,
              timestamp: new Date().toISOString()
            });
          },
          onError: (error: string) => {
            throw new Error(error);
          }
        },
        config.chunkId,
        config.type
      );

      return response;

    } finally {
      setStreamingState({
        id: null,
        isStreaming: false,
        content: ''
      });
      accumulatedContentRef.current = '';
    }
  };

  return {
    streamingState,
    handleStreamingMessage
  };
}