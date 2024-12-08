'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { uploadDocument } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const { document_id } = await uploadDocument(file);
      router.push(`/documents/${document_id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to ExplainAI</h1>
        <p className="text-earth-600 dark:text-earth-300">
          Upload your documents and start an intelligent conversation
        </p>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging 
            ? 'border-earth-400 bg-earth-50/50' 
            : 'border-earth-200 dark:border-earth-800'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className={`w-12 h-12 ${isUploading ? 'animate-bounce' : ''} text-earth-400`} />
          <div>
            <p className="text-lg font-semibold mb-2">
              {isUploading ? 'Uploading...' : 'Drop your document here'}
            </p>
            <p className="text-earth-600 dark:text-earth-300 text-sm">
              {isUploading ? 'Please wait' : 'or click to browse'}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            id="file-upload"
            onChange={handleFileInput}
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className={`mt-4 px-6 py-2 bg-earth-800 text-earth-50 rounded-lg transition-colors cursor-pointer ${
              isUploading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-earth-700'
            }`}
          >
            Select File
          </label>
        </div>
      </div>
    </div>
  );
}
