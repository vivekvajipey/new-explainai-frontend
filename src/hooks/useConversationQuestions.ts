// hooks/useConversationQuestions.ts
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Question } from '@/types/conversation'; // Import the Question interface

export function useConversationQuestions(
  conversationId: string,
  conversationType: 'main' | 'highlight',
  chunkId?: string
) {
  console.log('useConversationQuestions called with:', { conversationId, conversationType, chunkId });
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

  const regenerateQuestions = useCallback(async () => {
    if (!conversationSocket || !conversationId) return;
    try {
      setIsLoading(true);
      await conversationSocket.regenerateQuestions(
        conversationId,
        conversationType,
        { chunkId }
      );
      await fetchQuestions(); // Fetch new questions after regeneration
    } catch (err) {
      console.error('Failed to regenerate questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate questions');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, conversationType, chunkId, conversationSocket, fetchQuestions]);


  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    isLoading,
    error,
    isCollapsed,
    setIsCollapsed,
    fetchQuestions,
    regenerateQuestions  // Expose the fetch function
  };
}