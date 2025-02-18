import { useActiveConversation } from "@/hooks/useActiveConversation";
import { ConversationTabList } from "./ConversationTabList";
import { ConversationContent } from "./ConversationContent";

interface ConversationContainerProps {
  documentId: string;
  currentSequence: string;
  activeConversationId: string | null;
  onConversationChange: (id: string | null) => void;
  mainConversationId: string;
  mainError?: string | null;
  chunkConversations: {
    id: string;
    highlightText: string;
    chunkId: string;
  }[];
}

export function ConversationContainer({
  documentId,
  currentSequence,
  activeConversationId,
  onConversationChange,
  mainConversationId,
  mainError,
  chunkConversations
}: ConversationContainerProps) {
  const activeConversation = useActiveConversation(
    activeConversationId,
    mainConversationId,
    chunkConversations
  );

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] bg-doc-content-bg border border-doc-content-border rounded-lg shadow-sm">
      <ConversationTabList
        mainConversationId={mainConversationId}
        chunkConversations={chunkConversations}
        activeConversationId={activeConversationId}
        onConversationChange={onConversationChange}
      />
      
      {mainError && (
        <div className="mx-4 mt-4">
          <div className="text-error p-3 bg-error/10 rounded-lg text-center">
            {mainError}
          </div>
        </div>
      )}

      <ConversationContent
        activeConversation={activeConversation}
        currentSequence={currentSequence}
        documentId={documentId}
      />
    </div>
  );
}