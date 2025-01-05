import { useState } from 'react';

interface UploadHandlerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
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

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleUrlSubmit called with URL:', url);
    if (url) {
      try {
        console.log('Calling onUrlUpload with URL:', url);
        await onUrlUpload(url);
        console.log('URL upload completed');
        setUrl('');
        setShowUrlInput(false);
      } catch (error) {
        console.error('Error in handleUrlSubmit:', error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div className="flex gap-2 w-full">
        <input
          type="file"
          onChange={onUpload}
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
                   transition-all duration-200 shadow-sm
                   ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isUploading}
        >
          {showUrlInput ? 'Hide URL' : 'URL Upload'}
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="w-full">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter document URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-input-focus"
              required
            />
            <button
              type="submit"
              disabled={isUploading || !url}
              className={`px-6 py-2 border border-transparent text-base font-medium rounded-lg 
                       text-button-upload-text bg-button-upload-bg hover:bg-button-upload-hover
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-input-focus 
                       transition-all duration-200 shadow-sm
                       ${(isUploading || !url) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? 'Uploading...' : 'Upload URL'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
