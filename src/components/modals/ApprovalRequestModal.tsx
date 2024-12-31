import React, { useEffect, useState } from 'react';
import { requestApproval } from '@/lib/api';  // Adjust import path as needed

interface ApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApprovalRequestModal: React.FC<ApprovalRequestModalProps> = ({ isOpen, onClose }) => {
  // Local state for form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [blurb, setBlurb] = useState('');

  // State for loading, error, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * If you want the modal to close automatically once
   * the request is successfully submitted, you can
   * do so in a useEffect, which must be outside of
   * any conditional logic to avoid lint errors.
   */
  useEffect(() => {
    if (success) {
      onClose();
    }
  }, [success, onClose]);

  // Return nothing if the modal is closed
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await requestApproval(name, email, blurb);
      setSuccess(true);

      // Optionally clear form fields
      setName('');
      setEmail('');
      setBlurb('');
    } catch (err: unknown) {
      // Type-guard the error if it's an instance of Error
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative bg-white text-black rounded-lg p-6 max-w-sm w-full shadow-lg">
        
        <h2 className="text-lg font-bold mb-2">Request Access</h2>
        <p className="mb-4">
          Currently, ExplainAI is available to approved emails or emails under a Stanford domain.
          If you would like to request approval, please provide your name, email, and a short blurb
          about what you hope to use the service for.
        </p>

        {/* Close button (positioned top-right) */}
        <button 
          type="button"
          className="absolute top-4 right-4 text-xl leading-none hover:text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 text-red-800 p-2 mb-2 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-800 p-2 mb-2 rounded">
              Request sent successfully!
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="blurb">
              How you plan to use it
            </label>
            <textarea
              id="blurb"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              className="bg-gray-300 text-black font-semibold py-2 px-4 rounded mr-2"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalRequestModal;