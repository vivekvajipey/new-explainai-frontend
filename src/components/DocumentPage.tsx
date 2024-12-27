'use client';

import { useState, useCallback, useEffect } from 'react';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { ConversationTabs } from '@/components/conversation/ConversationTabs';
import { useSocket } from '@/contexts/SocketContext';
import { DocumentMetadata, DocumentMetadataResponse, Highlight } from '@/components/document/types';

export function DocumentPage({ documentId }: { documentId: string }) {
  // Your existing component code, but replace all params.id with documentId
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [highlights, setHighlights] = useState<Map<string, Highlight[]>>(new Map());
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { conversationSocket, documentSocket } = useSocket();

  // Listen for metadata updates from WebSocket
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

    // Register handlers
    documentSocket.onMessage('document.metadata.completed', handleMetadata);
    documentSocket.onMessage('document.metadata.error', handleError);

    // No need for removeHandler if not provided by DocumentWebSocket
    return () => {
      // If you need cleanup, you might need to add a method to DocumentWebSocket
      // or handle it differently
    };
  }, [documentSocket]);

  // Handle chunk changes
  const handleChunkChange = useCallback((newIndex: number) => {
    if (!metadata) return;
    
    if (newIndex >= 0 && newIndex < metadata.chunks.length) {
      setCurrentChunkIndex(newIndex);
      
      // Reset active conversation if it's a highlight conversation
      setActiveConversationId(prevId => {
        if (!prevId) return null;
        const currentHighlights = highlights.get(currentChunkIndex.toString()) || [];
        const isHighlightConversation = currentHighlights.some(h => h.conversationId === prevId);
        return isHighlightConversation ? null : prevId;
      });
    }
  }, [metadata, highlights, currentChunkIndex]);

  // Handle highlight creation
  const handleHighlightCreate = useCallback(async (
    text: string,
    range: { start: number; end: number }
  ) => {
    if (!conversationSocket) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Create conversation first
      const conversationId = await conversationSocket.createChunkConversation(
        currentChunkIndex.toString(),
        text,
        range
      );

      // Then create highlight
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

      // Set this as active conversation
      setActiveConversationId(conversationId);
    } catch (error) {
      console.error('Failed to create highlight conversation:', error);
      setError('Failed to create highlight');
    } finally {
      setIsLoading(false);
    }
  }, [conversationSocket, currentChunkIndex]);

  const handleHighlightClick = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
  }, []);

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
        <ConversationTabs
          documentId={documentId}
          currentSequence={currentChunk.sequence.toString()}
          activeConversationId={activeConversationId}
          onConversationChange={setActiveConversationId}
        />
      </div>
    </div>
  );
}