// components/modals/DemoLimitModal.tsx
interface DemoLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoLimitModal: React.FC<DemoLimitModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white text-black rounded-xl p-8 max-w-2xl w-full shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Demo Limit Reached</h2>
          <p className="mt-2 text-gray-600">
            You reached the limit of 5 messages in demo mode. Sign up to continue using ExplainAI with unlimited messages and your own documents!
          </p>
        </div>

        <button 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center justify-end mt-8 space-x-4">
          <button
            className="px-6 py-2.5 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Continue in Demo
          </button>
          <button
            className="px-6 py-2.5 rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 transition-colors"
            onClick={() => {
              onClose();
              // Open your approval request modal or redirect to sign up
              // You can handle this based on your app's flow
            }}
          >
            Request Access
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoLimitModal;