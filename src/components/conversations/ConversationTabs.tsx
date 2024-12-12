import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
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
}

const ConversationTabs = forwardRef<ConversationTabsRef, ConversationTabsProps>(
  ({ documentId, currentSequence }, ref) => {
    const [activeTab, setActiveTab] = useState<'main' | string>('main');
    const [chunkConversations, setChunkConversations] = useState<ConversationData[]>([]);
    const websocketRef = useRef<ConversationWebSocket | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize WebSocket connection
    useEffect(() => {
      if (!websocketRef.current) {
        websocketRef.current = new ConversationWebSocket(documentId);
      }
      return () => {
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }
      };
    }, [documentId]);

    // Load chunk conversations when sequence changes
    useEffect(() => {
      const loadChunkConversations = async () => {
        if (!websocketRef.current) return;

        try {
          const response = await websocketRef.current.getChunkConversations(currentSequence);
          const conversations = Object.entries(response.conversations).map(([id, data]) => ({
            id,
            type: 'chunk' as const,
            chunkId: data.chunk_id,
            highlightText: data.highlight_text,
            messages: []
          }));
          setChunkConversations(conversations);
        } catch (error) {
          console.error('Failed to load chunk conversations:', error);
          // Don't show error for missing conversations
        }
      };

      loadChunkConversations();
    }, [currentSequence]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      createChunkConversation: async (highlightText: string, chunkId: string) => {
        if (!websocketRef.current) {
          setError('WebSocket not initialized');
          return;
        }

        try {
          const conversationId = await websocketRef.current.createChunkConversation(
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
        {activeTab === 'main' ? (
          <MainConversation
            documentId={documentId}
            currentChunkId={currentSequence}
            websocket={websocketRef.current!}
          />
        ) : (
          <ChunkConversation
            documentId={documentId}
            chunkId={currentSequence}
            highlightText={chunkConversations.find(conv => conv.id === activeTab)?.highlightText || ''}
            websocket={websocketRef.current!}
          />
        )}
      </div>
    );
  }
);

ConversationTabs.displayName = 'ConversationTabs';

export default ConversationTabs; 