// src/pages/documents/[id].tsx
import { DocumentPage } from '@/components/DocumentPage';
import { useRouter } from 'next/router';
import { SocketProvider } from '@/contexts/SocketContext';

export default function DocumentPageWrapper() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <SocketProvider documentId={id}>
      <DocumentPage documentId={id} />
    </SocketProvider>
  );
}