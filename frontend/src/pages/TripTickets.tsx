/**
 * Trip Tickets — placeholder (spec §6.6). Full list + smart cards in Phase 3.
 */

import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { TicketIcon } from '@heroicons/react/24/outline';
import type { TripGroup } from '../types';

type OutletContext = { trip: TripGroup; groupId: string };

const TripTickets: React.FC = () => {
  const { trip } = useOutletContext<OutletContext>();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TicketIcon className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-lg font-medium text-gray-900 mb-1">Tickets & documents</h2>
      <p className="text-gray-500 max-w-sm">
        Store tickets and smart info cards for <strong>{trip.name}</strong>. Coming in a future update.
      </p>
    </div>
  );
};

export default TripTickets;
