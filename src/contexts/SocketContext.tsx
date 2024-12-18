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
  
  // Initialize sockets with auth token
  const [conversationSocket] = useState(() => new ConversationWebSocket(documentId, token));
  const [documentSocket] = useState(() => new DocumentWebSocket(documentId, token));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mark as connected once the sockets are created
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      conversationSocket.close();
      documentSocket.close();
    };
  }, [conversationSocket, documentSocket]);

  // Provide the same stable context value
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