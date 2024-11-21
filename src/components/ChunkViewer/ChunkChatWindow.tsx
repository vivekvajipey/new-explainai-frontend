'use client';

import { useState, useRef, useEffect } from 'react';
import { ChunkConversation, Message } from '@/interfaces/document';
import { useDocument } from '@/context/DocumentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Send, Maximize2, Minimize2, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import QuestionLoader from '@/components/ui/QuestionLoader';

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
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [size, setSize] = useState({ width: isExpanded ? 600 : 400, height: isExpanded ? window.innerHeight * 0.8 : 400 });
  const isResizing = useRef(false);
  const resizeDirection = useRef<string>('');
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

  useEffect(() => {
    setSize({
      width: isExpanded ? 600 : 400,
      height: isExpanded ? window.innerHeight * 0.8 : 400
    });
  }, [isExpanded]);

  useEffect(() => {
    const generateInitialQuestions = async () => {
      if (!questions.length && conversation.id) {
        try {
          setQuestionsLoading(true);
          const response = await api.generateQuestions(conversation.id);
          setQuestions(response);
        } catch (error) {
          console.error('Error generating questions:', error);
        } finally {
          setQuestionsLoading(false);
        }
      }
    };

    generateInitialQuestions();
  }, [conversation.id, questions.length]);

  useEffect(() => {
    return () => {
      if (isResizing.current) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, []);

  useEffect(() => {
    if (conversation.messages) {
      setLocalMessages(conversation.messages);
    }
  }, [conversation.messages]);

  useEffect(() => {
    console.log('Local Messages:', localMessages);
    console.log('Conversation Messages:', conversation.messages);
  }, [localMessages, conversation.messages]);

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

  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeDirection.current = direction;
  
    const startSize = { ...size };
    const startPosition = { x: conversation.position?.x || 0, y: conversation.position?.y || 0 };
    const startMousePosition = { x: e.clientX, y: e.clientY };
  
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
  
      const dx = e.clientX - startMousePosition.x;
      const dy = e.clientY - startMousePosition.y;
      const newSize = { ...startSize };
      const newPosition = { ...startPosition };
  
      if (direction.includes('e')) {
        newSize.width = Math.max(300, startSize.width + dx);
      }
      if (direction.includes('w')) {
        const newWidth = Math.max(300, startSize.width - dx);
        if (newWidth !== size.width) {
          newSize.width = newWidth;
          newPosition.x = startPosition.x + dx;
        }
      }
      if (direction.includes('s')) {
        newSize.height = Math.max(200, startSize.height + dy);
      }
      if (direction.includes('n')) {
        const newHeight = Math.max(200, startSize.height - dy);
        if (newHeight !== size.height) {
          newSize.height = newHeight;
          newPosition.y = startPosition.y + dy;
        }
      }
  
      setSize(newSize);
      updateConversationPosition(chunkId, conversation.id, newPosition);
    };
  
    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
      
      // Send message and wait for response
      const response = await sendMessage(conversation.id, trimmedInput);
      
      // Update local messages with AI response if needed
      if (!conversation.messages?.some(m => m.id === userMessage.id)) {
        setLocalMessages(prev => [...prev.filter(m => m.id !== userMessage.id), userMessage]);
      }
      
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setLocalMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (loading) return;
    setInput('');
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: question,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    try {
      setLoading(true);
      setError(null);
      setLocalMessages(prev => [...prev, userMessage]);
      
      await sendMessage(conversation.id, question);
      
      // Generate new questions based on the latest context
      setQuestionsLoading(true);
      const newQuestions = await api.generateQuestions(conversation.id);
      setQuestions(newQuestions);
      
    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
      setLocalMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
      setQuestionsLoading(false);
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
        width: size.width,
        height: size.height,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={cn(
        "fixed bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl flex flex-col z-50",
        "border border-gray-800",
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
        <AnimatePresence mode="wait">
          {questionsLoading ? (
            <QuestionLoader />
          ) : questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mb-4"
            >
              <h3 className="text-sm font-medium text-gray-300">Suggested Questions</h3>
              <div className="grid gap-2">
                {questions.map((question, index) => (
                  <motion.button
                    key={question}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleQuestionClick(question)}
                    className="w-full text-left p-2 bg-gray-800/50 hover:bg-gray-700/50 
                             rounded-lg text-sm text-gray-300 transition-colors"
                    disabled={loading}
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 border border-gray-600 rounded-lg">
        {/* Corner resize handles */}
        {['nw', 'ne', 'sw', 'se'].map((direction) => (
          <div
            key={direction}
            className={`absolute w-3 h-3 cursor-${direction}-resize pointer-events-auto
              ${direction.includes('n') ? 'top-0' : 'bottom-0'}
              ${direction.includes('w') ? 'left-0' : 'right-0'}
              group`}
            onMouseDown={(e) => handleResize(e, direction)}
          >
            <div className="absolute inset-0 m-0.5 rounded-sm bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        
        {/* Edge resize handles */}
        {[
          { dir: 'n', class: 'top-0 left-1/2 -translate-x-1/2' },
          { dir: 's', class: 'bottom-0 left-1/2 -translate-x-1/2' },
          { dir: 'w', class: 'left-0 top-1/2 -translate-y-1/2' },
          { dir: 'e', class: 'right-0 top-1/2 -translate-y-1/2' }
        ].map(({ dir, class: positionClass }) => (
          <div
            key={dir}
            className={`absolute w-2 h-2 cursor-${dir}-resize pointer-events-auto ${positionClass} group`}
            onMouseDown={(e) => handleResize(e, dir)}
          >
            <div className="absolute inset-0 m-0.5 rounded-sm bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>

    {/* Resize indicator */}
    <div className="absolute bottom-1 right-1 pointer-events-none text-gray-600 opacity-50">
      <svg 
        className="w-4 h-4" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M16 16v4l4-4h-4zm0-8v4l4-4h-4zm-8 8v4l4-4h-4z" />
      </svg>
    </div>
    </motion.div>
  );
}