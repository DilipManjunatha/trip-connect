/**
 * TripShell — wraps all /groups/:id/... routes (TRIP_CONNECT_UI_UX_SPEC §3.1, §5.4).
 * Uses TripContext (useTripFromRoute) for trip data; renders sub-nav (tabs).
 */

import React from 'react';
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
import { TripProvider, useTripFromRoute } from '../context/TripContext';
import { ROUTES, group, groupExpenses, groupItinerary, groupKanban, groupTickets, groupChat } from '../ux';
import DelightfulError from './DelightfulError';
import { Button } from './ui';

/** Trip section nav items (spec §5.4). Shared for top tabs (desktop) and bottom bar (mobile). */
const TRIP_SUB_NAV = [
  { label: 'Overview', to: (id: string) => group(id), icon: HomeIcon },
  { label: 'Expenses', to: (id: string) => groupExpenses(id), icon: CurrencyDollarIcon },
  { label: 'Itinerary', to: (id: string) => groupItinerary(id), icon: MapPinIcon },
  { label: 'Tasks', to: (id: string) => groupKanban(id), icon: ViewColumnsIcon },
  { label: 'Tickets', to: (id: string) => groupTickets(id), icon: TicketIcon },
  { label: 'Chat', to: (id: string) => groupChat(id), icon: ChatBubbleLeftRightIcon },
] as const;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/** Format date as DD MMM YYYY (e.g. 02 Jan 2026). */
function formatDDMMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function TripShellContent() {
  const navigate = useNavigate();
  const { trip, loading, error, groupId, refetch } = useTripFromRoute();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error === 'network') {
    return (
      <DelightfulError
        onRetry={() => {
          refetch();
        }}
      />
    );
  }

  if (error === 'not_found' || !trip || !groupId) {
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
      ? `${formatDDMMMYYYY(trip.startDate)} – ${formatDDMMMYYYY(trip.endDate)}`
      : trip.startDate
        ? formatDDMMMYYYY(trip.startDate)
        : null;

  return (
    <div className="space-y-0">
      {/* Sticky trip context bar — shows trip name */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.GROUPS)}
            className="shrink-0 min-h-touch min-w-touch flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900"
            aria-label="Back to trips"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate" title={trip.name}>
              {trip.name}
            </h1>
              {dates && (
                <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {dates}
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Sub-nav: scrollable top tabs on all viewports (mobile-first; avoids a second bottom bar). */}
      <nav
        className="flex gap-0 border-b border-gray-200 overflow-x-auto -mx-4 pl-0 pr-4 sm:-mx-6 sm:pl-0 sm:pr-6 md:mx-0 md:px-0"
        aria-label="Trip sections"
      >
        {TRIP_SUB_NAV.map(({ label, to, icon: Icon }) => {
          const href = to(groupId);
          return (
            <NavLink
              key={label}
              to={href}
              end={label === 'Overview'}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-1 px-2 py-2 sm:px-3 md:px-3 text-sm font-medium border-b-2 whitespace-nowrap min-h-[40px] shrink-0',
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

      {/* Nested route content — minimal top spacing so overview quick links fit above fold */}
      <div className="pt-2">
        <Outlet context={{ trip, groupId }} />
      </div>
    </div>
  );
}

const TripShell: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!id) {
      navigate(ROUTES.GROUPS, { replace: true });
    }
  }, [id, navigate]);

  if (!id) return null;

  return (
    <TripProvider id={id}>
      <TripShellContent />
    </TripProvider>
  );
};

export default TripShell;
