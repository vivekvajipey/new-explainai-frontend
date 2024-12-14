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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    <div className="space-y-16 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-earth-900 dark:text-earth-50 mb-6">
          Understand Any Document with AI
        </h1>
        <p className="text-xl text-earth-700 dark:text-earth-300 max-w-2xl mx-auto mb-12">
          ExplainAI uses advanced artificial intelligence to analyze and explain complex documents. 
          Ask questions, get summaries, and understand content like never before.
        </p>
        
        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: "Natural Conversations",
              description: "Chat with your documents using natural language. Ask questions and get instant, accurate answers.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              )
            },
            {
              title: "Deep Understanding",
              description: "Our AI comprehends context and nuance, providing insights that go beyond simple keyword matching.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              )
            },
            {
              title: "Multiple Formats",
              description: "Support for various document types including PDFs, Word documents, and plain text files.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              )
            }
          ].map((feature, index) => (
            <div key={index} className="p-6 rounded-xl bg-earth-50 dark:bg-earth-800/50">
              <div className="w-12 h-12 rounded-lg bg-earth-100 dark:bg-earth-700 flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-earth-600 dark:text-earth-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-earth-900 dark:text-earth-50 mb-2">{feature.title}</h3>
              <p className="text-earth-600 dark:text-earth-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Try It Out Section */}
        <div className="relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-b from-earth-100 to-transparent dark:from-earth-800/50 dark:to-transparent -mx-8 h-[150%] -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(107,97,76,0.1),transparent)] dark:bg-[radial-gradient(circle_at_center,rgba(243,240,235,0.03),transparent)] -z-10" />
          
          <div className="bg-earth-50/80 dark:bg-earth-800/80 backdrop-blur-lg rounded-3xl p-12 max-w-3xl mx-auto shadow-2xl shadow-earth-900/5 dark:shadow-earth-900/20 border border-earth-200/50 dark:border-earth-700/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-earth-900 dark:text-earth-50 mb-4">Try ExplainAI Now</h2>
              <p className="text-earth-600 dark:text-earth-400">Select an example or upload your own document to experience AI-powered document analysis</p>
            </div>
            
            {/* Document Selection */}
            <div className="space-y-6">
              <div className="flex gap-4">
                {/* Custom Dropdown */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-earth-900 text-left shadow-sm
                      border border-earth-200 dark:border-earth-700 hover:border-earth-300 dark:hover:border-earth-600
                      focus:outline-none focus:ring-2 focus:ring-earth-500 dark:focus:ring-earth-400
                      transition-all flex items-center justify-between
                      ${selectedText ? 'text-earth-900 dark:text-earth-50' : 'text-earth-500 dark:text-earth-400'}`}
                  >
                    <span className="block truncate">
                      {selectedText ? selectedText.title : 'Select a document to analyze...'}
                    </span>
                    <svg 
                      className={`w-5 h-5 text-earth-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-earth-900 rounded-xl shadow-lg border border-earth-200 dark:border-earth-700 py-2 max-h-60 overflow-auto">
                      {/* Example Documents */}
                      <div className="px-3 py-2">
                        <h4 className="text-xs font-medium text-earth-500 dark:text-earth-400 uppercase tracking-wider">
                          Example Documents
                        </h4>
                      </div>
                      {exampleTexts.map(text => (
                        <button
                          key={text.id}
                          onClick={() => {
                            setSelectedText(text);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-earth-50 dark:hover:bg-earth-800 transition-colors
                            ${selectedText?.id === text.id ? 'bg-earth-100 dark:bg-earth-700' : ''}`}
                        >
                          <span className="block text-earth-900 dark:text-earth-50 font-medium">
                            {text.title}
                          </span>
                          <span className="block text-sm text-earth-500 dark:text-earth-400 truncate">
                            {text.preview}
                          </span>
                        </button>
                      ))}

                      {/* User Documents */}
                      {user && userDocuments.length > 0 && (
                        <>
                          <div className="border-t border-earth-200 dark:border-earth-700 mt-2 pt-2 px-3 py-2">
                            <h4 className="text-xs font-medium text-earth-500 dark:text-earth-400 uppercase tracking-wider">
                              Your Documents
                            </h4>
                          </div>
                          {userDocuments.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => {
                                setSelectedText(doc);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-earth-50 dark:hover:bg-earth-800 transition-colors
                                ${selectedText?.id === doc.id ? 'bg-earth-100 dark:bg-earth-700' : ''}`}
                            >
                              <span className="block text-earth-900 dark:text-earth-50 font-medium">
                                {doc.title}
                              </span>
                              <span className="block text-sm text-earth-500 dark:text-earth-400">
                                Added {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                {user && (
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="px-5 py-3 text-sm font-medium bg-white dark:bg-earth-900 text-earth-600 dark:text-earth-400 
                      hover:text-earth-900 dark:hover:text-earth-50 hover:bg-earth-50 dark:hover:bg-earth-800 
                      rounded-xl transition-all border border-earth-200 dark:border-earth-700 shadow-sm
                      inline-flex items-center gap-2 hover:border-earth-300 dark:hover:border-earth-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Upload New
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />

              {/* Action Button */}
              {selectedText ? (
                <button
                  onClick={handleTryItOut}
                  className="w-full px-6 py-4 bg-earth-600 hover:bg-earth-700 text-earth-50 font-medium rounded-xl 
                    transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-lg"
                >
                  <span>Analyze this document</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              ) : !user ? (
                <div className="text-center">
                  <a 
                    href="/login.html"
                    className="inline-flex items-center px-8 py-4 bg-earth-600 hover:bg-earth-700 text-earth-50 
                      font-medium rounded-xl transition-all shadow-sm hover:shadow-md gap-2 text-lg"
                  >
                    <span>Sign in to get started</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-earth-900 dark:text-earth-50 text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Upload Your Document",
              description: "Start by uploading any supported document or choosing from our example texts."
            },
            {
              step: "2",
              title: "AI Analysis",
              description: "Our advanced AI reads and understands your document, creating a deep contextual understanding."
            },
            {
              step: "3",
              title: "Ask Away",
              description: "Ask questions naturally and get instant, accurate answers based on your document's content."
            }
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="w-12 h-12 rounded-full bg-earth-100 dark:bg-earth-700 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-earth-600 dark:text-earth-300">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-earth-900 dark:text-earth-50 mb-2">{step.title}</h3>
              <p className="text-earth-600 dark:text-earth-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
