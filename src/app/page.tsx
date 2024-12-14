'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { Text, Document } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user, token, login } = useAuth();
  const [selectedText, setSelectedText] = useState<Text | Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);

  // Example texts that will be shown on the landing page
  const exampleTexts: Text[] = [
    {
      id: 'example1',
      title: 'Introduction to AI',
      content: 'Artificial Intelligence (AI) is revolutionizing how we live and work. From machine learning to neural networks, AI technologies are transforming industries and creating new possibilities for innovation.',
      preview: 'Artificial Intelligence (AI) is revolutionizing...',
      isExample: true
    },
    {
      id: 'example2',
      title: 'Climate Change',
      content: 'Global warming is one of the most pressing issues facing our planet today. Rising temperatures, extreme weather events, and melting ice caps are just some of the challenges we must address.',
      preview: 'Global warming is one of the most pressing issues...',
      isExample: true
    },
    {
      id: 'example3',
      title: 'Space Exploration',
      content: 'The journey to explore space began with early rocket launches and has evolved into sophisticated missions to Mars, asteroid mining projects, and the search for extraterrestrial life.',
      preview: 'The journey to explore space began...',
      isExample: true
    },
  ];

  useEffect(() => {
    // Check for token from login.html
    if (!user) {
      const token = localStorage.getItem('google_token');
      if (token) {
        login(token);
        localStorage.removeItem('google_token'); // Clear it after use
      }
    }
  }, [user, login]);

  useEffect(() => {
    // Fetch user's documents when logged in
    if (user && token) {
      listDocuments(token)
        .then(docs => setUserDocuments(docs))
        .catch(error => console.error('Failed to fetch documents:', error));
    }
  }, [user, token]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setIsLoading(true);
    try {
      await uploadDocument(file, token);
      // Refresh the documents list
      const docs = await listDocuments(token);
      setUserDocuments(docs);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryItOut = () => {
    if (!selectedText) return;
    
    // If it's an example text, we'll pass it as a query param
    const params = new URLSearchParams();
    if ((selectedText as Text).isExample) {
      params.set('text', (selectedText as Text).content);
      params.set('title', (selectedText as Text).title);
    } else {
      params.set('documentId', (selectedText as Document).id);
    }
    
    router.push(`/chat?${params.toString()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">ExplainAI</h1>
        <p className="text-xl text-gray-700 mb-8">
          Your AI-powered document assistant. Ask questions, get insights, understand better.
        </p>
      </section>

      {/* Display both example and user documents */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Example Documents</h2>
        {exampleTexts.map((text) => (
          <div
            key={text.id}
            className={`p-4 border rounded-lg cursor-pointer ${
              selectedText?.id === text.id ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => setSelectedText(text)}
          >
            <h3 className="font-bold">{text.title}</h3>
            <p className="text-gray-600">{text.preview}</p>
          </div>
        ))}

        {user ? (
          <>
            <h2 className="text-xl font-bold mt-8 mb-4">Your Documents</h2>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className={`mb-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            {userDocuments.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedText?.id === doc.id ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedText(doc)}
              >
                <h3 className="font-bold">{doc.title}</h3>
                <p className="text-gray-500 text-sm">
                  Created: {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </>
        ) : (
          <div className="mt-8 p-6 border rounded-lg bg-gray-50 text-center">
            <p className="text-gray-700 mb-4">Sign in to upload and manage your own documents</p>
            <a 
              href="/login.html" 
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Sign in with Google
            </a>
          </div>
        )}
      </div>

      {selectedText && (
        <button
          onClick={handleTryItOut}
          className="mt-8 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Try it out with this document
        </button>
      )}
    </main>
  );
}
