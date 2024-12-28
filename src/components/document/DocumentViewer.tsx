// components/document/DocumentViewer.tsx

import { DocumentContent } from "./DocumentContent";
import { DocumentHeader } from "./DocumentHeader";
import { DocumentChunk, Highlight } from "./types";


interface DocumentViewerProps {
  chunk: DocumentChunk;
  highlights: Highlight[];
  onCreateHighlight: (text: string, range: { start: number; end: number }) => void;
  onHighlightClick: (conversationId: string) => void;
  onChunkChange: (index: number) => void;
  currentChunkIndex: number;
  totalChunks: number;
  documentTitle: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function DocumentViewer({
  chunk,
  highlights,
  onCreateHighlight,
  onHighlightClick,
  onChunkChange,
  currentChunkIndex,
  totalChunks,
  documentTitle,
  isCollapsed,
  onToggleCollapse
}: DocumentViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <DocumentHeader
        title={documentTitle}
        currentChunk={currentChunkIndex + 1}
        totalChunks={totalChunks}
        onPrevious={() => onChunkChange(currentChunkIndex - 1)}
        onNext={() => onChunkChange(currentChunkIndex + 1)}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
      <DocumentContent
        content={chunk.content}
        highlights={highlights}
        onCreateHighlight={onCreateHighlight}
        onHighlightClick={onHighlightClick}
      />
    </div>
  );
}