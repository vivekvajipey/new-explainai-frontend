'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments, deleteDocument, getUploadProgress } from '@/lib/api';
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
  const [chunks, setChunks] = useState({ total: 0, processed: 0 });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(!user); // Default to demo mode when not logged in
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
        if (user) {
          // Load user's documents when authenticated
          const docs = await listDocuments(token, false);
          setUserDocuments(docs);
          setSelectedText(null); // Clear selection when switching to user docs
        } else {
          // Load example documents when not authenticated
          const docs = await listDocuments(null, true);
          setUserDocuments(docs);
          setSelectedText(null); // Clear selection when switching to example docs
        }
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };

    loadDocuments();
  }, [token, user]);

  // Clear demo mode when user signs in
  useEffect(() => {
    setIsDemo(!user);
  }, [user]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setUploadProgress(0);
    setChunks({ total: 0, processed: 0 });
    setUploadSuccess(false);

    try {
      // Start polling for progress
      const progressInterval = setInterval(async () => {
        try {
          const progress = await getUploadProgress(file.name, token);
          if (progress.total_chunks > 0) {
            const percentage = Math.round((progress.processed_chunks / progress.total_chunks) * 100);
            setUploadProgress(percentage);
            setChunks({ total: progress.total_chunks, processed: progress.processed_chunks });
          }
          
          if (progress.is_complete) {
            clearInterval(progressInterval);
            // Set progress to 100% first
            setUploadProgress(100);
            setChunks(prev => ({ ...prev, processed: prev.total }));
            
            // Small delay before showing success
            setTimeout(async () => {
              // Refresh the documents list
              const docs = await listDocuments(token);
              setUserDocuments(docs);
              
              // Set success state and auto-select the new document
              setUploadSuccess(true);
              const newDoc = docs.find(d => d.title === file.name.replace('.pdf', ''));
              if (newDoc) {
                setSelectedText(newDoc);
                // Wait a moment to show success before redirecting
                setTimeout(() => {
                  router.push(`/documents/${newDoc.id}`);
                }, 1500);
              }
            }, 500); // Wait for progress bar animation to complete
          }
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }, 1000);

      // Start the upload
      await uploadDocument(file, token);

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

  const handleDeleteDocument = async (doc: Document) => {
    if (!token || !user) return;
    
    try {
      setIsDeleting(true);
      await deleteDocument(doc.id, token);
      
      // Refresh documents list
      const docs = await listDocuments(token, false);
      setUserDocuments(docs);
      
      // Clear states
      setDocumentToDelete(null);
      setConfirmEmail('');
      
      // If the deleted document was selected, clear selection
      if (selectedText?.id === doc.id) {
        setSelectedText(null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <nav className="fixed top-0 right-0 p-6 z-50">
        {!user && (
          <a
            href="/login.html"
            className="px-6 py-3 bg-button-primary-bg text-button-primary-text rounded-lg 
                     hover:bg-button-primary-hover transition-all shadow-sm"
          >
            Sign In
          </a>
        )}
      </nav>

      {/* Hero Section */}
      <section className="text-center pt-16 pb-8">
        <h1 className="text-5xl font-bold text-foreground mb-6">
          Understand Any Document with AI
        </h1>
        <p className="text-xl text-sand-600 dark:text-sand-300 mb-8 max-w-2xl mx-auto">
          Upload any document and start a conversation. Our AI will help you understand, analyze, and extract insights from your text.
        </p>
      </section>

      {/* Main Content */}
      <section className="px-4">
        <div className="bg-card-bg backdrop-blur-lg rounded-3xl p-12 max-w-3xl mx-auto 
                      shadow-2xl shadow-sand-900/5 dark:shadow-sand-900/20 
                      border border-card-border">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {isDemo ? "Try Our Example Documents" : user ? "Your Documents" : "Try Our Example Documents"}
            </h2>
            <p className="text-sand-600 dark:text-sand-400">
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
                    className={`w-full px-5 py-3.5 rounded-xl bg-input-bg text-left shadow-sm
                      border border-input-border hover:border-input-focus
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus
                      transition-all duration-200 backdrop-blur-sm
                      flex items-center justify-between
                      ${selectedText ? 'text-input-text' : 'text-sand-500 dark:text-sand-400'}`}
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
                    <div className="absolute z-10 mt-1 w-full bg-card-bg shadow-lg rounded-xl 
                                  border border-card-border max-h-96 overflow-y-auto">
                      <div className="py-2">
                        {userDocuments.length > 0 ? (
                          <div>
                            <div className="px-4 py-2 text-sm font-medium text-sand-500 dark:text-sand-400">
                              {isDemo ? 'Example Documents' : 'Your Documents'}
                            </div>
                            {userDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between px-4 py-2 hover:bg-card-hover"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedText(doc);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="flex-grow text-left"
                                >
                                  <span className="block text-foreground font-medium">
                                    {doc.title}
                                  </span>
                                </button>
                                {!isDemo && user && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDocumentToDelete(doc);
                                    }}
                                    className="ml-2 px-3 py-1 text-sm text-error hover:text-rose-700 
                                             dark:text-rose-400 dark:hover:text-rose-300 
                                             hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg
                                             transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {/* Add Upload Document option for non-logged-in users */}
                            {!user && (
                              <>
                                <div className="px-4 py-2 text-sm font-medium text-sand-500 dark:text-sand-400 
                                              border-t border-card-border mt-2">
                                  Upload Your Own
                                </div>
                                <a
                                  href="/login.html"
                                  className="w-full text-left px-4 py-3 flex items-center gap-2 
                                           text-sand-500 dark:text-sand-400 hover:bg-card-hover 
                                           cursor-pointer group"
                                >
                                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <div>
                                    <span className="block font-medium group-hover:text-sand-700 dark:group-hover:text-sand-300">
                                      Upload Document
                                    </span>
                                    <span className="block text-sm">
                                      Sign in to upload your own documents
                                    </span>
                                  </div>
                                </a>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-sm text-sand-500 dark:text-sand-400">
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
                      className="flex items-center justify-center px-6 py-3 border border-transparent 
                               text-base font-medium rounded-lg text-button-primary-text 
                               bg-button-primary-bg hover:bg-button-primary-hover
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus 
                               cursor-pointer transition-all duration-200 w-full shadow-sm
                               disabled:opacity-50"
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
                          <div className="w-full bg-sage-500/30 rounded-full h-1.5">
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
                    className="mt-6 w-full px-6 py-4 bg-accent hover:bg-sky-600 text-white font-medium rounded-xl 
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

      {/* Upload progress UI */}
      {isUploading && (
        <div className="fixed inset-0 bg-sand-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card-bg p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-card-border">
            <div className="flex flex-col items-center">
              {/* Loading spinner or success icon */}
              <div className="w-12 h-12 mb-6">
                {uploadSuccess ? (
                  <svg
                    className="w-full h-full text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="animate-spin w-full h-full text-accent"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {uploadSuccess ? 'Upload Complete!' : 'Processing Document'}
              </h3>
              
              <p className="text-sand-600 dark:text-sand-300 mb-6 text-center">
                {uploadSuccess 
                  ? 'Your document has been processed successfully. Redirecting to document view...'
                  : 'Please wait while we process your document. This may take a few minutes.'}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-sand-100 dark:bg-sand-800 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    uploadSuccess ? 'bg-success' : 'bg-accent'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Progress text */}
              <div className="flex flex-col items-center space-y-1">
                <p className="text-sm font-medium text-sand-700 dark:text-sand-200">
                  {uploadSuccess ? (
                    'All chunks processed successfully!'
                  ) : uploadProgress > 0 ? (
                    <>
                      Processed{' '}
                      <span className="font-semibold text-accent">
                        {Math.floor((uploadProgress / 100) * chunks.total)} chunks
                      </span>{' '}
                      out of{' '}
                      <span className="font-semibold text-accent">
                        {chunks.total}
                      </span>
                    </>
                  ) : (
                    'Initializing...'
                  )}
                </p>
                {uploadProgress > 0 && !uploadSuccess && (
                  <p className="text-xs text-sand-500 dark:text-sand-400">
                    {uploadProgress}% complete
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-sand-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg rounded-xl p-6 max-w-md w-full border border-card-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Delete Document
            </h3>
            <p className="text-sand-600 dark:text-sand-400 mb-4">
              This action cannot be undone. To confirm deletion of &ldquo;{documentToDelete.title}&rdquo;, 
              please type your email address: {user?.email}
            </p>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded-lg border border-input-border 
                       bg-input-bg text-input-text mb-4
                       focus:outline-none focus:ring-2 focus:ring-input-focus"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDocumentToDelete(null);
                  setConfirmEmail('');
                }}
                className="px-4 py-2 text-sand-600 hover:text-sand-700 
                         dark:text-sand-400 dark:hover:text-sand-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(documentToDelete)}
                disabled={confirmEmail !== user?.email || isDeleting}
                className={`px-4 py-2 rounded-lg ${
                  confirmEmail === user?.email && !isDeleting
                    ? 'bg-error hover:bg-rose-700 text-white'
                    : 'bg-sand-300 text-sand-500 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
