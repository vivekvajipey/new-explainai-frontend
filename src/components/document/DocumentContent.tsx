import { useState, useCallback, useMemo, ReactElement } from "react";
import { SelectionTooltip } from "./SelectionTooltip";
import { Highlight } from "./types";

interface DocumentContentProps {
  content: string;
  highlights: Highlight[];
  onCreateHighlight: (text: string, range: { start: number; end: number }) => void;
  onHighlightClick: (conversationId: string) => void;
}

export function DocumentContent({
  content,
  highlights,
  onCreateHighlight,
  onHighlightClick,
}: DocumentContentProps) {
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

    // Sort highlights by startOffset to ensure correct rendering order
    const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);

    sortedHighlights.forEach((highlight) => {
      // Ensure we don't have negative indices
      const startOffset = Math.max(0, highlight.startOffset);
      const endOffset = Math.min(content.length, highlight.endOffset);

      if (startOffset > lastIndex) {
        elements.push(
          <span
            key={`text-${lastIndex}`}
            className="text-doc-text"
            data-index={lastIndex}
          >
            {content.slice(lastIndex, startOffset)}
          </span>
        );
      }

      elements.push(
        <span
          key={highlight.id}
          className="bg-doc-highlight-bg border border-doc-highlight-border text-doc-highlight-text
            group cursor-pointer transition-colors"
          onClick={() => onHighlightClick(highlight.conversationId)}
          data-index={startOffset}
        >
          {content.slice(startOffset, endOffset)}
          <span className="invisible group-hover:visible absolute -top-6 left-1/2
            -translate-x-1/2 bg-tooltip-bg text-tooltip-text border border-tooltip-border
            px-2 py-1 rounded text-sm whitespace-nowrap shadow-sm">
            Click to open chat
          </span>
        </span>
      );

      lastIndex = endOffset;
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
    <div className="flex-1 overflow-y-auto">
      <div className="highlight-instruction text-sm text-gray-500 px-6 pt-2 italic">
        Pro tip: Select any text to start a focused conversation
      </div>
      <div
        className="prose max-w-none p-6 h-full highlighting-area"
        onMouseUp={handleTextSelection}
      >
        <div className="text-doc-text bg-transparent m-0 p-0 font-serif leading-relaxed text-justify text-lg">
          {renderedContent}
          <style jsx global>{`
            .text-doc-text {
              text-align: justify;
              hyphens: auto;
              line-height: 1.8;
              letter-spacing: -0.003em;
            }
            
            .prose p {
              margin: 1.5em 0;
            }

            @media (min-width: 768px) {
              .text-doc-text {
                font-size: 1.125rem;
              }
            }
          `}</style>
        </div>
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