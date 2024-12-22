// src/components/document/DocumentContent.tsx
import React, { useState, useCallback, useMemo, ReactElement } from 'react';
import { useConversationStore } from '@/stores/conversationStores';
import { SelectionTooltip } from './SelectionTooltip';

interface DocumentContentProps {
  content: string;
  chunkId: string;
  onHighlightClick: (conversationId: string) => void;
  onCreateHighlight: (text: string, range: { start: number; end: number }) => void;
}

export function DocumentContent({ 
  content, 
  chunkId, 
  onHighlightClick,
  onCreateHighlight 
}: DocumentContentProps) {
  const highlights = useConversationStore(state => state.getHighlightsForChunk(chunkId));
  const [selection, setSelection] = useState<{
    text: string;
    range: { start: number; end: number };
    position: { x: number; y: number };
  } | null>(null);

  const handleTextSelection = useCallback(() => {
    const selected = window.getSelection();
    if (!selected || selected.toString().trim().length === 0) {
      setSelection(null);
      return;
    }

    const range = selected.getRangeAt(0);
    const startSpan = range.startContainer.parentElement;
    const startIndex = startSpan?.getAttribute('data-index');
    
    if (!startIndex) return;

    const startOffset = parseInt(startIndex) + range.startOffset;
    const selectedContent = selected.toString().trim();
    const rect = range.getBoundingClientRect();

    setSelection({
      text: selectedContent,
      range: {
        start: startOffset,
        end: startOffset + selectedContent.length
      },
      position: {
        x: rect.right + 10,
        y: rect.top
      }
    });
  }, []);

  const renderedContent = useMemo(() => {
    let lastIndex = 0;
    const elements: ReactElement[] = [];
    
    highlights.forEach((highlight) => {
      if (highlight.startOffset > lastIndex) {
        elements.push(
          <span
            key={`text-${lastIndex}`}
            className="text-doc-text"
            data-index={lastIndex}
          >
            {content.slice(lastIndex, highlight.startOffset)}
          </span>
        );
      }

      elements.push(
        <span
          key={highlight.id}
          className="bg-doc-highlight-bg border border-doc-highlight-border text-doc-highlight-text 
                   group cursor-pointer transition-colors"
          onClick={() => onHighlightClick(highlight.conversationId)}
          data-index={highlight.startOffset}
        >
          {content.slice(highlight.startOffset, highlight.endOffset)}
          <span className="invisible group-hover:visible absolute -top-6 left-1/2 
                         -translate-x-1/2 bg-tooltip-bg text-tooltip-text border border-tooltip-border
                         px-2 py-1 rounded text-sm whitespace-nowrap shadow-sm">
            Click to open chat
          </span>
        </span>
      );

      lastIndex = highlight.endOffset;
    });

    if (lastIndex < content.length) {
      elements.push(
        <span
          key="text-end"
          className="text-doc-text"
          data-index={lastIndex}
        >
          {content.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  }, [content, highlights, onHighlightClick]);

  return (
    <div className="bg-doc-bg">
      <div 
        className="prose max-w-none p-6"
        onMouseUp={handleTextSelection}
      >
        <pre className="whitespace-pre-wrap font-palatino text-doc-text bg-transparent m-0 p-0">
          {renderedContent}
        </pre>
      </div>
      
      <SelectionTooltip
        position={selection?.position ?? null}
        onChatClick={() => {
          if (selection) {
            onCreateHighlight(selection.text, selection.range);
            setSelection(null);
          }
        }}
      />
    </div>
  );
}