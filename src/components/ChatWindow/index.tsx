'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Message, Conversation } from '@/interfaces/types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatWindowProps {
  documentId: string;
  chunkId?: string;
  highlightRange?: [number, number];
}

export default function ChatWindow({ documentId, chunkId, highlightRange }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initConversation = async () => {
      try {
        const type = chunkId ? 'chunk' : 'main';
        const response = await api.createConversation(documentId, type, chunkId, highlightRange);
        setConversation(response);
        setError(null);
      } catch (err) {
        console.error('Error creating conversation:', err);
        setError('Failed to initialize chat. Please refresh the page.');
      }
    };

    if (!conversation) {
      initConversation();
    }
  }, [documentId, chunkId, highlightRange, conversation]);

  const handleSend = async () => {
    if (!conversation || !input.trim()) return;

    const trimmedInput = input.trim();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      content: trimmedInput,
      role: 'user',
      created_at: new Date().toISOString()
    };

    try {
      setLoading(true);
      setError(null);
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const responseMessage = await api.sendMessage(conversation.id, trimmedInput);
      setMessages(prev => [...prev, responseMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {error && (
        <div className="m-4">
          <div className="bg-red-50/50 backdrop-blur border border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-6 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 w-full",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role !== 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "relative flex flex-col max-w-[80%] space-y-2",
                  message.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                )}>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
              {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-white/80 backdrop-blur-lg dark:bg-slate-900/80">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-w-0 h-12 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              disabled={loading || !conversation}
            />
            <button
              type="submit"
              disabled={loading || !conversation || !input.trim()}
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}