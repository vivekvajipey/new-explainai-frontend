'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

const QuestionLoader: React.FC = () => (
  <div className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-800/50">
    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
    <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
      Generating suggested questions...
    </span>
  </div>
);

export default QuestionLoader;