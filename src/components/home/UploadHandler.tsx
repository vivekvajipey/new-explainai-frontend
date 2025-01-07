import { useState, useEffect } from 'react';
import { PDFPageSelector } from './PDFPageSelector';

interface UploadHandlerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>, selectedPages?: number[]) => Promise<void>;
  onUrlUpload: (url: string) => Promise<void>;
  isUploading: boolean;
}

interface PendingFileState {
  files: FileList;
  target: HTMLInputElement;
}

export function UploadHandler({
  onUpload,
  onUrlUpload,
  isUploading,
}: UploadHandlerProps) {
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFileState | null>(null);

  useEffect(() => {
    console.log('State updated:', {
      showPageSelector,
      hasPendingFile: !!pendingFile,
      pendingFileList: pendingFile?.files,
      firstFile: pendingFile?.files?.[0]
    });
  }, [showPageSelector, pendingFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'Type:', file.type);
      
      // Check file size before uploading (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        setError('File is too large. Please upload a smaller document (maximum size: 10MB).');
        return;
      }
      setError(null);

      // If it's a PDF, show the page selector
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log('PDF detected, showing page selector');
        // Capture the files immediately
        setPendingFile({
          files: e.target.files!,
          target: e.target
        });
        setShowPageSelector(true);
      } else {
        console.log('Non-PDF file, uploading directly');
        // For non-PDF files, upload directly
        try {
          await onUpload(e);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to upload file');
        }
      }
    }
  };

  const handlePageSelection = async (selectedPages: number[]) => {
    if (pendingFile) {
      try {
        // Create a new synthetic event
        const syntheticEvent = {
          target: pendingFile.target,
          currentTarget: pendingFile.target,
          files: pendingFile.files,
          preventDefault: () => {},
          stopPropagation: () => {}
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        await onUpload(syntheticEvent, selectedPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      } finally {
        setShowPageSelector(false);
        setPendingFile(null);
      }
    }
  };

  const handlePageSelectorCancel = () => {
    setShowPageSelector(false);
    setPendingFile(null);
    // Reset the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.txt"
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
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
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

      {/* The PDFPageSelector */}
      {showPageSelector && pendingFile?.files?.[0] && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50">
          <PDFPageSelector
            file={pendingFile.files[0]}
            onConfirm={handlePageSelection}
            onCancel={handlePageSelectorCancel}
            isOpen={showPageSelector}
          />
        </div>
      )}
    </div>
  );
}
