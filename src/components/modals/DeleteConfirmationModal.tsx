// src/components/modals/DeleteConfirmationModal.tsx
import { useState } from 'react';
import { Document } from '@/types';

interface DeleteConfirmationModalProps {
  document: Document | null;
  userEmail: string | undefined;
  onConfirm: (document: Document) => Promise<void>;
  onClose: () => void;
}

export function DeleteConfirmationModal({
  document,
  userEmail,
  onConfirm,
  onClose
}: DeleteConfirmationModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!document || !userEmail) return null;

  const handleConfirmDelete = async () => {
    if (confirmEmail !== userEmail) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(document);
      setConfirmEmail('');
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-sand-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card-bg rounded-xl p-6 max-w-md w-full border border-card-border">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Delete Document
        </h3>
        <p className="text-sand-600 dark:text-sand-400 mb-4">
          This action cannot be undone. To confirm deletion of &ldquo;{document.title}&rdquo;, 
          please type your email address: {userEmail}
        </p>
        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-2 rounded-lg border border-input-border 
                   bg-input-bg text-input-text mb-4
                   focus:outline-none focus:ring-2 focus:ring-input-focus"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sand-600 hover:text-sand-700 
                     dark:text-sand-400 dark:hover:text-sand-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={confirmEmail !== userEmail || isDeleting}
            className={`px-4 py-2 rounded-lg ${
              confirmEmail === userEmail && !isDeleting
                ? 'bg-error hover:bg-rose-700 text-white'
                : 'bg-sand-300 text-sand-500 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete Document'}
          </button>
        </div>
      </div>
    </div>
  );
}