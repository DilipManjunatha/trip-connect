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
} from '@heroicons/react/24/outline';
import { useTripFromRoute } from '../context/TripContext';
import { groupExpenses, groupItinerary, groupKanban, groupTickets, groupChat } from '../ux';
import { Button } from '../components/ui';

const TRIP_LINKS = [
  { label: 'Expenses', to: groupExpenses, icon: CurrencyDollarIcon },
  { label: 'Itinerary', to: groupItinerary, icon: MapPinIcon },
  { label: 'Tasks', to: groupKanban, icon: ViewColumnsIcon },
  { label: 'Tickets', to: groupTickets, icon: TicketIcon },
  { label: 'Chat', to: groupChat, icon: ChatBubbleLeftRightIcon },
] as const;

const TripOverview: React.FC = () => {
  const { trip, loading, error, groupId, refetch } = useTripFromRoute();
  const navigate = useNavigate();

  if (loading || !trip || !groupId) {
    if (error) return null; // TripShell already shows error UI
    return (
      <div className="flex justify-center items-center min-h-[120px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trip.description && (
        <p className="text-gray-600">{trip.description}</p>
      )}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-3">Quick links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
