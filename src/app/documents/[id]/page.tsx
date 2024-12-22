// src/app/documents/[id]/page.tsx
'use client';

import { useEffect, useState, useRef, use } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ConversationTabs from '@/components/conversations/ConversationTabs';
import { ConversationTabsRef } from '@/components/conversations/ConversationTabs';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import { DocumentMetadata, DocumentMetadataResponse } from './types';
import { DocumentContent } from '@/components/document/DocumentContent';

export default function DocumentPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);

  return (
    <SocketProvider documentId={id}>
      <DocumentPageContent id={id} />
    </SocketProvider>
  );
}

function DocumentPageContent({ id }: { id: string }) {
  const { documentSocket, isConnected } = useSocket();
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const conversationTabsRef = useRef<ConversationTabsRef>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    if (!documentSocket || !isConnected) return;

    documentSocket.onMessage(
      'document.metadata.completed',
      (data) => {
        const metadataResponse = data as DocumentMetadataResponse;
        console.log('Received metadata:', metadataResponse);
        setMetadata(metadataResponse.document);
      }
    );
  }, [documentSocket, isConnected]);

  const handlePreviousChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(prev => prev - 1);
    }
  };

  const handleNextChunk = () => {
    if (metadata && currentChunkIndex < metadata.chunks.length - 1) {
      setCurrentChunkIndex(prev => prev + 1);
    }
  };

  if (!metadata || !isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-doc-subtitle">
          {!isConnected ? 'Connecting...' : 'Loading document...'}
        </div>
      </div>
    );
  }

  const currentChunk = metadata.chunks[currentChunkIndex];

  const handleCreateHighlight = async (text: string, range: { start: number; end: number }) => {
    if (!conversationTabsRef.current) return;
    
    try {
      await conversationTabsRef.current.createChunkConversation(
        text,
        currentChunkIndex.toString(),
        range
      );
    } catch (error) {
      console.error('Failed to create highlight and conversation:', error);
    }
  };

  const handleHighlightClick = (conversationId: string) => {
    if (conversationTabsRef.current) {
      conversationTabsRef.current.setActiveTab(conversationId);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-doc-title">{metadata.title}</h1>
        <div className="flex items-center justify-between">
          <p className="text-doc-subtitle">
            {metadata.pages} pages • Chunk {currentChunkIndex + 1} of {metadata.chunks.length}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousChunk}
              disabled={currentChunkIndex === 0}
              className={`p-2 rounded-lg transition-colors ${
                currentChunkIndex === 0
                  ? 'text-doc-nav-button-disabled cursor-not-allowed'
                  : 'text-doc-nav-button hover:bg-doc-nav-button-hover'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextChunk}
              disabled={currentChunkIndex === metadata.chunks.length - 1}
              className={`p-2 rounded-lg transition-colors ${
                currentChunkIndex === metadata.chunks.length - 1
                  ? 'text-doc-nav-button-disabled cursor-not-allowed'
                  : 'text-doc-nav-button hover:bg-doc-nav-button-hover'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Content */}
        <div className="document-container border-doc-border bg-doc-bg">
          <DocumentContent
            content={currentChunk.content}
            chunkId={currentChunkIndex.toString()}
            onHighlightClick={handleHighlightClick}
            onCreateHighlight={handleCreateHighlight}
          />
        </div>

        {/* Conversations */}
        {isConnected && (
          <div className="h-[600px] document-container border-doc-border bg-doc-bg">
            <ConversationTabs 
              ref={conversationTabsRef}
              documentId={id}
              currentSequence={currentChunkIndex.toString()}
            />
          </div>
        )}
        {!isConnected && (
          <div className="text-doc-subtitle text-center">
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
