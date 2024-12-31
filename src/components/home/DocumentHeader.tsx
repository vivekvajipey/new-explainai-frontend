// src/components/home/DocumentHeader.tsx
export function DocumentHeader() {
  return (
    <section className="text-center pt-16 pb-8">
      <h1 className="text-5xl font-bold text-foreground mb-6">
        Understand Any Document with AI
      </h1>
      <p className="text-xl text-sand-600 dark:text-sand-300 mb-8 max-w-2xl mx-auto">
        Upload any document and start a conversation. Our AI will help you understand, analyze, and extract insights from your text.
      </p>
    </section>
  );
}