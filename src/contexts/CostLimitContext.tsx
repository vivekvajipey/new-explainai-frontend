import React, { createContext, useContext, useState, useCallback } from 'react';
import { CostLimitModal } from '@/components/CostLimitModal';

interface CostLimitError {
  error: string;
  user_cost: number;
  cost_limit: number;
  message?: string;
}

interface APIErrorResponse {
  status: number;
  data?: CostLimitError;
}

interface CostLimitContextType {
  handleError: (error: unknown) => boolean;
}

const CostLimitContext = createContext<CostLimitContextType | null>(null);

export const useCostLimit = () => {
  const context = useContext(CostLimitContext);
  if (!context) throw new Error('useCostLimit must be used within CostLimitProvider');
  return context;
};

export const CostLimitProvider = ({ children }: { children: React.ReactNode }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    userCost: 0,
    costLimit: 0,
  });

  const handleError = useCallback((error: unknown): boolean => {
    console.log('CostLimitContext: Checking error', error);

    try {
      // Handle string-encoded websocket error
      if (typeof error === 'object' && error !== null && 'data' in error) {
        const wsError = error as { data?: { error?: string } };
        if (wsError.data?.error && typeof wsError.data.error === 'string' && wsError.data.error.startsWith('402:')) {
          const errorData = JSON.parse(wsError.data.error.substring(4).replace(/'/g, '"')) as CostLimitError;
          console.log('CostLimitContext: Parsed WebSocket error', errorData);
          if (errorData.error === 'cost_limit_exceeded') {
            setModalState({
              isOpen: true,
              userCost: errorData.user_cost,
              costLimit: errorData.cost_limit,
            });
            return true;
          }
        }
      }

      // Handle axios/fetch error response
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: APIErrorResponse };
        console.log('CostLimitContext: Checking API error response', axiosError.response);
        if (axiosError.response?.status === 402 && axiosError.response?.data?.error === 'cost_limit_exceeded') {
          setModalState({
            isOpen: true,
            userCost: axiosError.response.data.user_cost,
            costLimit: axiosError.response.data.cost_limit,
          });
          return true;
        }
      }
    } catch (e) {
      console.error('CostLimitContext: Error parsing error', e);
    }

    return false;
  }, []);

  return (
    <CostLimitContext.Provider value={{ handleError }}>
      {children}
      <CostLimitModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
        userCost={modalState.userCost}
        costLimit={modalState.costLimit}
      />
    </CostLimitContext.Provider>
  );
};
