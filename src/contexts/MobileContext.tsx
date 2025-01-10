import React, { createContext, useContext, useState, useEffect } from 'react';
import { MobileModal } from '@/components/MobileModal';

interface MobileContextType {
  isMobile: boolean;
}

const MobileContext = createContext<MobileContextType | null>(null);

export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) throw new Error('useMobile must be used within MobileProvider');
  return context;
};

export const MobileProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 768px (typical mobile breakpoint)
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowModal(mobile);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If mobile, show modal and prevent access to app
  if (isMobile) {
    return <MobileModal isOpen={showModal} />;
  }

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};