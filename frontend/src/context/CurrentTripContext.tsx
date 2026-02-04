/**
 * Current trip name for the app header when user is inside a trip (Layout shows which group they're in).
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface CurrentTripContextValue {
  tripName: string | null;
  setTripName: (name: string | null) => void;
}

const defaultValue: CurrentTripContextValue = {
  tripName: null,
  setTripName: () => {},
};

const CurrentTripContext = createContext<CurrentTripContextValue>(defaultValue);

export function CurrentTripProvider({ children }: { children: ReactNode }) {
  const [tripName, setTripName] = useState<string | null>(null);
  return (
    <CurrentTripContext.Provider value={{ tripName, setTripName }}>
      {children}
    </CurrentTripContext.Provider>
  );
}

export function useCurrentTrip() {
  return useContext(CurrentTripContext);
}
