// components/document/SelectionTooltip.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface SelectionTooltipProps {
  position: { x: number; y: number } | null;
  onChatClick: () => void;
}

export const SelectionTooltip: React.FC<SelectionTooltipProps> = ({ position, onChatClick }) => {
  if (!position) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed z-50 bg-gray-800 rounded-lg shadow-xl border border-purple-500"
      style={{ 
        left: position.x,
        top: position.y,
        transform: 'translate(0, -50%)',
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChatClick();
        }}
        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors text-sm text-white whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span>Chat about this</span>
      </button>
    </motion.div>
  );
};