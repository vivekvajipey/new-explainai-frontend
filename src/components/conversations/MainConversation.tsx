import { useState } from 'react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import BaseConversation from './BaseConversation';

interface MainConversationProps {
  documentId: string;
  currentChunkId: string;
  websocket: ConversationWebSocket;
}

export default function MainConversation({ 
  documentId, 
  currentChunkId,
  websocket 
}: MainConversationProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleInitialize = async (ws: ConversationWebSocket) => {
    try {
      const newConversationId = await ws.createMainConversation();
      if (!newConversationId) {
        throw new Error('No conversation ID received');
      }
      setConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      console.error('Failed to create main conversation:', error);
      throw error;
    }
  };

  const handleSendMessage = async (ws: ConversationWebSocket, content: string) => {
    if (!conversationId) {
      console.error('Cannot send message - conversation not initialized');
      return;
    }
    await ws.sendMessage(conversationId, content, currentChunkId);
  };

  return (
    <BaseConversation
      documentId={documentId}
      websocket={websocket}
      onInitialize={handleInitialize}
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
} 