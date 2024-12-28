import { useChunkConversations } from "@/hooks/useChunkConversation";
import { useMainConversation } from "@/hooks/useMainConversation";
import { useActiveConversation } from "@/hooks/useActiveConversation";
import { ConversationTabList } from "./ConversationTabList";
import { ConversationContent } from "./ConversationContent";

interface ConversationContainerProps {
  documentId: string;
  currentSequence: string;
}

export function ConversationContainer({
  documentId,
  currentSequence,
}: ConversationContainerProps) {
  const { mainConversationId, error: mainError } = useMainConversation(documentId);
  const { chunkConversations } = useChunkConversations(currentSequence);
  
  const {
    activeConversationId,
    activeConversation,
    setActiveConversationId
  } = useActiveConversation(mainConversationId, chunkConversations);

  // Loading state
  if (!mainConversationId) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-doc-content-bg border border-doc-content-border rounded-lg shadow-sm">
      <ConversationTabList
        mainConversationId={mainConversationId}
        chunkConversations={chunkConversations}
        activeConversationId={activeConversationId}
        onConversationChange={setActiveConversationId}
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