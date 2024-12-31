import React from 'react';

interface CostLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCost: number;
  costLimit: number;
}

export const CostLimitModal: React.FC<CostLimitModalProps> = ({
  isOpen,
  onClose,
  userCost,
  costLimit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Cost Limit Exceeded</h2>
        <p className="mb-4">
          You&apos;ve reached your usage limit (${costLimit.toFixed(2)}). Current usage: ${userCost.toFixed(2)}
        </p>
        <p className="mb-4">
          To increase your limit, please contact:
          <br />
          • Email: jaidenreddy@gmail.com or vivekvajipey@gmail.com
          <br />
          • Venmo: @Jaiden-Reddy
        </p>
        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};
