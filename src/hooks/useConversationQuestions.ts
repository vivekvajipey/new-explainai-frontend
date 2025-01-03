// hooks/useConversationQuestions.ts
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Question } from '@/types/conversation'; // Import the Question interface

export function useConversationQuestions(conversationId: string) {
  const { conversationSocket } = useSocket();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchQuestions = useCallback(async () => {
    if (!conversationSocket || !conversationId) return;
    
    try {
      setIsLoading(true);
      const questions = await conversationSocket.listQuestions(conversationId);
      setQuestions(questions);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, conversationSocket]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    isLoading,
    error,
    isCollapsed,
    setIsCollapsed,
    fetchQuestions  // Expose the fetch function
  };
}