import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { MessageInputProps } from './types';

export function MessageInput({
  onSendMessage,
  isStreaming,
  placeholder,
  disabled = false
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to match the content
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSubmit = async (content: string) => {
    if (!content.trim()) return;
    await onSendMessage(content);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Let the newline happen naturally
        return;
      } else {
        e.preventDefault();
        handleSubmit(input);
      }
    }
  };

  return (
    <div className="border-t border-doc-content-border p-4 bg-doc-content-bg rounded-b-lg">
      <div className="flex space-x-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 px-4 py-2 rounded-lg 
                   bg-input-bg text-input-text border border-input-border
                   focus:outline-none focus:ring-2 focus:ring-input-focus
                   disabled:opacity-50 transition-colors
                   resize-none min-h-[40px] max-h-[200px]"
          disabled={isStreaming || disabled}
          style={{ overflowY: 'auto' }}
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={isStreaming || disabled || !input.trim()}
          className={`p-2 rounded-lg transition-colors self-end ${
            isStreaming || disabled || !input.trim()
              ? 'bg-button-secondary-bg text-button-secondary-text cursor-not-allowed'
              : 'bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}