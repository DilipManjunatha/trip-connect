import { useState, useEffect } from 'react';

export const useProductTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem('productTourCompleted') === 'true';
  });

  useEffect(() => {
    // Auto-start tour for first-time users after a short delay
    const timer = setTimeout(() => {
      if (!hasCompletedTour) {
        setRun(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasCompletedTour]);

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
  };

  const completeTour = () => {
    setRun(false);
    setHasCompletedTour(true);
    localStorage.setItem('productTourCompleted', 'true');
  };

  const resetTour = () => {
    setHasCompletedTour(false);
    localStorage.removeItem('productTourCompleted');
    setStepIndex(0);
    setRun(true);
  };

  return {
    run,
    stepIndex,
    setStepIndex,
    hasCompletedTour,
    startTour,
    stopTour,
    completeTour,
    resetTour,
  };
};
