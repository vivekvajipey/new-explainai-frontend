import { ChevronLeft, ChevronRight } from "lucide-react";

// src/components/document/DocumentHeader.tsx
interface DocumentHeaderProps {
  title: string;
  currentChunk: number;
  totalChunks: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function DocumentHeader({
  title,
  currentChunk,
  totalChunks,
  onPrevious,
  onNext,
}: DocumentHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2 text-doc-title">{title}</h1>
      <div className="flex items-center justify-between">
        <p className="text-doc-subtitle">
          Chunk {currentChunk} of {totalChunks}
        </p>
        <div className="flex items-center space-x-2">
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
        </div>
      </div>
    </div>
  );
}