'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionButtonProps {
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

const QuestionButton: React.FC<QuestionButtonProps> = ({ question, onClick, disabled }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "group relative w-full px-4 py-3 rounded-xl",
      "bg-gradient-to-r from-purple-500/10 to-indigo-500/10",
      "border border-purple-500/20 hover:border-purple-500/40",
      "text-left",
      "overflow-hidden transition-all duration-300",
      "hover:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)]",
      "hover:drop-shadow-lg"
    )}
  >
    {/* Gradient overlay on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20" />
    </div>
    
    {/* Glow effect */}
    <div className="absolute -inset-px bg-gradient-to-r from-purple-500/30 to-indigo-500/30 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300" />
    
    {/* Content */}
    <div className="relative flex items-center gap-3">
      <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
      <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
        {question}
      </span>
    </div>
  </motion.button>
);

export default QuestionButton;