'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ConversationWebSocket } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChunkConversationProps {
  documentId: string;
  chunkId: string;
}

export default function ChunkConversation({ documentId, chunkId }: ChunkConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const websocketRef = useRef<ConversationWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializeConversation = async () => {
      try {
        // Clean up existing connection
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }

        setIsLoading(true);
        setConversationId(null);
        setError(null);
        setMessages([]);

        // Create new WebSocket connection
        console.log('Initializing WebSocket for document:', documentId);
        const ws = new ConversationWebSocket(documentId);
        websocketRef.current = ws;

        // Set up message handlers
        ws.onMessage('conversation.main.create.completed', (data) => {
          console.log('Conversation created:', data);
          if (data && data.conversation_id) {
            setConversationId(data.conversation_id);
            setIsLoading(false);
            setError(null);
          } else {
            setError('Failed to create conversation');
            setIsLoading(false);
          }
        });

        ws.onMessage('conversation.main.create.error', (data) => {
          console.error('Failed to create conversation:', data);
          setError(data.error || 'Failed to create conversation');
          setIsLoading(false);
        });

        ws.onMessage('conversation.message.send.completed', (data) => {
          console.log('Received message:', data);
          if (data && data.content) {
            setMessages(prev => [...prev, {
              id: data.message_id || Date.now().toString(),
              role: 'assistant',
              content: data.content,
              timestamp: new Date().toISOString()
            }]);
            setIsLoading(false);
          } else {
            setError('Failed to receive message');
            setIsLoading(false);
          }
        });

        // Create the conversation with timeout
        timeoutId = setTimeout(() => {
          if (!conversationId) {
            setError('Conversation creation timed out');
            setIsLoading(false);
          }
        }, 10000);

        // Send conversation creation request
        console.log('Creating conversation with chunk:', chunkId);
        await ws.send('conversation.main.create', { 
          chunk_id: chunkId
        });

      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        setError('Failed to connect to conversation server');
        setIsLoading(false);
      }
    };

    initializeConversation();

    return () => {
      clearTimeout(timeoutId);
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [documentId, chunkId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading || !websocketRef.current) return;

    setIsLoading(true);
    const messageContent = input.trim();
    setInput('');

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: messageContent,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      await websocketRef.current.send('conversation.message.send', {
        conversation_id: conversationId,
        content: messageContent
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white dark:bg-earth-800 rounded-lg shadow-sm">
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder={
              !conversationId 
                ? 'Initializing conversation...' 
                : 'Ask a question about this section...'
            }
            className="flex-1 px-4 py-2 rounded-lg border border-earth-200 dark:border-earth-600 
                     bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-50
                     focus:outline-none focus:ring-2 focus:ring-earth-500"
            disabled={isLoading || !conversationId}
          />
          <button
            onClick={handleSendMessage}
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
