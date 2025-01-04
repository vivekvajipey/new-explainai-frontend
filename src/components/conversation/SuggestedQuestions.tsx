// components/conversation/SuggestedQuestions.tsx
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Question {
  id: string;
  content: string;
}

interface SuggestedQuestionsProps {
  questions: Question[];
  isLoading: boolean;
  isCollapsed: boolean;
  onCollapse: () => void;
  onQuestionSelect: (question: Question) => Promise<void>;
  onRegenerate: () => Promise<void>;
  className?: string;
}

export function SuggestedQuestions({
  questions,
  isLoading,
  isCollapsed,
  onCollapse,
  onQuestionSelect,
  onRegenerate,
  className = ''
}: SuggestedQuestionsProps) {
  const { trackEvent } = useGoogleAnalytics();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    console.log('Starting regeneration');
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      console.log('Finishing regeneration');
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-doc-content-text font-medium">
            Loading questions...
          </h3>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm text-doc-content-text font-medium">
            All questions asked
          </h3>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="text-muted-blue-400 hover:text-muted-blue-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Regenerate questions"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
            />
            Generate new questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-doc-content-text font-medium">
          Suggested questions
        </h3>
        <div className="flex gap-2">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="text-muted-blue-400 hover:text-muted-blue-600 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`}
          />
          Generate new questions
        </button>

          <button
            onClick={onCollapse}
            className="text-muted-blue-400 hover:text-muted-blue-600 transition-colors"
          >
            {isCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="flex flex-col gap-2">
          {questions.map((question) => (
            <button
              key={question.id}
              onClick={async () => {
                trackEvent('Conversation', 'suggested_question_selected', question.content);
                await onQuestionSelect(question);
              }}
              className="text-left p-2 rounded-lg bg-doc-content-bg hover:bg-doc-nav-button-hover
                        text-doc-content-text text-sm transition-colors border border-doc-content-border"
            >
              {question.content}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}