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
      content: (
        <>
          <p>This is where your text is displayed.</p>
          <p>It has been split into sections called &ldquo;chunks&rdquo;.</p>
        </>
      ),
      disableBeacon: true,
      placement: 'right' as const,
    },
    {
      target: '.document-navigation',
      content: 'Use these controls to move between different chunks of your document. Chunk-specific conversations will change when you navigate.',
      placement: 'bottom' as const,
    },
    {
      target: '.main-conversation',
      content: 'This is your main conversation space. As you move through the document, you can ask anything in one continuous flow.',
      placement: 'left' as const,
    },
    {
      target: '.document-viewer',
      // Simply use a <div> instead of <Content>
      content: (
        <div>
          <p>Start focused conversations by highlighting text:</p>
          <div className="mt-2 p-3 bg-doc-bg rounded-lg border border-doc-border">
            <div className="flex items-center">
              <span className="text-doc-text bg-doc-highlight-bg border border-doc-highlight-border px-2 py-1 rounded">
                vocabulary word
              </span>
              <span className="mx-2">→</span>
              <div className="flex items-center text-sm text-tooltip-text bg-tooltip-bg hover:bg-tooltip-hover rounded-lg">
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
      placement: 'right' as const,
    },
    {
      target: '.suggested-questions',
      content: 'Not sure what to ask? Try these suggested questions that are tailored to the current section you are reading.',
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