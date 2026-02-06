/**
 * Trip overview — quick links to Expenses, Itinerary, Kanban, Tickets, Chat (spec §6.2).
 * Rendered at /groups/:id when not redirecting to a sub-tab.
 * Uses useTripFromRoute() for trip data (spec §3.1).
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  MapPinIcon,
  ViewColumnsIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useTripFromRoute } from '../context/TripContext';
import { groupExpenses, groupItinerary, groupKanban, groupTickets, groupChat } from '../ux';
import { Button } from '../components/ui';
import type { TripGroup } from '../types';

const TRIP_LINKS = [
  { label: 'Expenses', to: groupExpenses, icon: CurrencyDollarIcon },
  { label: 'Itinerary', to: groupItinerary, icon: MapPinIcon },
  { label: 'Tasks', to: groupKanban, icon: ViewColumnsIcon },
  { label: 'Tickets', to: groupTickets, icon: TicketIcon },
  { label: 'Chat', to: groupChat, icon: ChatBubbleLeftRightIcon },
] as const;

function formatDDMMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDates(trip: TripGroup): string | null {
  if (trip.startDate && trip.endDate)
    return `${formatDDMMMYYYY(trip.startDate)} – ${formatDDMMMYYYY(trip.endDate)}`;
  if (trip.startDate) return formatDDMMMYYYY(trip.startDate);
  return null;
}

const STATUS_LABELS: Record<TripGroup['status'], string> = {
  PLANNING: 'Planning',
  CONFIRMED: 'Confirmed',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_STYLES: Record<TripGroup['status'], string> = {
  PLANNING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  ONGOING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-800',
};

/** Description longer than this gets "See more" to keep quick links above the fold. */
const DESCRIPTION_TRUNCATE_CHARS = 160;

const TripOverview: React.FC = () => {
  const { trip, loading, error, groupId } = useTripFromRoute();
  const navigate = useNavigate();
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

  if (loading || !trip || !groupId) {
    if (error) return null; // TripShell already shows error UI
    return (
      <div className="flex justify-center items-center min-h-[120px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const dates = formatDates(trip);
  const memberCount = trip._count?.members ?? trip.members?.length ?? 0;
  const expenseCount = trip._count?.expenses ?? trip.expenses?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Trip details hero — compact so quick links fit above the fold */}
      <section className="rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
        {trip.coverImage && (
          <div className="aspect-[21/9] w-full bg-gray-200">
            <img
              src={trip.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[trip.status]}`}
            >
              {STATUS_LABELS[trip.status]}
            </span>
            {trip.budget != null && (
              <span className="text-sm text-gray-500">
                Budget: <span className="font-medium text-gray-700">{typeof trip.budget === 'number' ? `$${trip.budget.toLocaleString()}` : trip.budget}</span>
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-0.5">{trip.name}</h2>
          {(dates || trip.destination) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {dates && (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  {dates}
                </span>
              )}
              {trip.destination && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  {trip.destination}
                </span>
              )}
            </div>
          )}
          {trip.description && (() => {
            const isLong = trip.description.length > DESCRIPTION_TRUNCATE_CHARS;
            const showExpand = isLong && !descriptionExpanded;
            const showCollapse = isLong && descriptionExpanded;
            return (
              <div className="mt-2">
                <p
                  className={showExpand ? 'text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2' : 'text-gray-600 text-sm sm:text-base leading-relaxed'}
                >
                  {trip.description}
                </p>
                {showExpand && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(true)}
                    className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
                  >
                    See more
                  </button>
                )}
                {showCollapse && (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded(false)}
                    className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:underline"
                  >
                    See less
                  </button>
                )}
              </div>
            );
          })()}
          {(memberCount > 0 || expenseCount > 0) && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              {memberCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <UserGroupIcon className="h-4 w-4" />
                  {memberCount} {memberCount === 1 ? 'participant' : 'participants'}
                </span>
              )}
              {expenseCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <div>
        <h2 className="text-base font-medium text-gray-900 mb-2">Quick links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TRIP_LINKS.map(({ label, to, icon: Icon }) => (
            <Button
              key={label}
              variant="outline"
              className="justify-start"
              onClick={() => navigate(to(groupId))}
              leftIcon={<Icon className="h-5 w-5" />}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      {trip.members && trip.members.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            Participants ({trip.members.length})
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            {trip.members.slice(0, 8).map((m) => {
              const name = m.contact
                ? `${m.contact.firstName} ${m.contact.lastName}`
                : m.user
                  ? `${m.user.firstName} ${m.user.lastName}`
                  : 'Unknown';
              return <li key={m.id}>{name}</li>;
            })}
            {trip.members.length > 8 && (
              <li className="text-gray-500">+{trip.members.length - 8} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TripOverview;
