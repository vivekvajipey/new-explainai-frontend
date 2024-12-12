import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';
import { MessageSendCompleted, MessageSendError } from '@/lib/websocket/types';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BaseConversationProps {
  documentId: string;
  websocket: ConversationWebSocket;
  onInitialize: (ws: ConversationWebSocket) => Promise<string>;
  onSendMessage: (ws: ConversationWebSocket, content: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export default function BaseConversation({ 
  documentId,
  websocket,
  onInitialize,
  onSendMessage,
  placeholder = 'Type a message...',
  className = ''
}: BaseConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize using provided method
        const newConversationId = await onInitialize(websocket);
        setConversationId(newConversationId);

        // Set up message handlers
        websocket.onMessage<MessageSendCompleted>(
          'conversation.message.send.completed', 
          (data) => {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.message,
              timestamp: new Date().toISOString()
            }]);
            setIsLoading(false);
          }
        );

        websocket.onMessage<MessageSendError>(
          'conversation.message.send.error', 
          (error) => {
            setError(error.message || 'Failed to send message');
            setIsLoading(false);
          }
        );

        // Try to fetch existing messages
        try {
          const messagesResponse = await websocket.getMessages(newConversationId);
          if (messagesResponse?.messages?.length > 0) {
            // Filter out system messages and convert to Message format
            const filteredMessages = messagesResponse.messages
              .filter(msg => msg.role !== 'system')
              .map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: msg.timestamp
              }));
            setMessages(filteredMessages);
          }
        } catch (err) {
          // Don't show error for missing messages, it's a normal state
          console.log('No existing messages, suppressing error:', err);
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        setError('Failed to initialize conversation');
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [documentId, onInitialize, websocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setIsLoading(true);
      setError(null);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      await onSendMessage(websocket, content);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[500px] bg-white dark:bg-earth-800 rounded-lg shadow-sm ${className}`}>
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
                  ? 'bg-earth-100 dark:bg-earth-700'
                  : 'bg-earth-50 dark:bg-earth-600'
              }`}
            >
              <p className="text-earth-900 dark:text-earth-50">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-earth-50 dark:bg-earth-600 rounded-lg p-3">
              <div className="animate-pulse">Thinking...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center p-2">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t border-earth-200 dark:border-earth-700 p-4">
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
            className="flex-1 px-4 py-2 rounded-lg border border-earth-200 dark:border-earth-600 
                     bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-50
                     focus:outline-none focus:ring-2 focus:ring-earth-500"
            disabled={isLoading || !conversationId}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !conversationId || !input.trim()}
            className={`p-2 rounded-lg ${
              isLoading || !conversationId || !input.trim()
                ? 'bg-earth-300 cursor-not-allowed'
                : 'bg-earth-600 hover:bg-earth-700'
            } text-white`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 