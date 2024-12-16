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
  // --- EXACT CHANGE: useState lazy initializers, no setSockets in an effect ---
  // This constructs each socket instance exactly once when the provider mounts.
  const [conversationSocket] = useState(() => new ConversationWebSocket(documentId));
  const [documentSocket] = useState(() => new DocumentWebSocket(documentId));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Mark as connected once the sockets are created
    setIsConnected(true);

    // Cleanup on unmount
    return () => {
      conversationSocket.close();
      documentSocket.close();
    };
    // We only want this effect once, so no dependency on documentId
    // That means if documentId changes mid-session, you'd need a new provider mount anyway.
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