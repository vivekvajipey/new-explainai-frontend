'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Message, Conversation } from '@/interfaces/types';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import QuestionLoader from '@/components/ui/QuestionLoader';
import QuestionButton from '@/components/ui/QuestionButton';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const generateInitialQuestions = async () => {
      if (!questions.length && conversation?.id) {
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
  }, [conversation?.id, questions.length]);

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

  const handleQuestionClick = async (question: string) => {
    if (loading) return;
    setInput('');
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: question,
      role: 'user',
      created_at: new Date().toISOString()
    };
    
    try {
      setLoading(true);
      setError(null);
      setMessages(prev => [...prev, userMessage]);
      
      await api.sendMessage(conversation!.id, question);
      
      // Generate new questions based on the latest context
      setQuestionsLoading(true);
      const newQuestions = await api.generateQuestions(conversation!.id);
      setQuestions(newQuestions);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      setError(errorMessage);
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setLoading(false);
      setQuestionsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-6">
      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div
            key={questions.join(',')}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="mb-4 overflow-hidden"
          >
            {questionsLoading ? (
              <QuestionLoader />
            ) : questions.length > 0 && (
              <>
                <motion.h3
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-gray-300 text-lg font-semibold mb-3"
                >
                  Suggested Questions
                </motion.h3>
                <div className="grid gap-2">
                  {questions.map((question) => (
                    <QuestionButton
                      key={question}
                      question={question}
                      onClick={() => handleQuestionClick(question)}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-3 rounded-lg shadow-md",
              message.role === 'user' 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 ml-auto max-w-[80%]'
                : 'bg-gradient-to-r from-gray-700 to-gray-600 max-w-[80%]'
            )}
          >
            <p className="text-white text-sm">{message.content}</p>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !questionsLoading && handleSend()}
          className="flex-1 p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 
                   border border-gray-600 focus:border-purple-500 focus:ring-2 
                   focus:ring-purple-500 focus:outline-none transition-all duration-200 text-sm"
          placeholder="Type a message..."
          disabled={loading}
        />
        <motion.button
          onClick={handleSend}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 
                   rounded-lg text-white font-medium hover:from-purple-500 
                   hover:to-indigo-500 transition-all duration-200 text-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading || !input.trim()}
        >
          Send
        </motion.button>
      </div>
    </div>
  );
}