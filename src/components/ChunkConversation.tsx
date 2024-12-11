'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ConversationWebSocket } from '@/lib/websocket/ConversationWebSocket';

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
    const initializeConversation = async () => {
      try {
        // Clean up existing connection
        if (websocketRef.current) {
          websocketRef.current.close();
          websocketRef.current = null;
        }

        setIsLoading(true);
        setError(null);

        // Create new WebSocket connection
        const ws = new ConversationWebSocket(documentId);
        websocketRef.current = ws;

        // Create main conversation
        const newConversationId = await ws.createMainConversation();
        setConversationId(newConversationId);

        // Set up message handlers
        ws.onMessage('conversation.message.send.completed', (data: { message: string }) => {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString()
          }]);
          setIsLoading(false);
        });

        // Handle errors
        ws.onMessage('conversation.message.send.error', (error: { message: string }) => {
          setError(error.message || 'Failed to send message');
          setIsLoading(false);
        });

        // Try to fetch existing messages, but don't block on it
        ws.getMessages(newConversationId)
          .then(messagesResponse => {
            if (messagesResponse?.messages?.length > 0) {
              setMessages(messagesResponse.messages.map(msg => ({
                id: msg.id,
                role: msg.role === 'system' ? 'assistant' : msg.role,
                content: msg.message,
                timestamp: msg.created_at
              })));
            }
          })
          .catch(() => {
            // No messages yet, that's fine
            console.log('No existing messages');
          })
          .finally(() => {
            setIsLoading(false);
          });

      } catch (error) {
        console.error('Failed to initialize conversation:', error);
        setError('Failed to initialize conversation');
        setIsLoading(false);
      }
    };

    initializeConversation();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!websocketRef.current || !conversationId) {
      setError('No active conversation');
      return;
    }

    // Create message object before try block so it's in scope for catch block
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };

    try {
      setIsLoading(true);
      setError(null);

      // Add user message immediately
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Always use "0" for main conversation
      await websocketRef.current.sendMessage(content, "0");
      
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message || 'Failed to send message');
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
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
