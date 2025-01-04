// hooks/useTutorialTour.ts
import { useState, useEffect } from 'react';
import type { Step } from 'react-joyride';
import { MessageCircle } from 'lucide-react';
export const useTutorialTour = () => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.document-viewer',
      content: 'This is where you read your document...',
      disableBeacon: true,
      placement: 'right' as const,
    },
    {
      target: '.document-navigation',
      content: 'Use these controls to move between different chunks...',
      placement: 'bottom' as const,
    },
    {
      target: '.main-conversation',
      content: 'This is your main conversation space...',
      placement: 'left' as const,
    },
    {
      target: '.prose',
      // Simply use a <div> instead of <Content>
      content: (
        <div>
          <p>Start focused conversations by highlighting text:</p>
          <div className="mt-2 p-3 bg-doc-bg rounded-lg border border-doc-content-border">
            <div className="flex items-center">
              <span className="bg-doc-highlight-bg border border-doc-highlight-border px-2 py-1 rounded">
                vocabulary word
              </span>
              <span className="mx-2">→</span>
              <div className="flex items-center text-sm text-doc-text">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>Chat about this</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Perfect for exploring specific terms, metaphors, or ideas in depth.
          </p>
        </div>
      ) as unknown as string,
      placement: 'left' as const,
    },
    {
      target: '.suggested-questions',
      content: 'Not sure what to ask? Try these suggested questions...',
      placement: 'top' as const,
    },
  ];

  const handleTourCallback = (data: { status: string }) => {
    if (data.status === 'finished' || data.status === 'skipped') {
      setRunTour(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  return {
    steps,
    runTour,
    handleTourCallback,
  };
};