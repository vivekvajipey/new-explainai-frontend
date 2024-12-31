// src/components/home/UploadHandler.tsx
interface UploadHandlerProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadHandler({
  onUpload,
  isUploading,
  uploadProgress,
}: UploadHandlerProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <input
        type="file"
        onChange={onUpload}
        className="hidden"
        id="file-upload"
        accept=".pdf,.doc,.docx,.txt"
      />
      <label
        htmlFor="file-upload"
        className="flex items-center justify-center px-6 py-3 border border-transparent 
                 text-base font-medium rounded-lg text-button-upload-text 
                 bg-button-upload-bg hover:bg-button-upload-hover
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
  );
}