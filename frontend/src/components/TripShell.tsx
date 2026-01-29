/**
 * TripShell — wraps all /groups/:id/... routes (TRIP_CONNECT_UI_UX_SPEC §3.1, §5.4).
 * Reads id from useParams(), fetches/caches trip for header/breadcrumb, renders sub-nav (tabs).
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ChevronLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ViewColumnsIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { TripGroup } from '../types';
import { ROUTES, group, groupExpenses, groupItinerary, groupKanban, groupTickets, groupChat } from '../ux';
import DelightfulError from './DelightfulError';
import { Button } from './ui';

const TRIP_SUB_NAV = [
  { label: 'Overview', to: (id: string) => group(id), icon: HomeIcon },
  { label: 'Expenses', to: (id: string) => groupExpenses(id), icon: CurrencyDollarIcon },
  { label: 'Itinerary', to: (id: string) => groupItinerary(id), icon: MapPinIcon },
  { label: 'Kanban', to: (id: string) => groupKanban(id), icon: ViewColumnsIcon },
  { label: 'Tickets', to: (id: string) => groupTickets(id), icon: TicketIcon },
  { label: 'Chat', to: (id: string) => groupChat(id), icon: ChatBubbleLeftRightIcon },
] as const;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const TripShell: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate(ROUTES.GROUPS, { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setNetworkError(false);
        const res = await api.get(`/groups/${id}`);
        const data = res.data?.data ?? res.data;
        if (!cancelled && data) {
          setTrip(typeof data.id !== 'undefined' ? data : { ...data, id });
        } else {
          setTrip(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const isNetwork = (err as { isNetworkError?: boolean }).isNetworkError;
          setNetworkError(!!isNetwork);
          setTrip(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!id) return null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          setLoading(true);
          api.get(`/groups/${id}`).then((res) => {
            const data = res.data?.data ?? res.data;
            setTrip(data ? { ...data, id } : null);
          }).catch(() => setNetworkError(true)).finally(() => setLoading(false));
        }}
      />
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Trip not found.</p>
        <Button onClick={() => navigate(ROUTES.GROUPS)} variant="outline">
          Back to Trips
        </Button>
      </div>
    );
  }

  const dates =
    trip.startDate && trip.endDate
      ? `${new Date(trip.startDate).toLocaleDateString()} – ${new Date(trip.endDate).toLocaleDateString()}`
      : trip.startDate
        ? new Date(trip.startDate).toLocaleDateString()
        : null;

  return (
    <div className="space-y-4">
      {/* Breadcrumb / header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.GROUPS)}
            className="shrink-0 p-1"
            aria-label="Back to trips"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{trip.name}</h1>
            {(trip.destination || dates) && (
              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                {trip.destination && <span>{trip.destination}</span>}
                {trip.destination && dates && <span>·</span>}
                {dates && (
                  <span className="inline-flex items-center gap-0.5">
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    {dates}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sub-nav (tabs / horizontal nav) */}
      <nav
        className="flex gap-0 border-b border-gray-200 overflow-x-auto"
        aria-label="Trip sections"
      >
        {TRIP_SUB_NAV.map(({ label, to, icon: Icon }) => {
          const href = to(id);
          return (
            <NavLink
              key={label}
              to={href}
              end={label === 'Overview'}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap min-h-[44px]',
                  isActive
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Nested route content */}
      <Outlet context={{ trip, groupId: id }} />
    </div>
  );
};

export default TripShell;
