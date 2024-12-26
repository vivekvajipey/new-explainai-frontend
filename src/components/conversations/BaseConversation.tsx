import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/stores/conversationStores';
import { useConversationStreaming } from '@/hooks/useConversationStreaming';

interface MessageSendConfig {
  type: 'main' | 'highlight';
  chunkId: string;
  highlightText?: string;
}

interface BaseConversationProps {
  conversationId: string;
  messageSendConfig: MessageSendConfig;
  placeholder?: string;
  className?: string;
}

export default function BaseConversation({ 
  conversationId,
  messageSendConfig,
  placeholder = 'Type a message...',
  className = '',
}: BaseConversationProps) {
  const { conversationSocket } = useSocket();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const messages = useConversationStore((state) => {
    return conversationId ? state.getMessages(conversationId) : [];
  });
  const addMessage = useConversationStore(state => state.addMessage);

  const { streamingState, handleStreamingMessage } = useConversationStreaming(
    conversationId,
    addMessage,
    conversationSocket
  );

  const sendMessage = async (content: string) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }
  
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
  
    try {
      setError(null);
      setInput('');
      
      addMessage(conversationId, userMessage);
      await handleStreamingMessage(content, messageSendConfig);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  return (
    <div className={`flex flex-col h-[500px] ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.role === 'user'
                  ? 'bg-message-user-bg text-message-user-text'
                  : 'bg-message-ai-bg text-message-ai-text'
              }`}
            >
              <p className="whitespace-pre-wrap">
                {message.id === streamingState.id && streamingState.isStreaming
                  ? streamingState.content
                  : message.content}
              </p>
            </div>
          </div>
        ))}
        {error && (
          <div className="text-error p-3 bg-error/10 rounded-lg text-center">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t border-doc-content-border p-4 bg-doc-content-bg rounded-b-lg">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={
              !conversationId 
                ? 'Initializing conversation...' 
                : placeholder
            }
            className="flex-1 px-4 py-2 rounded-lg 
                     bg-input-bg text-input-text border border-input-border
                     focus:outline-none focus:ring-2 focus:ring-input-focus
                     disabled:opacity-50 transition-colors"
            disabled={streamingState.isStreaming || !conversationId}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={streamingState.isStreaming || !conversationId || !input.trim()}
            className={`p-2 rounded-lg transition-colors ${
              streamingState.isStreaming || !conversationId || !input.trim()
                ? 'bg-button-secondary-bg text-button-secondary-text cursor-not-allowed'
                : 'bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}