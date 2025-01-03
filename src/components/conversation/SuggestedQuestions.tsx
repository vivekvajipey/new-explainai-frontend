// components/conversation/SuggestedQuestions.tsx
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

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
  className?: string;
}

export function SuggestedQuestions({
  questions,
  isLoading,
  isCollapsed,
  onCollapse,
  onQuestionSelect,
  className = ''
}: SuggestedQuestionsProps) {
  const { trackEvent } = useGoogleAnalytics();

  if (isLoading) return null;
  if (!questions.length) return null;

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-doc-content-text font-medium">
          Suggested questions
        </h3>
        <button
          onClick={onCollapse}
          className="text-muted-blue-400 hover:text-muted-blue-600 transition-colors"
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
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