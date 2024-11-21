'use client';

import { useDocument } from '@/context/DocumentContext';
import HighlightableText from './HighlightableText';
import ChunkChatList from './ChunkChatList';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChunkViewer() {
  const { state, setActiveChunk, createChunkConversation, toggleConversation } = useDocument();
  const chunks = Array.from(state.chunks.values());
  const currentChunk = state.activeChunkId ? state.chunks.get(state.activeChunkId) : null;

  const handleNext = () => {
    if (!state.activeChunkId) return;
    const currentIndex = chunks.findIndex(c => c.chunk.id === state.activeChunkId);
    if (currentIndex < chunks.length - 1) {
      setActiveChunk(chunks[currentIndex + 1].chunk.id);
    }
  };

  const handlePrev = () => {
    if (!state.activeChunkId) return;
    const currentIndex = chunks.findIndex(c => c.chunk.id === state.activeChunkId);
    if (currentIndex > 0) {
      setActiveChunk(chunks[currentIndex - 1].chunk.id);
    }
  };

  const handleHighlight = async (start: number, end: number, text: string) => {
    if (!state.activeChunkId) return;
    await createChunkConversation(state.activeChunkId, [start, end], text);
  };

  const handleHighlightClick = (conversationId: string) => {
    if (!state.activeChunkId) return;
    toggleConversation(state.activeChunkId, conversationId);
  };

  if (!currentChunk) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">
        <p>No chunk selected</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="document-pane"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handlePrev}
            disabled={chunks[0]?.chunk.id === state.activeChunkId}
            className={cn(
              "nav-button",
              "group transition-all",
              chunks[0]?.chunk.id === state.activeChunkId && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Chunk {chunks.findIndex(c => c.chunk.id === state.activeChunkId) + 1} of{' '}
            {chunks.length}
          </span>
          <button
            onClick={handleNext}
            disabled={chunks[chunks.length - 1]?.chunk.id === state.activeChunkId}
            className={cn(
              "nav-button",
              "group transition-all",
              chunks[chunks.length - 1]?.chunk.id === state.activeChunkId && "opacity-50 cursor-not-allowed"
            )}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <HighlightableText 
              content={currentChunk.chunk.content}
              onHighlight={handleHighlight}
              onHighlightClick={handleHighlightClick}
              conversations={currentChunk.conversations}
            />
          </motion.div>
        </div>
      </div>
      <ChunkChatList chunkId={state.activeChunkId} />
    </motion.div>
  );
}