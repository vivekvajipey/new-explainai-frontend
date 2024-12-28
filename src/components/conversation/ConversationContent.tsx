import { ActiveConversationType } from "./types";
import MainConversation from "./MainConversation";
import ChunkConversation from "./ChunkConversation";

interface ConversationContentProps {
  activeConversation: ActiveConversationType | null;
  currentSequence: string;
  documentId: string;
}

export function ConversationContent({
  activeConversation,
  currentSequence,
  documentId,
}: ConversationContentProps) {
  if (!activeConversation) return null;

  return (
    <div className="flex-1 overflow-hidden">
      {activeConversation.type === 'main' ? (
        <MainConversation
          conversationId={activeConversation.id}
          currentChunkId={currentSequence}
          documentId={documentId}
        />
      ) : (
        <ChunkConversation
          conversationId={activeConversation.id}
          highlightText={activeConversation.highlightText}
          chunkId={activeConversation.chunkId}
          documentId={documentId}
        />
      )}
    </div>
  );
}
