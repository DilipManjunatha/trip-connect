/**
 * Itinerary flowchart view — lazy-loaded visual sequence (spec §6.4).
 * Same stops with order and location; tap stop for detail.
 */

import React from 'react';
import { MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface ItineraryStop {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime?: string | null;
  notes?: string | null;
}

interface ItineraryFlowchartProps {
  items: ItineraryStop[];
  onSelectItem: (item: ItineraryStop) => void;
}

const ItineraryFlowchart: React.FC<ItineraryFlowchartProps> = ({ items, onSelectItem }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <p>No stops to show. Add activities in the timeline.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto py-4">
      <div className="flex items-stretch gap-0 min-w-max px-2">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              type="button"
              onClick={() => onSelectItem(item)}
              className="flex flex-col items-center text-left w-44 shrink-0 group"
            >
              <div className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-primary-400 hover:shadow transition w-full min-h-[80px] flex flex-col justify-center">
                <span className="text-xs font-medium text-primary-600">Stop {index + 1}</span>
                <p className="font-semibold text-gray-900 truncate mt-0.5">{item.title}</p>
                {item.location && (
                  <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                    {item.location}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.startTime).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </button>
            {index < items.length - 1 && (
              <div className="flex items-center shrink-0 w-8 self-center">
                <ChevronDownIcon className="h-8 w-8 text-gray-300 rotate-[-90deg] md:rotate-0" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">Tap a stop to edit</p>
    </div>
  );
};

export default ItineraryFlowchart;
