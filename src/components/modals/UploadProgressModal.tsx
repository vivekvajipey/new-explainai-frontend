// src/components/modals/UploadProgressModal.tsx
interface UploadProgressModalProps {
  isOpen: boolean;
  uploadProgress: number;
  chunks: {
    total: number;
    processed: number;
  };
  uploadSuccess: boolean;
 }
 
 export function UploadProgressModal({ 
  isOpen,
  uploadProgress,
  chunks,
  uploadSuccess
 }: UploadProgressModalProps) {
  if (!isOpen) return null;
 
  return (
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
                    {chunks.processed} chunks
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
  );
 }