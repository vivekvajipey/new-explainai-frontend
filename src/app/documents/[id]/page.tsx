'use client';

import { useEffect, useState, use } from 'react';
import { DocumentWebSocket } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  useEffect(() => {
    let websocket: DocumentWebSocket | null = null;
    let timeoutId: NodeJS.Timeout;

    const initializeWebSocket = () => {
      try {
        websocket = new DocumentWebSocket(id);

        websocket.onMessage('document.metadata.completed', (data) => {
          console.log('Received metadata:', data);
          if (data && data.document) {
            setMetadata(data.document);
            setError(null);
            setIsLoading(false);
            clearTimeout(timeoutId);
          } else {
            setError('Invalid document data received');
            setIsLoading(false);
          }
        });

        // Set a timeout to detect if we don't receive metadata within 5 seconds
        timeoutId = setTimeout(() => {
          if (!metadata) {
            setError('Failed to load document metadata. Please try again.');
            setIsLoading(false);
          }
        }, 5000);

        return websocket;
      } catch (err) {
        console.error('WebSocket initialization error:', err);
        setError('Failed to connect to document server');
        setIsLoading(false);
        return null;
      }
    };

    websocket = initializeWebSocket();

    return () => {
      clearTimeout(timeoutId);
      if (websocket) {
        websocket.close();
      }
    };
  }, [id, retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
  };

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-red-500">{error}</div>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-earth-800 text-earth-50 rounded-lg hover:bg-earth-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-earth-600">Loading document...</div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">No document data available</div>
      </div>
    );
  }

  const currentChunk = metadata.chunks[currentChunkIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
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
      
      <div className="bg-white dark:bg-earth-800 rounded-lg shadow-sm p-6">
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-palatino">
            {currentChunk.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
