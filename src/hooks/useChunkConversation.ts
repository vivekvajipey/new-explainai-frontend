import { useSocket } from "@/contexts/SocketContext";
import { useState, useEffect, useRef } from "react";
import { Highlight } from "@/components/document/types";

interface ChunkConversation {
  id: string;
  highlightText: string;
  chunkId: string;
}

interface UseChunkConversationsResult {
  chunkConversations: ChunkConversation[];
  highlights: Highlight[];
  error: string | null;
}

export function useChunkConversations(
  currentSequence: string,
  lastCreatedConversationId: string | null
): UseChunkConversationsResult {
  const { conversationSocket } = useSocket();
  const [chunkConversations, setChunkConversations] = useState<ChunkConversation[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef(false);

  useEffect(() => {
    console.log(`Starting effect for sequence ${currentSequence} or new conversation ${lastCreatedConversationId}`);
    if (!conversationSocket) return;

    activeRequest.current = true;

    const loadChunkConversations = async () => {
      console.log(`Loading conversations for sequence ${currentSequence}`);
      try {
        const response = await conversationSocket.getChunkConversations(currentSequence);
        console.log(`Raw response for sequence ${currentSequence}:`, response);
        
        if (!activeRequest.current) return;

        // Process conversations for ConversationContainer
        const conversations = Object.entries(response.conversations)
          .filter(([, conv]) => conv.highlight_text?.trim())
          .map(([id, conv]) => ({
            id,
            highlightText: conv.highlight_text,
            chunkId: conv.chunk_id.toString()
          }));
        
        console.log('Processed conversations:', conversations);
        setChunkConversations(conversations);

        // Process highlights for DocumentViewer
        const processedHighlights: Highlight[] = Object.entries(response.conversations)
          .filter(([, conv]) => conv.highlight_text?.trim() && conv.highlight_range)
          .map(([id, conv]) => ({
            id,
            text: conv.highlight_text,
            startOffset: conv.highlight_range?.start ?? 0,
            endOffset: conv.highlight_range?.end ?? 0,
            conversationId: id,
            chunkId: conv.chunk_id.toString()
          }));

        console.log('Processed highlights:', processedHighlights);
        setHighlights(processedHighlights);
        
      } catch (error) {
        console.error(`Error loading chunk ${currentSequence} conversations:`, error);
        setError(error instanceof Error ? error.message : 'Failed to load conversations');
      }
    };

    loadChunkConversations();

    return () => {
      activeRequest.current = false;
    };
  }, [currentSequence, conversationSocket, lastCreatedConversationId]);

  return { chunkConversations, highlights, error };
}