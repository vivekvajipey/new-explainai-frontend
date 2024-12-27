import { useState } from 'react';
import { Send } from 'lucide-react';
import { MessageInputProps } from './types';

export function MessageInput({
  onSendMessage,
  isStreaming,
  placeholder,
  disabled = false
}: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (content: string) => {
    await onSendMessage(content);
    setInput('');
  };

  return (
    <div className="border-t border-doc-content-border p-4 bg-doc-content-bg rounded-b-lg">
      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(input)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 rounded-lg 
                   bg-input-bg text-input-text border border-input-border
                   focus:outline-none focus:ring-2 focus:ring-input-focus
                   disabled:opacity-50 transition-colors"
          disabled={isStreaming || disabled}
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={isStreaming || disabled || !input.trim()}
          className={`p-2 rounded-lg transition-colors ${
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