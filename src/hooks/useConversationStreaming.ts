// hooks/useConversationStreaming.ts
import { Message, StreamingState, MessageSendConfig } from '@/types/conversation';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';

export function useConversationStreaming(
  conversationId: string,
  onMessageComplete: (message: Message) => void,
  socket: ConversationWebSocket | null,
  setParentStreamingState: (state: StreamingState) => void,
  replaceMessage: (message: Message) => void  // New parameter
) {
  const handleStreamingMessage = async (
    content: string,
    config: MessageSendConfig
  ) => {
    if (!socket) {
      throw new Error('WebSocket not connected');
    }

    // Start streaming
    setParentStreamingState({
      id: conversationId,
      isStreaming: true,
      content: ''
    });

    try {
      const response = await socket.sendMessageWithStreaming(
        conversationId,
        content,
        {
          onToken: (partialMessage: string) => {
            console.log('Setting streaming state:', partialMessage);
            setParentStreamingState({
              id: conversationId,
              isStreaming: true,
              content: partialMessage
            });
            console.log('Setting streaming with conversationId:', conversationId);
          },
          onComplete: () => {
            setParentStreamingState({
              id: conversationId,
              isStreaming: false,
              content: ''
            });
          },
          onError: (error: Error) => {
            console.error('Streaming error:', error);
            setParentStreamingState({
              id: conversationId,
              isStreaming: false,
              content: ''
            });
          }
        },
        {
          chunkId: config.chunkId,
          type: config.type,
          questionId: config.questionId,
          useFullContext: config.useFullContext
        }
      );

      // Add completed message
      replaceMessage({
        id: response.user_message_id,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setParentStreamingState({
        id: conversationId,
        isStreaming: false,
        content: ''
      });
    }
  };

  return {
    handleStreamingMessage
  };
}