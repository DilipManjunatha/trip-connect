/**
 * Trip Chat — in-trip messaging at /groups/:id/chat (spec §6.7).
 * Uses useTripFromRoute(); wires Messages as trip-scoped chat.
 */

import React from 'react';
import { useTripFromRoute } from '../context/TripContext';
import Messages from './Messages';

const TripChat: React.FC = () => {
  const { trip, loading, error, groupId } = useTripFromRoute();

  if (loading || error || !groupId) return null;

  return (
    <Messages
      groupId={groupId}
      tripName={trip?.name}
    />
  );
};

export default TripChat;
