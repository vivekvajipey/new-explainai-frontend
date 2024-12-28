'use client';

import { useState, useCallback, useEffect } from 'react';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { ConversationContainer } from '@/components/conversation/ConversationContainer';
import { useSocket } from '@/contexts/SocketContext';
import { DocumentMetadata, DocumentMetadataResponse, Highlight } from '@/components/document/types';
import { useMainConversation } from '@/hooks/useMainConversation';

export function DocumentPage({ documentId }: { documentId: string }) {
  // Core document state
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Shared state between document and conversations
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [highlights, setHighlights] = useState<Map<string, Highlight[]>>(new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { mainConversationId, error: mainError } = useMainConversation(documentId);


  const { conversationSocket, documentSocket } = useSocket();

  useEffect(() => {
    if (mainConversationId) {
      setActiveConversationId(mainConversationId);
    }
  }, [mainConversationId]);

  // Document metadata loading
  useEffect(() => {
    if (!documentSocket) return;

    const handleMetadata = (data: unknown) => {
      const response = data as DocumentMetadataResponse;
      if (response.document) {
        setMetadata(response.document);
        setIsLoading(false);
      }
    };

    const handleError = (error: unknown) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to document');
      setIsLoading(false);
    };

    documentSocket.onMessage('document.metadata.completed', handleMetadata);
    documentSocket.onMessage('document.metadata.error', handleError);

    return () => {
      // Cleanup if needed
    };
  }, [documentSocket]);

  // Handle chunk changes
  const handleChunkChange = useCallback((newIndex: number) => {
    if (!metadata || newIndex < 0 || newIndex >= metadata.chunks.length) return;
    setCurrentChunkIndex(newIndex);
    setActiveConversationId(mainConversationId); // Always reset to main conversation
  }, [metadata, mainConversationId]);

  // Handle highlight creation
  const handleHighlightCreate = useCallback(async (
    text: string,
    range: { start: number; end: number }
  ) => {
    if (!conversationSocket) return;
    
    try {
      const conversationId = await conversationSocket.createChunkConversation(
        currentChunkIndex.toString(),
        text,
        range
      );

      const newHighlight: Highlight = {
        id: `highlight-${Date.now()}`,
        text,
        startOffset: range.start,
        endOffset: range.end,
        conversationId,
        chunkId: currentChunkIndex.toString()
      };

      setHighlights(prev => {
        const chunkHighlights = prev.get(currentChunkIndex.toString()) || [];
        return new Map(prev).set(
          currentChunkIndex.toString(),
          [...chunkHighlights, newHighlight]
        );
      });

      setActiveConversationId(conversationId);
    } catch (error) {
      console.error('Failed to create highlight conversation:', error);
      setError('Failed to create highlight');
    }
  }, [conversationSocket, currentChunkIndex]);

  const handleHighlightClick = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    // Could add:
    // - Validation that the conversation exists
    // - Error handling
    // - Analytics/tracking
    // - Any UI feedback or side effects
  }, []);

  if (!mainConversationId) {
    return <div>Loading conversations...</div>;
  }

  // Loading and error states
  if (isLoading && !metadata) {
    return <div className="flex items-center justify-center h-screen">Loading document...</div>;
  }

  if (error || !metadata) {
    return (
      <div className="flex items-center justify-center h-screen text-error">
        Error: {error || 'Failed to load document'}
      </div>
    );
  }

  const currentChunk = metadata.chunks[currentChunkIndex];
  const currentHighlights = highlights.get(currentChunkIndex.toString()) || [];

  return (
    <div className="flex h-screen">
      <div className="w-1/2 border-r border-doc-border">
        <DocumentViewer
          chunk={currentChunk}
          highlights={currentHighlights}
          onCreateHighlight={handleHighlightCreate}
          onHighlightClick={handleHighlightClick}
          onChunkChange={handleChunkChange}
          currentChunkIndex={currentChunkIndex}
          totalChunks={metadata.meta_data.chunks_count}
          documentTitle={metadata.title}
        />
      </div>
      <div className="w-1/2">
        <ConversationContainer 
          documentId={documentId}
          currentSequence={currentChunk.sequence.toString()}
          activeConversationId={activeConversationId}
          onConversationChange={setActiveConversationId}
          mainConversationId={mainConversationId}
          mainError={mainError}
        />
      </div>
    </div>
  );
}