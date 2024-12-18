// src/app/documents/[id]/page.tsx
'use client';

import { useEffect, useState, useRef, use } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ConversationTabs from '@/components/conversations/ConversationTabs';
import TextSelectionPopup from '@/components/TextSelectionPopup';
import { ConversationTabsRef } from '@/components/conversations/ConversationTabs';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import { DocumentMetadata, DocumentMetadataResponse } from './types';

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

  const handleCreateDiscussion = (text: string) => {
    if (!conversationTabsRef.current) return;
    
    conversationTabsRef.current.createChunkConversation(
      text,
      currentChunkIndex.toString()
    );
  };

  if (!metadata || !isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-earth-600">
          {!isConnected ? 'Connecting...' : 'Loading document...'}
        </div>
      </div>
    );
  }

  const currentChunk = metadata.chunks[currentChunkIndex];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
        <div className="flex items-center justify-between">
          <p className="text-earth-600 dark:text-earth-300">
            {metadata.pages} pages • Chunk {currentChunkIndex + 1} of {metadata.chunks.length}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousChunk}
              disabled={currentChunkIndex === 0}
              className={`p-2 rounded-lg ${
                currentChunkIndex === 0
                  ? 'text-earth-700 cursor-not-allowed'
                  : 'text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextChunk}
              disabled={currentChunkIndex === metadata.chunks.length - 1}
              className={`p-2 rounded-lg ${
                currentChunkIndex === metadata.chunks.length - 1
                  ? 'text-earth-700 cursor-not-allowed'
                  : 'text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Content */}
        <div className="bg-white dark:bg-earth-800 rounded-lg shadow-sm p-6 relative">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-palatino">
              {currentChunk.content}
            </pre>
          </div>
          <TextSelectionPopup onCreateDiscussion={handleCreateDiscussion} />
        </div>

        {/* Conversations - Only render when document is ready */}
        {isConnected && (
          <div className="h-[600px]">
            <ConversationTabs 
              ref={conversationTabsRef}
              documentId={id}
              currentSequence={currentChunkIndex.toString()}
            />
          </div>
        )}
        {!isConnected && (
          <div className="text-earth-500 text-center">
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
