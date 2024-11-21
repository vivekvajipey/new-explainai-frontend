'use client';

import { useState, useRef, useEffect } from 'react';
import { ChunkConversation, Message } from '@/interfaces/document';
import { useDocument } from '@/context/DocumentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Maximize2, Minimize2, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const windowRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation.position && windowRef.current) {
      // Set initial position if not set
      const rect = windowRef.current.getBoundingClientRect();
      updateConversationPosition(chunkId, conversation.id, {
        x: window.innerWidth - rect.width - 20,
        y: window.innerHeight / 3
      });
    }
  }, [conversation.id, chunkId, conversation.position, updateConversationPosition]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    if (!input.trim()) return;
    
    const trimmedInput = input.trim();
    const userMessage = {
      id: crypto.randomUUID(),
      conversation_id: conversation.id,
      content: trimmedInput,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    try {
      setLoading(true);
      setError(null);
      // Optimistically add user message
      conversation.messages.push(userMessage);
      setInput('');
      
      await sendMessage(conversation.id, trimmedInput);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      // Remove the optimistically added message on error
      conversation.messages.pop();
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
      className={cn(
        "fixed bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl flex flex-col z-50",
        "border border-gray-800",
        isExpanded ? "w-[600px] h-[80vh]" : "w-[400px] h-[400px]"
      )}
      style={{
        top: conversation.position?.y ?? 0,
        left: conversation.position?.x ?? 0,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={cn(
          "p-4 rounded-t-lg cursor-grab flex items-center justify-between",
          "bg-gray-800/50 backdrop-blur border-b border-gray-700"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-200">
            Selected Text: <span className="text-gray-400">{conversation.highlightedText.slice(0, 30)}...</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded-md transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {conversation.messages.map((message: Message, index: number) => (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
                  "max-w-[80%] px-4 py-2 rounded-lg",
                  message.role === 'user' 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-800 text-gray-100"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback>
                <Bot className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg"
          >
            <p className="text-sm">{error}</p>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
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
            placeholder="Ask about this text..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2
                     placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-purple-500 transition-all border-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={cn(
              "p-2 rounded-lg transition-colors",
              input.trim()
                ? "bg-purple-600 hover:bg-purple-500 text-white"
                : "bg-gray-800 text-gray-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}