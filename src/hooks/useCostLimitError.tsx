import { useState } from 'react';
import { CostLimitModal } from '../components/CostLimitModal';

interface CostLimitError {
  response?: {
    status: number;
    data: {
      error: string;
      user_cost: number;
      cost_limit: number;
    };
  };
}

export const useCostLimitError = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    userCost: 0,
    costLimit: 0,
  });

  const handleError = (error: CostLimitError) => {
    if (error?.response?.status === 402 && error?.response?.data?.error === 'cost_limit_exceeded') {
      setModalState({
        isOpen: true,
        userCost: error.response.data.user_cost,
        costLimit: error.response.data.cost_limit,
      });
      return true;
    }
    return false;
  };

  const modal = (
    <CostLimitModal
      isOpen={modalState.isOpen}
      onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      userCost={modalState.userCost}
      costLimit={modalState.costLimit}
    />
  );

  return { handleError, CostLimitModal: modal };
};
