'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { Document } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user, token, login } = useAuth();
  const [selectedText, setSelectedText] = useState<Document | null>(null);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDemo, setIsDemo] = useState(!user); // Default to demo mode when not logged in

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
    // Load documents based on auth state
    const loadDocuments = async () => {
      try {
        if (user && !isDemo) {
          // Load user's documents when authenticated
          const docs = await listDocuments(token, false);
          setUserDocuments(docs);
        } else if (isDemo) {
          // Load example documents in demo mode
          const docs = await listDocuments(null, true);
          setUserDocuments(docs);
        } else {
          // Clear documents if not authenticated and not in demo mode
          setUserDocuments([]);
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };

    loadDocuments();
  }, [token, isDemo, user]);

  // Clear demo mode when user signs in
  useEffect(() => {
    if (user) {
      setIsDemo(false);
    }
  }, [user]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadDocument(file, token);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh the documents list
      const docs = await listDocuments(token);
      setUserDocuments(docs);

      // Reset after successful upload
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTryItOut = () => {
    if (!selectedText) return;
    
    // Redirect to the document page with the selected document ID
    router.push(`/documents/${selectedText.id}`);
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 p-6 z-50">
        {!user && (
          <a
            href="/login.html"
            className="px-6 py-3 bg-earth-600 text-white rounded-lg hover:bg-earth-700 transition-colors shadow-sm"
          >
            Sign In
          </a>
        )}
      </nav>

      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold text-earth-900 dark:text-earth-50 mb-6">
          Understand Any Document with AI
        </h1>
        <p className="text-xl text-earth-600 dark:text-earth-400 mb-8 max-w-2xl mx-auto">
          Upload any document and start a conversation. Our AI will help you understand, analyze, and extract insights from your text.
        </p>
      </section>

      {/* Main Content */}
      <section className="px-4">
        <div className="bg-earth-50/80 dark:bg-earth-800/80 backdrop-blur-lg rounded-3xl p-12 max-w-3xl mx-auto shadow-2xl shadow-earth-900/5 dark:shadow-earth-900/20 border border-earth-200/50 dark:border-earth-700/50">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-earth-900 dark:text-earth-50 mb-4">
              {isDemo ? "Try Our Example Documents" : user ? "Your Documents" : "Try Our Example Documents"}
            </h2>
            <p className="text-earth-600 dark:text-earth-400">
              {isDemo ? "Select an example document to analyze" : user ? "Select or upload a document to analyze" : "Select an example document to analyze"}
            </p>
          </div>

          {/* Document Selection */}
          <div className="space-y-6">
            {isDemo || user ? (
              <>
                {/* Document selector dropdown */}
                <div className="relative w-full max-w-2xl mx-auto">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-5 py-3.5 rounded-xl bg-white/95 dark:bg-earth-900/95 text-left shadow-sm
                      border border-earth-200 dark:border-earth-700 hover:border-earth-300 dark:hover:border-earth-600
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 dark:focus:ring-earth-400
                      transition-all duration-200 backdrop-blur-sm
                      flex items-center justify-between
                      ${selectedText ? 'text-earth-900 dark:text-earth-50' : 'text-earth-500 dark:text-earth-400'}`}
                  >
                    <span className="block truncate">
                      {selectedText ? selectedText.title : isDemo ? 'Select an example document' : 'Select a document'}
                    </span>
                    <svg
                      className={`ml-2 h-5 w-5 transition-transform duration-200 ${
                        isDropdownOpen ? 'transform rotate-180' : ''
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-earth-900 shadow-lg rounded-xl border border-earth-200 dark:border-earth-700 max-h-96 overflow-y-auto">
                      <div className="py-2">
                        {userDocuments.length > 0 ? (
                          <div>
                            <div className="px-4 py-2 text-sm font-medium text-earth-500 dark:text-earth-400">
                              {isDemo ? 'Example Documents' : 'Your Documents'}
                            </div>
                            {userDocuments.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => {
                                  setSelectedText(doc);
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-earth-50 dark:hover:bg-earth-800
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
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-earth-500 dark:text-earth-400">
                            {isDemo ? 'Loading example documents...' : 'No documents found'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload button - only show for authenticated users */}
                {user && !isDemo && (
                  <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white 
                        bg-gradient-to-r from-earth-600 to-earth-700 hover:from-earth-700 hover:to-earth-800 
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 
                        cursor-pointer transition-all duration-200 w-full shadow-sm
                        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploading ? (
                        <div className="w-full">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </div>
                          <div className="w-full bg-earth-500/30 rounded-full h-1.5">
                            <div 
                              className="bg-white h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Document
                        </>
                      )}
                    </label>
                  </div>
                )}

                {/* Analyze button - show when document is selected */}
                {selectedText && (
                  <button
                    onClick={handleTryItOut}
                    className="mt-6 w-full px-6 py-4 bg-earth-600 hover:bg-earth-700 text-earth-50 font-medium rounded-xl 
                      transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-lg"
                  >
                    <span>Analyze this document</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
