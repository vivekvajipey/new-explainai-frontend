// src/contexts/SocketContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { DocumentWebSocket } from '@/lib/api';

interface SocketContextType {
  conversationSocket: ConversationWebSocket | null;
  documentSocket: DocumentWebSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  conversationSocket: null,
  documentSocket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: React.ReactNode;
  documentId: string;
}

export function SocketProvider({ children, documentId }: SocketProviderProps) {
  const [sockets, setSockets] = useState<SocketContextType>({
    conversationSocket: null,
    documentSocket: null,
    isConnected: false
  });

  useEffect(() => {
    const conversationSocket = new ConversationWebSocket(documentId);
    const documentSocket = new DocumentWebSocket(documentId);
    
    setSockets({
      conversationSocket,
      documentSocket,
      isConnected: true
    });

    return () => {
      conversationSocket.close();
      documentSocket.close();
    };
  }, [documentId]);

  return (
    <SocketContext.Provider value={sockets}>
      {children}
    </SocketContext.Provider>
  );
}