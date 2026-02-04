/**
 * Trip context — lightweight trip-from-route (spec §3.1, architecture §2.2).
 * Keyed by route id; exposes { trip, loading, error } for TripShell and trip-scoped pages.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { TripGroup } from '../types';

export type TripErrorType = 'network' | 'not_found';

export interface TripContextValue {
  trip: TripGroup | null;
  loading: boolean;
  error: TripErrorType | null;
  groupId: string | null;
  refetch: () => void;
}

const defaultValue: TripContextValue = {
  trip: null,
  loading: false,
  error: null,
  groupId: null,
  refetch: () => {},
};

const TripContext = createContext<TripContextValue>(defaultValue);

/** In-memory cache keyed by group id for instant back-navigation (optional offline later). */
const tripCache = new Map<string, { trip: TripGroup; at: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getCached(id: string): TripGroup | null {
  const entry = tripCache.get(id);
  if (!entry || Date.now() - entry.at > CACHE_TTL_MS) return null;
  return entry.trip;
}

function setCached(id: string, trip: TripGroup) {
  tripCache.set(id, { trip, at: Date.now() });
}

interface TripProviderProps {
  id: string | undefined;
  children: ReactNode;
}

export function TripProvider({ id, children }: TripProviderProps) {
  const [trip, setTrip] = useState<TripGroup | null>(() => (id ? getCached(id) ?? null : null));
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<TripErrorType | null>(null);

  const fetchTrip = useCallback(async () => {
    if (!id) {
      setTrip(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/groups/${id}`);
      const raw = res.data?.data ?? res.data;
      // API returns { data: { group } } — extract group; fallback to raw if it looks like a group (has .name)
      const groupObj = raw?.group ?? (raw && typeof raw.name === 'string' ? raw : null);
      const resolved = groupObj ? { ...groupObj, id: groupObj.id ?? id } : null;
      setTrip(resolved);
      if (resolved) setCached(id, resolved);
      setError(resolved ? null : 'not_found');
    } catch (err: unknown) {
      const isNetwork = (err as { isNetworkError?: boolean }).isNetworkError;
      setError(isNetwork ? 'network' : 'not_found');
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const value: TripContextValue = {
    trip,
    loading,
    error,
    groupId: id ?? null,
    refetch: fetchTrip,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

/**
 * Hook: trip context keyed by route id. Use inside TripShell / trip-scoped routes.
 * Returns { trip, loading, error, groupId, refetch }.
 */
export function useTripFromRoute(): TripContextValue {
  return useContext(TripContext);
}

// Re-export for consumers that need the raw context
export { TripContext };
