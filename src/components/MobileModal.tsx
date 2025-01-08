import React from 'react';

interface MobileModalProps {
  isOpen: boolean;
}

export const MobileModal: React.FC<MobileModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Mobile Version Coming Soon</h2>
        <p className="mb-4">
          This application is currently optimized for desktop use only. 
          Please access it from a desktop computer for the best experience.
        </p>
        <p className="text-sm text-gray-600">
          We&apos;re working on a mobile-friendly version that will be available soon.
        </p>
      </div>
    </div>
  );
};