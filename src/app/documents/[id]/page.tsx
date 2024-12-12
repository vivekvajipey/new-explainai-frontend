'use client';

import { useEffect, useState, use, useRef } from 'react';
import { DocumentWebSocket } from '@/lib/api';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ConversationTabs from '@/components/conversations/ConversationTabs';
import TextSelectionPopup from '@/components/TextSelectionPopup';
import { ConversationTabsRef } from '@/components/conversations/ConversationTabs';

interface DocumentChunk {
  id: string;
  sequence: number;
  content: string;
  meta_data: {
    length: number;
    index: number;
  };
}

interface DocumentMetadata {
  title: string;
  pages: number;
  text: string;
  content?: string;
  chunks: DocumentChunk[];
  meta_data: {
    chunks_count: number;
  };
}

interface DocumentMetadataResponse {
  document: DocumentMetadata;
}

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const documentWsRef = useRef<DocumentWebSocket | null>(null);
  const conversationWsRef = useRef<ConversationWebSocket | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [documentReady, setDocumentReady] = useState(false);
  const conversationTabsRef = useRef<ConversationTabsRef>(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    if (!documentWsRef.current) {
      documentWsRef.current = new DocumentWebSocket(id);
      documentWsRef.current.onMessage(
        'document.metadata.completed',
        (data) => {
          const metadataResponse = data as DocumentMetadataResponse;
          setMetadata(metadataResponse.document);
          setDocumentReady(true);
        }
      );
    }
    
    if (!conversationWsRef.current) {
      conversationWsRef.current = new ConversationWebSocket(id);
    }

    return () => {
      documentWsRef.current?.close();
      conversationWsRef.current?.close();
      documentWsRef.current = null;
      conversationWsRef.current = null;
    };
  }, [id]);

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

  if (!metadata) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-earth-600">Loading document...</div>
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
        {documentReady && conversationWsRef.current && (
          <div className="h-[600px]">
            <ConversationTabs 
              ref={conversationTabsRef}
              documentId={id}
              currentSequence={currentChunkIndex.toString()}
              websocket={conversationWsRef.current}
            />
          </div>
        )}
      </div>
    </div>
  );
}
