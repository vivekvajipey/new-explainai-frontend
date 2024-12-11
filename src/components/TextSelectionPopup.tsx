import { useState, useEffect } from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface TextSelectionPopupProps {
  onCreateDiscussion: (text: string, range: { start: number; end: number }) => void;
}

export default function TextSelectionPopup({ onCreateDiscussion }: TextSelectionPopupProps) {
  const [selection, setSelection] = useState<{
    text: string;
    range: { start: number; end: number };
    position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selected = window.getSelection();
      if (!selected || !selected.toString().trim()) {
        setSelection(null);
        return;
      }

      const range = selected.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelection({
        text: selected.toString().trim(),
        range: {
          start: range.startOffset,
          end: range.endOffset
        },
        position: {
          x: rect.left + (rect.width / 2),
          y: rect.top - 10
        }
      });
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  if (!selection) return null;

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
      style={{ left: selection.position.x, top: selection.position.y }}
    >
      <button
        onClick={() => {
          onCreateDiscussion(selection.text, selection.range);
          setSelection(null);
        }}
        className="flex items-center space-x-2 px-3 py-2 bg-earth-600 hover:bg-earth-700 
                   text-white rounded-lg shadow-lg transition-colors"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Discuss this</span>
      </button>
    </div>
  );
} 