'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Upload } from 'lucide-react';
import { Text, DocumentResponse } from '@/types';

interface TextSelectorProps {
  onSelect: (text: Text) => void;
  onUpload: (file: File) => Promise<void>;
}

const EXAMPLE_TEXTS: Text[] = [
  {
    id: 'example1',
    title: 'The Theory of Relativity',
    content: `Einstein's theory of relativity revolutionized our understanding of space, time, and gravity...`,
    preview: 'An exploration of Einstein\'s groundbreaking physics theory'
  },
  {
    id: 'example2',
    title: 'Introduction to Neural Networks',
    content: `Neural networks are computing systems inspired by biological neural networks...`,
    preview: 'Learn about the fundamentals of neural networks and deep learning'
  },
  // Add more example texts
];

export default function TextSelector({ onSelect, onUpload }: TextSelectorProps) {
  const { user, token } = useAuth();
  const [selectedId, setSelectedId] = useState<string>(EXAMPLE_TEXTS[0].id);
  const [userTexts, setUserTexts] = useState<Text[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load user texts when user is authenticated
  useEffect(() => {
    async function loadUserTexts() {
      if (user && token) {
        try {
          const response = await fetch('/api/documents', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserTexts(data.documents.map((doc: DocumentResponse) => ({
              id: doc.id,
              title: doc.title || 'Untitled Document',
              content: doc.content,
              preview: doc.preview || 'No preview available'
            })));
          }
        } catch (error) {
          console.error('Failed to load user texts:', error);
        }
      }
    }
    loadUserTexts();
  }, [user, token]);

  const handleSelect = (text: Text) => {
    setSelectedId(text.id);
    onSelect(text);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!user || !token) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      await onUpload(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user && token) {
      await onUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Example Texts</h2>
        <div className="grid gap-4">
          {EXAMPLE_TEXTS.map((text) => (
            <div
              key={text.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedId === text.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSelect(text)}
            >
              <h3 className="font-medium">{text.title}</h3>
              <p className="text-sm text-gray-600">{text.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {user && userTexts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Texts</h2>
          <div className="grid gap-4">
            {userTexts.map((text) => (
              <div
                key={text.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedId === text.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleSelect(text)}
              >
                <h3 className="font-medium">{text.title}</h3>
                <p className="text-sm text-gray-600">{text.preview}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`relative p-6 border-2 border-dashed rounded-lg ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (user) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          disabled={!user}
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {user
              ? 'Drag and drop a file or click to upload'
              : 'Sign in to upload your own texts'}
          </p>
        </div>
      </div>
    </div>
  );
}
