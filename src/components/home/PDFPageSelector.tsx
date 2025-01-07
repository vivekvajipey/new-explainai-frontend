import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PDFPageSelectorProps {
  file: File;
  onConfirm: (selectedPages: number[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function PDFPageSelector({
  file,
  onConfirm,
  onCancel,
  isOpen
}: PDFPageSelectorProps) {
  console.log('PDFPageSelector rendered with:', { 
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file?.size,
    isOpen 
  });
  
  const [totalPages, setTotalPages] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [error, setError] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPDF = async () => {
      console.log('Loading PDF:', file.name);
      try {
        setIsLoading(true);
        setError('');
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('File converted to ArrayBuffer');
        
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        console.log('PDF loaded, pages:', pdf.numPages);
        
        setTotalPages(pdf.numPages);
        // Initially select all pages up to max
        const initialPages = Array.from(
          { length: Math.min(pdf.numPages, 8) }, 
          (_, i) => i + 1
        );
        setSelectedPages(initialPages);
        setRangeInput(initialPages.length === 1 ? '1' : `1-${initialPages.length}`);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Error loading PDF. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (file && isOpen) {
      console.log('Starting PDF load process');
      loadPDF().catch(err => {
        console.error('Unhandled error in loadPDF:', err);
        setError('Unexpected error loading PDF');
        setIsLoading(false);
      });
    } else {
      console.log('Not loading PDF:', { hasFile: !!file, isOpen });
    }
  }, [file, isOpen]);

  const parsePageRanges = (input: string): { pages: number[], error?: string } => {
    if (!input.trim()) {
      return { pages: [], error: 'Please enter page numbers' };
    }

    const pages = new Set<number>();
    const ranges = input.split(',').map(r => r.trim());

    for (const range of ranges) {
      if (range.includes('-')) {
        const [startStr, endStr] = range.split('-').map(s => s.trim());
        
        // Allow partial ranges during typing
        if (!endStr) {
          return { pages: Array.from(pages), error: 'Incomplete range' };
        }
        
        const start = Number(startStr);
        const end = Number(endStr);
        
        if (isNaN(start) || isNaN(end)) {
          return { pages: Array.from(pages), error: 'Invalid number in range' };
        }
        
        if (start < 1 || end > totalPages) {
          return { pages: Array.from(pages), error: `Pages must be between 1 and ${totalPages}` };
        }
        
        if (start > end) {
          return { pages: Array.from(pages), error: 'Start page must be less than end page' };
        }
        
        for (let i = start; i <= end; i++) {
          pages.add(i);
        }
      } else {
        if (!range) continue; // Skip empty entries
        
        const page = Number(range);
        if (isNaN(page)) {
          return { pages: Array.from(pages), error: 'Invalid page number' };
        }
        
        if (page < 1 || page > totalPages) {
          return { pages: Array.from(pages), error: `Pages must be between 1 and ${totalPages}` };
        }
        
        pages.add(page);
      }
    }

    if (pages.size === 0) {
      return { pages: [], error: 'Please select at least one page' };
    }

    if (pages.size > 8) {
      return { pages: Array.from(pages), error: 'Please select no more than 8 pages' };
    }

    return { pages: Array.from(pages).sort((a, b) => a - b) };
  };

  const handleRangeInput = (value: string) => {
    setRangeInput(value);
    const { pages, error } = parsePageRanges(value);
    setSelectedPages(pages);
    setValidationError(error || '');
  };

  const handleConfirm = () => {
    const { pages, error } = parsePageRanges(rangeInput);
    if (error) {
      setValidationError(error);
      return;
    }
    onConfirm(pages);
  };

  if (!isOpen) {
    console.log('PDFPageSelector not open');
    return null;
  }

  console.log('Rendering PDFPageSelector UI');
  return (
    <div className="flex items-center justify-center p-4 z-[9999]">
      <div className="bg-card-bg rounded-xl p-6 max-w-lg w-full shadow-xl border border-card-border">
        <h2 className="text-xl font-bold mb-4">Select Pages to Read</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-input-focus"></div>
            <span className="ml-2">Loading PDF...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">
            {error}
            <button
              onClick={onCancel}
              className="mt-4 w-full px-4 py-2 rounded-lg text-button-cancel-text 
                       bg-button-cancel-bg hover:bg-button-cancel-hover
                       transition-colors duration-200"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter page numbers or ranges (e.g., 1-3, 5, 7-8)
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input-border 
                       bg-input-bg focus:outline-none focus:ring-2 
                       focus:ring-input-focus"
              placeholder="e.g., 1-3, 5, 7-8"
            />
            {validationError && (
              <p className="text-amber-500 text-sm mt-1">{validationError}</p>
            )}
            <p className="text-sm text-sand-500 mt-2">
              Total pages: {totalPages} (Maximum 8 pages can be selected)
            </p>
            {selectedPages.length > 0 && !validationError && (
              <p className="text-sm text-sand-500 mt-1">
                Selected: {selectedPages.join(', ')}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-button-cancel-text 
                       bg-button-cancel-bg hover:bg-button-cancel-hover
                       transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedPages.length || !!validationError}
              className="px-4 py-2 rounded-lg text-button-upload-text 
                       bg-button-upload-bg hover:bg-button-upload-hover
                       transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
