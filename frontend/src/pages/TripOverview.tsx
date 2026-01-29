/**
 * Trip overview — quick links to Expenses, Itinerary, Kanban, Tickets, Chat (spec §6.2).
 * Rendered at /groups/:id when not redirecting to a sub-tab.
 */

import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  MapPinIcon,
  ViewColumnsIcon,
  TicketIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { TripGroup } from '../types';
import { groupExpenses, groupItinerary, groupKanban, groupTickets, groupChat } from '../ux';
import { Button } from '../components/ui';

type OutletContext = { trip: TripGroup; groupId: string };

const TRIP_LINKS = [
  { label: 'Expenses', to: groupExpenses, icon: CurrencyDollarIcon },
  { label: 'Itinerary', to: groupItinerary, icon: MapPinIcon },
  { label: 'Kanban', to: groupKanban, icon: ViewColumnsIcon },
  { label: 'Tickets', to: groupTickets, icon: TicketIcon },
  { label: 'Chat', to: groupChat, icon: ChatBubbleLeftRightIcon },
] as const;

const TripOverview: React.FC = () => {
  const { trip, groupId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

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
