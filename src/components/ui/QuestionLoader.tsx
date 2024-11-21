'use client';

import { Loader2 } from 'lucide-react';

export default function QuestionLoader() {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      <span className="text-sm text-gray-400">Generating questions...</span>
    </div>
  );
}