// src/components/home/ExplainerSection.tsx
import Image from 'next/image';

const ExplainerSection = () => {
  const steps = [
    {
      image: '/upload_new.png',
      caption: 'Upload a file (around 15 pages or less) or select from our examples',
    },
    {
      image: '/main_new.png',
      caption: 'Ask questions in the main conversation tab, which sees what you read, as you read it.',
    },
    {
      image: '/highlight.png',
      caption: 'Highlight specific portions of text to start detailed conversations focusing on a single word, metaphor, or idea.',
    },
  ];

  return (
    <div className="max-w-[3600px] mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 relative -z-10">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            {/* Larger container for image */}
            <div className="relative w-full aspect-[4/3] mb-6 rounded-xl overflow-hidden border border-card-border shadow-lg">
              <Image
                src={step.image}
                alt={`Step ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 33vw"
                priority
              />
            </div>
            {/* Keep text size moderate with lg instead of 2xl */}
            <p className="text-lg text-sand-600 dark:text-sand-400 max-w-xs">
              {step.caption}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplainerSection;