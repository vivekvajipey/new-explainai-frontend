'use client';

import { useState, useCallback, useEffect } from 'react';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { ConversationContainer } from '@/components/conversation/ConversationContainer';
import { useSocket } from '@/contexts/SocketContext';
import { DocumentMetadata, DocumentMetadataResponse } from '@/components/document/types';
import { useMainConversation } from '@/hooks/useMainConversation';
import { useChunkConversations } from '@/hooks/useChunkConversation'; // Import the new hook
import { Highlight } from '@/components/document/types'; // Import Highlight type
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics'; // Import the new hook
import Joyride from 'react-joyride';
import { useTutorialTour } from '@/hooks/useTutorialTour';

export function DocumentPage({ documentId }: { documentId: string }) {
  // Core document state
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [lastCreatedConversationId, setLastCreatedConversationId] = useState<string | null>(null);
  const { mainConversationId, error: mainError } = useMainConversation(documentId);
  const { steps, runTour, handleTourCallback } = useTutorialTour();

  const [isConversationCollapsed, setIsConversationCollapsed] = useState(false);

  const { conversationSocket, documentSocket } = useSocket();

  // Calculate current chunk
  const currentChunk = metadata?.chunks[currentChunkIndex];

  const { trackEvent } = useGoogleAnalytics();

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

  // Get conversations and highlights for current chunk
  const { 
    chunkConversations, 
    highlights: currentHighlights,
    error: conversationsError 
  }: { 
    chunkConversations: { id: string; highlightText: string; chunkId: string }[], 
    highlights: Highlight[],
    error: string | null 
  } = useChunkConversations(
    currentChunk?.sequence.toString() ?? "0",
    lastCreatedConversationId
  );

  // Reset lastCreatedConversationId after fetch
  useEffect(() => {
    if (lastCreatedConversationId) {
      setLastCreatedConversationId(null);
    }
  }, [lastCreatedConversationId]);

  // Set error state if there's an error from either source
  useEffect(() => {
    setError(conversationsError || mainError || null);
  }, [conversationsError, mainError]);

  // Handle chunk changes
  const handleChunkChange = useCallback((newIndex: number) => {
    if (!metadata || newIndex < 0 || newIndex >= metadata.chunks.length) return;
    trackEvent('Document', 'chunk_changed', `chunk_${newIndex}`);
    setCurrentChunkIndex(newIndex);
  }, [metadata]);

  // Handle highlight creation
  const handleHighlightCreate = useCallback(async (
    text: string,
    range: { start: number; end: number }
  ) => {
    if (!conversationSocket) return;

    setIsConversationCollapsed(false);
    trackEvent('Conversation', 'highlight_conversation_created');
    
    try {
      const conversationId = await conversationSocket.createChunkConversation(
        currentChunkIndex.toString(),
        text,
        range
      );
      setLastCreatedConversationId(conversationId);
      setActiveConversationId(conversationId);
    } catch (error) {
      console.error('Failed to create highlight conversation:', error);
      setError('Failed to create highlight');
    }
  }, [conversationSocket, currentChunkIndex]);

  const handleHighlightClick = useCallback((conversationId: string) => {
    setIsConversationCollapsed(false);
    setActiveConversationId(conversationId);
    trackEvent('Conversation', 'highlight_conversation_opened', conversationId);
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

  if (error || !metadata || !currentChunk) {
    return (
      <div className="flex items-center justify-center h-screen text-error">
        Error: {error || 'Failed to load document'}
      </div>
    );
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        styles={{
          options: {
            primaryColor: '#000'
          }
        }}
        callback={handleTourCallback}
      />
      <div className="flex h-screen">
        <div className={`document-viewer transition-all duration-300 ${isConversationCollapsed ? 'w-full' : 'w-1/2'}`}>
          <DocumentViewer
            chunk={currentChunk}
            highlights={currentHighlights}
            onCreateHighlight={handleHighlightCreate}
            onHighlightClick={handleHighlightClick}
            onChunkChange={handleChunkChange}
            currentChunkIndex={currentChunkIndex}
            totalChunks={metadata.meta_data.chunks_count}
            documentTitle={metadata.title}
            isCollapsed={isConversationCollapsed}
            onToggleCollapse={() => setIsConversationCollapsed(!isConversationCollapsed)}
          />
        </div>
        <div
          className={`transition-all duration-300 ${
            isConversationCollapsed ? 'w-0 overflow-hidden' : 'w-1/2'
          }`}
        >
          <ConversationContainer
            documentId={documentId}
            currentSequence={currentChunk && currentChunk.sequence.toString()}
            activeConversationId={activeConversationId}
            onConversationChange={setActiveConversationId}
            mainConversationId={mainConversationId}
            mainError={mainError}
            chunkConversations={chunkConversations}
          />
        </div>
      </div>
    </>
  );
}