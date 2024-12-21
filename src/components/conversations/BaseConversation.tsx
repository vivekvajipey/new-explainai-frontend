import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useConversationStore } from '@/stores/conversationStores';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BaseConversationProps {
  documentId: string;
  conversationId: string;
  placeholder?: string;
  className?: string;
  streamingMessageId?: string;
  isStreaming?: boolean;
  onSendMessage: (
    content: string, 
    conversationId: string, 
    setStreamingContent: (content: string) => void
  ) => Promise<{ message: string }>;
}

export default function BaseConversation({ 
  documentId,
  conversationId,
  onSendMessage,
  placeholder = 'Type a message...',
  className = '',
  streamingMessageId,
  isStreaming = false,
}: BaseConversationProps) {
  const { conversationSocket } = useSocket();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');

  console.log("[DEBUG] BaseConversation rendering with conversationId =", conversationId);
  const messages = useConversationStore((state) => {
    console.log("[DEBUG] useConversationStore selector running for conversationId =", conversationId);
    return conversationId ? state.getMessages(conversationId) : [];
  });
  console.log("[DEBUG] BaseConversation got messages.length =", messages.length);
  console.log("documentId =", documentId);
  const addMessage = useConversationStore(state => state.addMessage);
  // const setMessages = useConversationStore(state => state.setMessages);
  // const removeMessage = useConversationStore(state => state.removeMessage);

  useEffect(() => {
    console.log("[DEBUG] BaseConversation.useEffect triggered", {
      conversationId,
      // documentId,
      conversationSocket: !!conversationSocket,
    });
  }, [conversationSocket, conversationId]);

  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [messages]);

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
      setStreamingContent('');

      if (!conversationSocket?.isConnected) {
        throw new Error('WebSocket is not connected');
      }

      addMessage(conversationId, userMessage);

      await onSendMessage(content, conversationId, setStreamingContent);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };
  

  return (
    <div className={`flex flex-col h-[500px] bg-[var(--primary-300)] dark:bg-[var(--primary-800)] rounded-lg shadow-sm ${className}`}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-[var(--primary-100)] dark:bg-[var(--primary-700)]'
                  : 'bg-[var(--primary-50)] dark:bg-[var(--primary-600)]'
              }`}
            >
              <p className="text-[var(--primary-900)] dark:text-[var(--primary-50)]">
                {message.id === streamingMessageId && isStreaming
                  ? streamingContent
                  : message.content}
              </p>
            </div>
          </div>
        ))}
        {error && (
          <div className="text-red-500 text-center p-2">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t border-[var(--primary-200)] dark:border-[var(--primary-700)] p-4">
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
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--primary-200)] dark:border-[var(--primary-600)] 
                     bg-[var(--primary-50)] dark:bg-[var(--primary-700)] text-[var(--primary-900)] dark:text-[var(--primary-50)]
                     focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            disabled={isStreaming || !conversationId}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !conversationId || !input.trim()}
            className={`p-2 rounded-lg ${
              isStreaming || !conversationId || !input.trim()
                ? 'bg-[var(--primary-300)] cursor-not-allowed'
                : 'bg-[var(--primary-600)] hover:bg-[var(--primary-700)]'
            } text-white`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}