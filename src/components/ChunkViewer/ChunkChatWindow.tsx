'use client';

import { useState, useRef, useEffect } from 'react';
import { ChunkConversation, Message } from '@/interfaces/document';
import { useDocument } from '@/context/DocumentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Maximize2, Minimize2, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';

interface ChunkChatWindowProps {
  chunkId: string;
  conversation: ChunkConversation;
  onClose: () => void;
}

export default function ChunkChatWindow({ chunkId, conversation, onClose }: ChunkChatWindowProps) {
  const { sendMessage, updateConversationPosition } = useDocument();
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(conversation.messages || []);
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation.position && windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      updateConversationPosition(chunkId, conversation.id, {
        x: window.innerWidth - rect.width - 20,
        y: window.innerHeight / 3
      });
    }
  }, [conversation.id, chunkId, conversation.position, updateConversationPosition]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  useEffect(() => {
    if (conversation.messages) {
      setLocalMessages(conversation.messages);
    }
  }, [conversation.messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && conversation.position) {
      updateConversationPosition(chunkId, conversation.id, {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const trimmedInput = input.trim();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: trimmedInput,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    try {
      setLoading(true);
      setError(null);
      setInput('');
      // Update local state immediately for responsive UI
      setLocalMessages(prev => [...prev, userMessage]);
      
      // Use context's sendMessage to maintain global state
      await sendMessage(conversation.id, trimmedInput);
      
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setLocalMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        left: conversation.position?.x,
        top: conversation.position?.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        "fixed bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl flex flex-col z-50",
        "border border-gray-800",
        isExpanded ? "w-[600px] h-[80vh]" : "w-[400px] h-[400px]",
        isDragging && "cursor-grabbing"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
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
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-800 text-gray-100"
              )}>
                <p className="whitespace-pre-wrap break-words">
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
            <div className="bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
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
            className="flex-1 h-10 px-4 rounded-md bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="h-10 px-4 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    </motion.div>
  );
}