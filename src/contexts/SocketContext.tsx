// src/contexts/SocketContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { DocumentWebSocket } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';

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
  const { token } = useAuth();
  
  const [conversationSocket, setConversationSocket] = useState<ConversationWebSocket | null>(null);
  const [documentSocket, setDocumentSocket] = useState<DocumentWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const newConversationSocket = new ConversationWebSocket(documentId, token);
      const newDocumentSocket = new DocumentWebSocket(documentId, token);
      setConversationSocket(newConversationSocket);
      setDocumentSocket(newDocumentSocket);
      setIsConnected(true);

      return () => {
        newConversationSocket.close();
        newDocumentSocket.close();
        setIsConnected(false);
      };
    } else {
      setConversationSocket(null);
      setDocumentSocket(null);
      setIsConnected(false);
    }
  }, [token, documentId]);

  const contextValue: SocketContextType = {
    conversationSocket,
    documentSocket,
    isConnected
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}