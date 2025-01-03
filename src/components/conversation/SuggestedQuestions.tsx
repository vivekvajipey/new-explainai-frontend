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
  
  if (isLoading || !questions.length) return null;

  return (
    <div className={`px-6 py-4 bg-doc-bg/50 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-doc-text">
          Suggested questions
        </h3>
        <button
          onClick={onCollapse}
          className="text-sm font-medium text-button-secondary-text hover:text-button-secondary-hover transition-colors duration-200"
          aria-label={isCollapsed ? 'Show suggested questions' : 'Hide suggested questions'}
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid gap-2.5 max-w-3xl mx-auto">
          {questions.map((question) => (
            <button
              key={question.id}
              onClick={async () => {
                trackEvent('Conversation', 'suggested_question_selected', question.content);
                await onQuestionSelect(question);
              }}
              className="w-full text-left p-3.5 rounded-xl 
                bg-card-bg hover:bg-card-hover
                text-doc-text text-sm
                border border-card-border/40 hover:border-card-border
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow-md
                transform hover:-translate-y-0.5
                focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <div className="flex items-center">
                <span className="mr-2">💭</span>
                {question.content}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}