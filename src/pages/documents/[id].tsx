// src/pages/documents/[id].tsx
import { DocumentPage } from '@/components/DocumentPage';
import { useRouter } from 'next/router';
import { SocketProvider } from '@/contexts/SocketContext';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DocumentPageWrapper() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isDemo = !user;

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <SocketProvider documentId={id} isDemo={isDemo}>
      <DocumentPage documentId={id} />
    </SocketProvider>
  );
}