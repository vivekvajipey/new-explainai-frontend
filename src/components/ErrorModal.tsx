import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-red-600 text-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h2 className="text-lg font-bold mb-2">Error</h2>
        <p>{message}</p>
        <button
          className="mt-4 bg-white text-red-600 font-semibold py-2 px-4 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
