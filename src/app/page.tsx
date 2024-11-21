'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const response = await api.uploadDocument(file);
      
      if (!response.document_id) {
        throw new Error('No document ID received from server');
      }
      
      // Use Next.js router for navigation
      router.push(`/document/${response.document_id}`);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Document Explainer
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Upload a document to get started
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-400 rounded-lg border-2 border-gray-300 border-dashed cursor-pointer hover:border-gray-400"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="mt-2 text-sm">
                {file ? file.name : 'Select a file'}
              </span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              (!file || uploading) && 'opacity-50 cursor-not-allowed'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </main>
  );
}