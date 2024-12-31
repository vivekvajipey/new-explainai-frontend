// src/components/home/DocumentSelector.tsx
import { User, Document } from '@/types';

interface DocumentSelectorProps {
  userDocuments: Document[];
  selectedText: Document | null;
  setSelectedText: (doc: Document | null) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  isDemo: boolean;
  user: User | null;
  setDocumentToDelete: (doc: Document | null) => void;
}

export function DocumentSelector({
  userDocuments,
  selectedText,
  setSelectedText,
  isDropdownOpen,
  setIsDropdownOpen,
  isDemo,
  user,
  setDocumentToDelete
}: DocumentSelectorProps) {
  return (
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
  );
}