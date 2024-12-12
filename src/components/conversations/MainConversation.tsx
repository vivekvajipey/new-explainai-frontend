import { useState, useEffect } from 'react';
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
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      if (!initializationAttempted && !conversationId) {
        setInitializationAttempted(true);
        try {
          const newConversationId = await websocket.createMainConversation();
          setConversationId(newConversationId);
        } catch (error) {
          console.error('Failed to initialize main conversation:', error);
          // Don't retry automatically - could add a manual retry button if needed
        }
      }
    };

    initialize();
  }, [websocket, initializationAttempted, conversationId]);

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
      onInitialize={async () => conversationId} // Just return the existing ID
      onSendMessage={handleSendMessage}
      placeholder="Ask about the entire document..."
    />
  );
} 