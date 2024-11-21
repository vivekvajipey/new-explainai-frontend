// components/ChunkViewer/HighlightableText.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChunkConversation } from '@/interfaces/document';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface HighlightableTextProps {
  content: string;
  onHighlight: (start: number, end: number, text: string) => void;
  conversations?: ChunkConversation[];
  onHighlightClick?: (conversationId: string) => void;
}

export default function HighlightableText({ 
  content, 
  onHighlight,
  conversations = [],
  onHighlightClick
}: HighlightableTextProps) {
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{
    start: number;
    end: number;
    text: string;
    conversationId?: string;
  }>>([]);
  const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);

  // Initialize highlighted ranges from conversations
  useEffect(() => {
    const ranges = conversations.map(conv => ({
      start: conv.highlightRange[0],
      end: conv.highlightRange[1],
      text: content.slice(conv.highlightRange[0], conv.highlightRange[1]),
      conversationId: conv.id
    }));
    setHighlightedRanges(ranges);
  }, [conversations, content]);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text) {
      setSelectedText(null);
      return;
    }

    // Get the text content and its position
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(range.startContainer.parentElement!);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + text.length;

    console.log('Selected text:', { text, start, end }); // Debug log
    setSelectedText({ text, start, end });
  };

  const handleCreateChat = () => {
    if (selectedText) {
      console.log('Creating chat with:', selectedText); // Debug log
      onHighlight(selectedText.start, selectedText.end, selectedText.text);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderHighlightedContent = () => {
    let lastIndex = 0;
    const parts = [];
    const sortedRanges = [...highlightedRanges].sort((a, b) => a.start - b.start);

    // Add the initial text if there are no highlights at the start
    if (sortedRanges.length === 0 || sortedRanges[0].start > 0) {
      parts.push(
        <span key="text-start" className="select-text">
          {content.slice(0, sortedRanges[0]?.start ?? content.length)}
        </span>
      );
      lastIndex = sortedRanges[0]?.start ?? content.length;
    }

    for (const range of sortedRanges) {
      // Add non-highlighted text before this range
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="select-text">
            {content.slice(lastIndex, range.start)}
          </span>
        );
      }

      // Add highlighted text with hover effect
      parts.push(
        <motion.span
          key={`highlight-${range.start}`}
          className={cn(
            "relative inline-block cursor-pointer select-text transition-all",
            range.conversationId === hoveredHighlight
              ? "bg-yellow-300/50 dark:bg-yellow-300/30"
              : "bg-yellow-200/40 dark:bg-yellow-200/20"
          )}
          onMouseEnter={() => setHoveredHighlight(range.conversationId)}
          onMouseLeave={() => setHoveredHighlight(null)}
          onClick={() => range.conversationId && onHighlightClick?.(range.conversationId)}
          whileHover={{ scale: 1.02 }}
        >
          {content.slice(range.start, range.end)}
          {range.conversationId === hoveredHighlight && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                        bg-gray-900 text-white px-2 py-1 rounded text-sm flex items-center gap-1
                        shadow-lg"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Click to chat</span>
            </motion.div>
          )}
        </motion.span>
      );

      lastIndex = range.end;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="select-text">
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div 
      className="prose prose-gray dark:prose-invert max-w-none p-4 relative select-text"
      onMouseUp={handleMouseUp}
    >
      {renderHighlightedContent()}
      
      {/* Chat button that appears when text is selected */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50
                     bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg
                     flex items-center gap-2 cursor-pointer hover:bg-purple-500
                     transition-colors"
            onClick={handleCreateChat}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat about this selection</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}