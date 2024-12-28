import { RawChunkConversation } from "@/hooks/useActiveConversation";

interface ConversationTabListProps {
  mainConversationId: string;
  chunkConversations: RawChunkConversation[];
  activeConversationId: string | null;
  onConversationChange: (conversationId: string) => void;
}

export function ConversationTabList({
  mainConversationId,
  chunkConversations,
  activeConversationId,
  onConversationChange,
}: ConversationTabListProps) {
  return (
    <>
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
    </>
  );
}
