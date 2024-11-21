// app/document/[id]/page.tsx
'use client';

import { useDocumentState } from '@/hooks/useDocumentState';
import { DocumentProvider } from '@/context/DocumentContext';
import ChunkViewer from '@/components/ChunkViewer';
import ChatWindow from '@/components/ChatWindow';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

function DocumentContent({ id }: { id: string }) {
  const state = useDocumentState(id);

  if (!state.chunks.size) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid grid-cols-2 h-screen">
      <div className="overflow-auto border-r border-gray-200">
        <ChunkViewer documentId={id} />
      </div>
      <div className="overflow-auto">
        <ChatWindow documentId={id} />
      </div>
    </div>
  );
}

export default function DocumentPage() {
  const pathname = usePathname();
  const documentId = pathname?.split('/').pop();

  if (!documentId) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DocumentProvider documentId={documentId}>
        <DocumentContent id={documentId} />
      </DocumentProvider>
    </Suspense>
  );
}