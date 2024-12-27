import { useChunkConversations } from "@/hooks/useChunkConversation";
import { useMainConversation } from "@/hooks/useMainConversation";
import { useMemo } from "react";
import ChunkConversation from "./ChunkConversation";
import MainConversation from "./MainConversation";

interface MainConversationType {
  type: 'main';
  id: string;
}

interface ChunkConversationType {
  type: 'chunk';
  id: string;
  highlightText: string;
  chunkId: string;
}

type ActiveConversationType = MainConversationType | ChunkConversationType;

interface ConversationTabsProps {
  documentId: string;
  currentSequence: string;
  activeConversationId: string | null;
  onConversationChange: (conversationId: string) => void;
}

export function ConversationTabs({
  documentId,
  currentSequence,
  activeConversationId,
  onConversationChange,
}: ConversationTabsProps) {
  const { mainConversationId, error: mainError } = useMainConversation(documentId);
  const { chunkConversations } = useChunkConversations(currentSequence);

  const activeConversation = useMemo((): ActiveConversationType | null => {
    if (!mainConversationId) return null;  // Early return if no main conversation
    
    if (activeConversationId === mainConversationId) {
      return { 
        type: 'main',
        id: mainConversationId 
      };
    }
    const chunkConv = chunkConversations.find(conv => conv.id === activeConversationId);
    return chunkConv ? {
      type: 'chunk',
      ...chunkConv
    } : null;
  }, [activeConversationId, mainConversationId, chunkConversations]);

  // Loading state
  if (!mainConversationId) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-doc-content-bg border border-doc-content-border rounded-lg shadow-sm">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-4 pb-0">
        <button
          onClick={() => onConversationChange(mainConversationId)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeConversationId === mainConversationId
              ? 'bg-tab-active-bg text-tab-active-text font-medium shadow-sm'
              : 'bg-tab-inactive-bg text-tab-inactive-text hover:bg-tab-hover-bg'
          }`}
        >
          Main
        </button>
        {chunkConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onConversationChange(conv.id)}
            className={`px-4 py-2 rounded-lg transition-colors max-w-[200px] truncate ${
              activeConversationId === conv.id
                ? 'bg-tab-active-bg text-tab-active-text font-medium shadow-sm'
                : 'bg-tab-inactive-bg text-tab-inactive-text hover:bg-tab-hover-bg'
            }`}
            title={conv.highlightText}
          >
            {conv.highlightText.substring(0, 20)}...
          </button>
        ))}
      </div>

      <div className="px-4">
        <div className="border-b border-doc-content-border w-full" />
      </div>

      {/* Error message */}
      {mainError && (
        <div className="mx-4 mt-4">
          <div className="text-error p-3 bg-error/10 rounded-lg text-center">
            {mainError}
          </div>
        </div>
      )}

      {/* Active conversation */}
      <div className="flex-1 p-4 pt-4 overflow-hidden">
        {activeConversation?.type === 'main' ? (
          <MainConversation
            documentId={documentId}
            currentChunkId={currentSequence}
            conversationId={mainConversationId}
          />
        ) : activeConversation ? (
          <ChunkConversation
            documentId={documentId}
            chunkId={currentSequence}
            conversationId={activeConversation.id}
            highlightText={activeConversation.highlightText}
          />
        ) : null}
      </div>
    </div>
  );
}