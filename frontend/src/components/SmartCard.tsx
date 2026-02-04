/**
 * Smart Info Card for tickets (spec §6.6, §7.1).
 * Compact, scannable card: carrier, time, seat, gate, PNR. Types: ticket, hotel, bill, booking, document.
 */

import React from 'react';
import {
  PaperAirplaneIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BookOpenIcon,
  DocumentIcon,
  ShareIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';
import type { Ticket, TicketType } from '../types';

const TYPE_ICONS: Record<TicketType, React.ComponentType<{ className?: string }>> = {
  TICKET: PaperAirplaneIcon,
  HOTEL: BuildingOfficeIcon,
  BILL: DocumentTextIcon,
  BOOKING: BookOpenIcon,
  DOCUMENT: DocumentIcon,
};

export interface SmartCardProps {
  ticket: Ticket;
  onOpenFull?: (ticket: Ticket) => void;
  onShare?: (ticket: Ticket) => void;
  compact?: boolean;
  className?: string;
}

export function SmartCard({ ticket, onOpenFull, onShare, compact, className = '' }: SmartCardProps) {
  const ocr = ticket.ocrData;
  const Icon = TYPE_ICONS[ticket.type] || DocumentIcon;

  return (
    <div
      className={`rounded-xl border-2 border-gray-200 bg-white shadow-sm overflow-hidden ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-50 p-2">
            <Icon className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{ticket.title}</p>
            {ticket.category && (
              <p className="text-xs text-gray-500">{ticket.category}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {onOpenFull && (
            <button
              type="button"
              onClick={() => onOpenFull(ticket)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Open full"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={() => onShare(ticket)}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title="Share"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {ocr && (ticket.ocrStatus === 'COMPLETED' || ticket.ocrStatus === 'PENDING') && (
        <dl className={`grid grid-cols-2 gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100 ${compact ? 'text-xs' : 'text-sm'}`}>
          {ocr.carrier && (
            <>
              <dt className="text-gray-500">Carrier</dt>
              <dd className="font-medium text-gray-900">{ocr.carrier}</dd>
            </>
          )}
          {(ocr.departureTime || ocr.arrivalTime) && (
            <>
              <dt className="text-gray-500">Time</dt>
              <dd className="font-medium text-gray-900">
                {[ocr.departureTime, ocr.arrivalTime].filter(Boolean).join(' – ')}
              </dd>
            </>
          )}
          {ocr.seat && (
            <>
              <dt className="text-gray-500">Seat</dt>
              <dd className="font-medium text-gray-900">{ocr.seat}</dd>
            </>
          )}
          {ocr.gate && (
            <>
              <dt className="text-gray-500">Gate</dt>
              <dd className="font-medium text-gray-900">{ocr.gate}</dd>
            </>
          )}
          {ocr.pnr && (
            <>
              <dt className="text-gray-500">PNR</dt>
              <dd className="font-mono font-medium text-gray-900">{ocr.pnr}</dd>
            </>
          )}
          {ocr.flightNumber && (
            <>
              <dt className="text-gray-500">Flight</dt>
              <dd className="font-medium text-gray-900">{ocr.flightNumber}</dd>
            </>
          )}
        </dl>
      )}

      {(!ocr || ticket.ocrStatus === 'NONE' || ticket.ocrStatus === 'FAILED') && (
        <p className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          No scan data yet. Process OCR to show carrier, time, seat, gate, PNR.
        </p>
      )}
    </div>
  );
}

export default SmartCard;
