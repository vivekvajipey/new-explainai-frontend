import { useState, useRef } from 'react';

interface UploadHandlerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, pageRange?: string) => Promise<void>;
  onUrlUpload: (url: string) => Promise<void>;
  isUploading: boolean;
}

export function UploadHandler({
  onUpload,
  onUrlUpload,
  isUploading,
}: UploadHandlerProps) {
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPageRangeModal, setShowPageRangeModal] = useState(false);
  const [pageRange, setPageRange] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadEvent, setPendingUploadEvent] = useState<React.ChangeEvent<HTMLInputElement> | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size before proceeding
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload a smaller document (maximum size: 10MB).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setError(null);

    // If it's a PDF, show the page range modal
    if (file.type === 'application/pdf') {
      setPendingUploadEvent(event);
      setShowPageRangeModal(true);
    } else {
      // For non-PDF files, upload directly
      handleUpload(event);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, pageRange?: string) => {
    try {
      await onUpload(event, pageRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePageRangeSubmit = async () => {
    if (pendingUploadEvent) {
      await handleUpload(pendingUploadEvent, pageRange);
      setShowPageRangeModal(false);
      setPageRange('');
      setPendingUploadEvent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      try {
        setError(null);
        // Add https:// if no protocol is specified
        let processedUrl = url;
        if (!/^https?:\/\//i.test(url)) {
          processedUrl = `https://${url}`;
        }
        await onUrlUpload(processedUrl);
        setUrl('');
        setShowUrlInput(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload from URL');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex gap-2 w-full">
        <input
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.txt"
          ref={fileInputRef}
        />
        <label
          htmlFor="file-upload"
          className={`flex-1 flex items-center justify-center px-6 py-3 border border-transparent 
                   text-base font-medium rounded-lg text-button-upload-text 
                   bg-button-upload-bg hover:bg-button-upload-hover
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus 
                   cursor-pointer transition-all duration-200 shadow-sm
                   ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Uploading...</span>
            </div>
          ) : (
            <>
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload File
            </>
          )}
        </label>
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`px-6 py-3 border border-transparent text-base font-medium rounded-lg 
                   text-button-upload-text bg-button-upload-bg hover:bg-button-upload-hover
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus 
                   transition-all duration-200 shadow-sm flex items-center gap-2
                   ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isUploading}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          {showUrlInput ? 'Hide URL' : 'Import from Website'}
        </button>
      </div>

      {error && (
        <div className="w-full text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="w-full">
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter document URL (e.g. ssi.inc)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-input-focus"
              pattern="^(https?:\/\/)?.+"
              title="Enter a valid URL. The https:// will be added automatically if missing."
              required
            />
            <div className="text-xs text-gray-500 ml-1">
              {url && !/^https?:\/\//i.test(url) && 'https:// will be added automatically'}
            </div>
            <button
              type="submit"
              disabled={isUploading || !url}
              className={`px-6 py-2 border border-transparent text-base font-medium rounded-lg 
                       text-button-upload-text bg-button-upload-bg hover:bg-button-upload-hover
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus 
                       transition-all duration-200 shadow-sm
                       ${(isUploading || !url) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? 'Importing...' : 'Import from URL'}
            </button>
          </div>
        </form>
      )}

      {/* Page Range Modal */}
      {showPageRangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-4">Select Page Range</h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter page range (e.g., 1-10). Use startpage-endpage format. Maximum 16 pages.
              Leave empty to process first 8 pages.
            </p>
            <input
              type="text"
              value={pageRange}
              onChange={(e) => setPageRange(e.target.value)}
              placeholder="e.g., 1-10"
              className="w-full px-3 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-input-focus"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPageRangeModal(false);
                  setPendingUploadEvent(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handlePageRangeSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
