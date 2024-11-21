'use client';

import { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{
    start: number;
    end: number;
    text: string;
    conversationId: string;
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

  const getTextNodePosition = (node: Node, offset: number): number => {
    let position = 0;
    const walker = document.createTreeWalker(
      containerRef.current!,
      NodeFilter.SHOW_TEXT,
      null
    );

    let currentNode = walker.nextNode();
    while (currentNode && currentNode !== node) {
      position += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }

    return position + offset;
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim();
    if (!text || !containerRef.current?.contains(range.commonAncestorContainer)) {
      setSelectedText(null);
      return;
    }

    // Calculate absolute positions in the content
    const start = getTextNodePosition(range.startContainer, range.startOffset);
    const end = getTextNodePosition(range.endContainer, range.endOffset);

    // Verify the selection is within our content
    if (start >= 0 && end <= content.length && start < end) {
      setSelectedText({ text, start, end });
    }
  };

  const handleCreateChat = () => {
    if (selectedText) {
      onHighlight(selectedText.start, selectedText.end, selectedText.text);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const renderHighlightedContent = () => {
    let lastIndex = 0;
    const parts = [];
    const sortedRanges = [...highlightedRanges].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      
      // Add non-highlighted text before this range
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="select-text">
            {content.slice(lastIndex, range.start)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <span
          key={`highlight-${range.start}-${range.conversationId}`}
          className={cn(
            "bg-yellow-500/20 cursor-pointer transition-colors relative group",
            hoveredHighlight === range.conversationId && "bg-yellow-500/30"
          )}
          onClick={() => onHighlightClick?.(range.conversationId)}
          onMouseEnter={() => setHoveredHighlight(range.conversationId)}
          onMouseLeave={() => setHoveredHighlight(null)}
        >
          {content.slice(range.start, range.end)}
          <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
            <MessageCircle className="w-4 h-4" />
          </span>
        </span>
      );

      lastIndex = range.end;
    }

    // Add remaining text
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
    <div className="relative">
      <div ref={containerRef} className="text-lg leading-relaxed" onMouseUp={handleMouseUp}>
        {renderHighlightedContent()}
      </div>
      
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <span className="text-sm">Start a conversation about this text?</span>
            <button
              onClick={handleCreateChat}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              Start Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}