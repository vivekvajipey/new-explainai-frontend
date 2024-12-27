import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect } from "react";

export function useMainConversation(documentId: string) {
  const { conversationSocket } = useSocket();
  const [mainConversationId, setMainConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conversationSocket) return;

    const initMainConversation = async () => {
      try {
        // First check for existing conversations
        const conversations = await conversationSocket.listConversations();
        const existingMain = Object.entries(conversations).find(
          ([, conv]) => conv.document_id === documentId && !conv.chunk_id
        );

        if (existingMain) {
          setMainConversationId(existingMain[0]);
        } else {
          // If no existing main conversation, create one
          const conversationId = await conversationSocket.createMainConversation();
          setMainConversationId(conversationId);
        }
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize main conversation';
        setError(errorMessage);
        setMainConversationId(null);
      }
    };

    initMainConversation();
  }, [conversationSocket, documentId]);

  return { mainConversationId, error };
}