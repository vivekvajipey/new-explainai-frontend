import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { ConversationData } from '@/lib/websocket/types';
import MainConversation from './MainConversation';
import ChunkConversation from './ChunkConversation';

export interface ConversationTabsRef {
  createChunkConversation: (highlightText: string, chunkId: string) => void;
}

interface ConversationTabsProps {
  documentId: string;
  currentSequence: string;
  websocket: ConversationWebSocket;
}

const ConversationTabs = forwardRef<ConversationTabsRef, ConversationTabsProps>(
  ({ documentId, currentSequence, websocket }, ref) => {
    const [activeTab, setActiveTab] = useState<'main' | string>('main');
    const [chunkConversations, setChunkConversations] = useState<ConversationData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mainConversationId, setMainConversationId] = useState<string | null>(null);

    // Create main conversation once when component mounts
    useEffect(() => {
      let isMounted = true;

      const initMainConversation = async () => {
        try {
          const conversationId = await websocket.createMainConversation();
          if (isMounted) {
            setMainConversationId(conversationId);
          }
        } catch (error) {
          console.error('Failed to create main conversation:', error);
          if (isMounted) {
            setError('Failed to create conversation');
          }
        }
      };

      if (websocket && !mainConversationId) {
        initMainConversation();
      }

      return () => {
        isMounted = false;
      };
    }, [websocket]);

    // Load chunk conversations when sequence changes
    useEffect(() => {
      let isMounted = true;
      let pollTimeout: NodeJS.Timeout;

      const loadChunkConversations = async () => {
        try {
          const response = await websocket.getChunkConversations(currentSequence);
          if (isMounted) {
            const conversations = Object.entries(response.conversations).map(([id, data]) => ({
              id,
              type: 'chunk' as const,
              chunkId: data.chunk_id,
              highlightText: data.highlight_text,
              messages: []
            }));
            setChunkConversations(conversations);
          }
        } catch (error) {
          console.error('Failed to load chunk conversations:', error);
        }

        // Poll again in 5 seconds if component is still mounted
        if (isMounted) {
          pollTimeout = setTimeout(loadChunkConversations, 5000);
        }
      };

      if (websocket) {
        loadChunkConversations();
      }

      return () => {
        isMounted = false;
        clearTimeout(pollTimeout);
      };
    }, [currentSequence, websocket]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      createChunkConversation: async (highlightText: string, chunkId: string) => {
        if (!websocket) {
          setError('WebSocket not initialized');
          return;
        }

        try {
          const conversationId = await websocket.createChunkConversation(
            chunkId,
            highlightText
          );

          setChunkConversations(prev => [...prev, {
            id: conversationId,
            type: 'chunk',
            chunkId,
            highlightText,
            messages: []
          }]);

          setActiveTab(conversationId);
        } catch (error) {
          console.error('Failed to create chunk conversation:', error);
          setError('Failed to create conversation');
        }
      }
    }));

    return (
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'main'
                ? 'bg-earth-600 text-white'
                : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
            }`}
          >
            Main
          </button>
          {chunkConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveTab(conv.id)}
              className={`px-4 py-2 rounded-lg ${
                activeTab === conv.id
                  ? 'bg-earth-600 text-white'
                  : 'bg-earth-100 text-earth-600 hover:bg-earth-200'
              }`}
            >
              {conv.highlightText!.substring(0, 20)}...
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-500 mb-4 text-center">
            {error}
          </div>
        )}

        {/* Active conversation */}
        {websocket && mainConversationId ? (
          activeTab === 'main' ? (
            <MainConversation
              documentId={documentId}
              conversationId={mainConversationId}
              currentChunkId={currentSequence}
              websocket={websocket}
            />
          ) : (
            <ChunkConversation
              documentId={documentId}
              chunkId={currentSequence}
              highlightText={chunkConversations.find(conv => conv.id === activeTab)?.highlightText || ''}
              websocket={websocket}
            />
          )
        ) : (
          <div>Initializing conversations...</div>
        )}
      </div>
    );
  }
);

ConversationTabs.displayName = 'ConversationTabs';

export default ConversationTabs; 