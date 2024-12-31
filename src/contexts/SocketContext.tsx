// src/contexts/SocketContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { DocumentWebSocket } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCostLimit } from './CostLimitContext';

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
  isDemo?: boolean;
}

export function SocketProvider({ children, documentId, isDemo = false }: SocketProviderProps) {
  const { token } = useAuth();
  const { handleError } = useCostLimit();
  
  const [conversationSocket, setConversationSocket] = useState<ConversationWebSocket | null>(null);
  const [documentSocket, setDocumentSocket] = useState<DocumentWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create sockets if we have a token OR if it's a demo doc
    if (token || isDemo) {
      // For demo docs, pass null as token
      const socketToken = isDemo ? null : token;
      const newConversationSocket = new ConversationWebSocket(documentId, socketToken, undefined, handleError);
      const newDocumentSocket = new DocumentWebSocket(documentId, socketToken);
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
  }, [token, documentId, isDemo, handleError]);

  return (
    <SocketContext.Provider value={{ conversationSocket, documentSocket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}