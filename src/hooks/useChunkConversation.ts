import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect, useRef } from "react";

export function useChunkConversations(currentSequence: string) {
  const { conversationSocket } = useSocket();
  const [chunkConversations, setChunkConversations] = useState<{
    id: string;
    highlightText: string;
    chunkId: string;
  }[]>([]);

  const activeRequest = useRef(false);

  useEffect(() => {
    console.log(`Starting effect for sequence ${currentSequence}`);
    if (!conversationSocket) return;

    activeRequest.current = true; // Mark this request as active

    const loadChunkConversations = async () => {
      console.log(`Loading conversations for sequence ${currentSequence}`);
      try {
        const response = await conversationSocket.getChunkConversations(currentSequence);
        console.log(`RAW response for sequence ${currentSequence}:`, response.conversations);
        
        if (!activeRequest.current) return; // Ignore this response if the request is no longer active

        const conversations = Object.entries(response.conversations)
          .filter(([, conv]) => conv.highlight_text?.trim())
          .map(([id, conv]) => ({
            id,
            highlightText: conv.highlight_text,
            chunkId: conv.chunk_id.toString()
          }));
        
        console.log(`Setting conversations for sequence ${currentSequence}:`, conversations);
        setChunkConversations(conversations);
      } catch (error) {
        console.error(`Error loading chunk ${currentSequence} conversations:`, error);
      }
    };

    loadChunkConversations();

    return () => {
      activeRequest.current = false; // Cancel the request when the component unmounts or sequence changes
    };
  }, [currentSequence, conversationSocket]);

  return { chunkConversations };
}