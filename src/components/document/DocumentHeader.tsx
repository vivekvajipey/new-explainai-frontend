import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen } from "lucide-react";

// src/components/document/DocumentHeader.tsx
interface DocumentHeaderProps {
  title: string;
  currentChunk: number;
  totalChunks: number;
  onPrevious: () => void;
  onNext: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function DocumentHeader({
  title,
  currentChunk,
  totalChunks,
  onPrevious,
  onNext,
  isCollapsed,
  onToggleCollapse,
}: DocumentHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2 text-doc-title">{title}</h1>
      <div className="flex items-center justify-between">
        <p className="text-doc-subtitle">
          Page {currentChunk} of {totalChunks}
        </p>
        <div className="flex items-center space-x-2 document-navigation">
          <button
            onClick={onPrevious}
            disabled={currentChunk === 1}
            className={`p-2 rounded-lg transition-colors ${
              currentChunk === 1
                ? 'text-doc-nav-button-disabled cursor-not-allowed'
                : 'text-doc-nav-button hover:bg-doc-nav-button-hover'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Chunk Changing */}
          <button
            onClick={onNext}
            disabled={currentChunk === totalChunks}
            className={`p-2 rounded-lg transition-colors ${
              currentChunk === totalChunks
                ? 'text-doc-nav-button-disabled cursor-not-allowed'
                : 'text-doc-nav-button hover:bg-doc-nav-button-hover'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Conversation Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg transition-colors text-doc-nav-button hover:bg-doc-nav-button-hover"
          >
            {isCollapsed ? (
              <PanelRightOpen className="w-5 h-5" />
            ) : (
              <PanelRightClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}