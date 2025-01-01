import { requestApproval } from "@/lib/api";
import { useState, useEffect } from "react";

interface DemoLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}
const DemoLimitModal: React.FC<DemoLimitModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [blurb, setBlurb] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (success) {
      onClose();
    }
  }, [success, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await requestApproval(name, email, blurb);
      setSuccess(true);
      setName('');
      setEmail('');
      setBlurb('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white text-black rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Demo Limit Reached</h2>
          <p className="mt-2 text-gray-600">
            You have used all 5 demo messages! To continue using ExplainAI, please request access below.
          </p>
        </div>

        <button 
          type="button"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-800 p-4 mb-6 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-800 p-4 mb-6 rounded-lg border border-green-200">
              Request sent successfully!
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700" htmlFor="blurb">
                How you plan to use ExplainAI
              </label>
              <textarea
                id="blurb"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors min-h-[120px]"
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end mt-8 space-x-4">
            <button
              type="button"
              className="px-6 py-2.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Request Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoLimitModal;