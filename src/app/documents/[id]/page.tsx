'use client';

import { useEffect, useState } from 'react';
import { DocumentWebSocket } from '@/lib/api';

interface DocumentMetadata {
  title: string;
  pages: number;
  text: string;
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [ws, setWs] = useState<DocumentWebSocket | null>(null);

  useEffect(() => {
    const websocket = new DocumentWebSocket(params.id);
    setWs(websocket);

    websocket.onMessage('document.metadata.completed', (data) => {
      setMetadata(data);
    });

    websocket.send('document.metadata', { document_id: params.id });

    return () => {
      websocket.close();
    };
  }, [params.id]);

  if (!metadata) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-earth-600">Loading document...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{metadata.title}</h1>
        <p className="text-earth-600 dark:text-earth-300">
          {metadata.pages} pages
        </p>
      </div>
      
      <div className="bg-white dark:bg-earth-800 rounded-lg shadow-sm p-6">
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap font-palatino">
            {metadata.text}
          </pre>
        </div>
      </div>
    </div>
  );
}
