/**
 * MonthGrid — 7-column month grid with date-fns; current day highlight, out-of-month opacity, trip pills.
 * Used by Calendar page (spec §6.9).
 */

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  addDays,
  getDay,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { TripGroup } from '../../types';

const TRIP_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

function getTripColor(index: number): string {
  return TRIP_COLORS[index % TRIP_COLORS.length];
}

function isDateInTripRange(
  day: Date,
  startDate: string | undefined,
  endDate: string | undefined
): boolean {
  if (!startDate) return false;
  const start = startOfDay(parseISO(startDate));
  const end = endDate ? endOfDay(parseISO(endDate)) : endOfDay(start);
  return isWithinInterval(day, { start, end });
}

function getDaysInMonthView(year: number, month: number): (Date | null)[][] {
  const viewDate = new Date(year, month, 1);
  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);
  const startPad = getDay(first);
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];

  for (let i = 0; i < totalCells; i++) {
    if (i < startPad) {
      cells.push(null);
    } else if (i < startPad + daysInMonth) {
      cells.push(addDays(first, i - startPad));
    } else {
      cells.push(null);
    }
  }

  const rows: (Date | null)[][] = [];
  for (let r = 0; r < totalCells / 7; r++) {
    rows.push(cells.slice(r * 7, (r + 1) * 7));
  }
  return rows;
}

export interface MonthGridProps {
  year: number;
  month: number;
  today: Date;
  groups: TripGroup[];
  onTripClick: (groupId: string) => void;
}

export default function MonthGrid({
  year,
  month,
  today,
  groups,
  onTripClick,
}: MonthGridProps) {
  const weekRows = useMemo(() => getDaysInMonthView(year, month), [year, month]);

  return (
    <div
      className="grid auto-rows-fr min-h-[360px] flex-1 w-full min-w-0 overflow-hidden box-border"
      style={{
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {weekRows.map((row, rowIdx) =>
        row.map((day, colIdx) => {
          const isCurrentMonth = day ? isSameMonth(day, new Date(year, month, 1)) : false;
          const isToday = day ? isSameDay(day, today) : false;
          const tripsOnDay =
            day && groups.filter((g) => isDateInTripRange(day, g.startDate, g.endDate));
          const isLastCol = colIdx === 6;
          /* Inset right shadow as divider so it doesn't add to layout width (avoids last column overflow) */
          const dividerShadow = isLastCol ? 'none' : 'inset -1px 0 0 0 rgb(243 244 246)';

          return (
            <div
              key={rowIdx * 7 + colIdx}
              className={`
                min-h-[80px] sm:min-h-[100px] border-b border-gray-100 p-1 flex flex-col min-w-0 overflow-hidden box-border
                ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                ${isToday ? 'ring-1 ring-inset ring-primary-500 bg-primary-50/30' : ''}
              `}
              style={{ boxShadow: dividerShadow }}
            >
              <div
                className={`
                  text-sm font-medium size-8 min-w-0 max-w-full flex items-center justify-center rounded-full shrink-0
                  ${!isCurrentMonth ? 'text-gray-400 opacity-60' : 'text-gray-700'}
                  ${isToday ? 'bg-primary-600 text-white' : ''}
                `}
              >
                {day ? day.getDate() : ''}
              </div>
              <div className="flex-1 overflow-hidden mt-0.5 space-y-0.5">
                {tripsOnDay && tripsOnDay.length > 0 ? (
                  tripsOnDay.slice(0, 3).map((trip, i) => (
                    <button
                      key={trip.id}
                      type="button"
                      data-calendar-trip
                      onClick={() => onTripClick(trip.id)}
                      className={`
                        relative z-10 w-full text-left px-1.5 py-0.5 rounded text-xs font-medium text-white truncate
                        hover:opacity-90 transition focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                        ${getTripColor(i)}
                      `}
                      title={`${trip.name}${trip.destination ? ` · ${trip.destination}` : ''}`}
                    >
                      {trip.name}
                    </button>
                  ))
                ) : null}
                {tripsOnDay && tripsOnDay.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">+{tripsOnDay.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
