/**
 * Calendar — month view, trip date ranges (spec §6.9, §10.1).
 * BOARD layout, lazy-loaded. Smooth horizontal swipe (follow finger, glide snap) like Google Calendar.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { TripGroup } from '../types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import { ROUTES } from '../ux';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TRIP_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
];

const SWIPE_THRESHOLD_RATIO = 0.15;
const SWIPE_THRESHOLD_PX = 50;
const SNAP_DURATION_MS = 280;

function getTripColor(index: number): string {
  return TRIP_COLORS[index % TRIP_COLORS.length];
}

function isDateInRange(date: Date, start: string | undefined, end: string | undefined): boolean {
  if (!start) return false;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = end ? new Date(end) : new Date(s);
  e.setHours(23, 59, 59, 999);
  return d >= s && d <= e;
}

function getDaysInMonthView(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startPad) {
      cells.push(null);
    } else if (i < startPad + daysInMonth) {
      cells.push(new Date(year, month, i - startPad + 1));
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

function addMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 11) {
    m -= 12;
    y += 1;
  }
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  return { year: y, month: m };
}

interface MonthGridProps {
  year: number;
  month: number;
  today: Date;
  groups: TripGroup[];
  onTripClick: (groupId: string) => void;
}

function MonthGrid({ year, month, today, groups, onTripClick }: MonthGridProps) {
  const weekRows = useMemo(() => getDaysInMonthView(year, month), [year, month]);

  return (
    <div className="grid grid-cols-7 auto-rows-fr min-h-[360px] flex-1">
      {weekRows.map((row, rowIdx) =>
        row.map((day, colIdx) => {
          const isCurrentMonth = day && day.getMonth() === month;
          const isToday =
            day &&
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear();
          const tripsOnDay =
            day && groups.filter((g) => isDateInRange(day, g.startDate, g.endDate));

          return (
            <div
              key={rowIdx * 7 + colIdx}
              className={`
                min-h-[80px] sm:min-h-[100px] border-b border-r border-gray-100 p-1 flex flex-col
                ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                ${isToday ? 'ring-1 ring-inset ring-primary-500 bg-primary-50/30' : ''}
              `}
            >
              <div
                className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
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
                      onClick={() => onTripClick(trip.id)}
                      className={`
                        w-full text-left px-1.5 py-0.5 rounded text-xs font-medium text-white truncate
                        hover:opacity-90 transition ${getTripColor(i)}
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

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [today] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [translatePx, setTranslatePx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTranslateRef = useRef(0);
  const lastDragDyRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? 0;
      setContainerWidth(width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventVertical = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) e.preventDefault();
    };
    el.addEventListener('touchmove', preventVertical, { passive: false });
    return () => el.removeEventListener('touchmove', preventVertical);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setNetworkError(false);
        const res = await api.get('/groups');
        const data = res.data?.data?.groups ?? res.data?.groups ?? res.data;
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) setGroups(list);
      } catch (err: unknown) {
        const e = err as { isNetworkError?: boolean; response?: { data?: { message?: string } } };
        if (!cancelled) {
          setNetworkError(!!(e as { isNetworkError?: boolean }).isNetworkError);
          toast.error(e.response?.data?.message ?? 'Failed to load trips');
          setGroups([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goPrev = useCallback(() => {
    setViewDate((prev) => addMonth(prev.year, prev.month, -1));
  }, []);

  const goNext = useCallback(() => {
    setViewDate((prev) => addMonth(prev.year, prev.month, 1));
  }, []);

  const goToToday = () => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
  };

  const prevMonth = useMemo(() => addMonth(viewDate.year, viewDate.month, -1), [viewDate.year, viewDate.month]);
  const nextMonth = useMemo(() => addMonth(viewDate.year, viewDate.month, 1), [viewDate.year, viewDate.month]);

  const maxDrag = containerWidth * 0.85;
  const threshold = containerWidth * SWIPE_THRESHOLD_RATIO;

  const handlePointerStart = useCallback(
    (clientX: number, clientY: number) => {
      if (isAnimating) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStart.current = { x: clientX, y: clientY };
      lastTranslateRef.current = 0;
    },
    [isAnimating]
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;
      lastDragDyRef.current = dy;
      const capped = containerWidth > 0
        ? Math.max(-maxDrag, Math.min(maxDrag, dx))
        : dx;
      lastTranslateRef.current = capped;
      if (containerWidth > 0 && rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (containerWidth > 0) {
        rafRef.current = requestAnimationFrame(() => setTranslatePx(capped));
      }
    },
    [isDragging, maxDrag, containerWidth]
  );

  const handlePointerEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    const current = lastTranslateRef.current;
    const dy = lastDragDyRef.current;
    if (Math.abs(dy) > Math.abs(current)) return;
    const thresh = containerWidth > 0 ? threshold : SWIPE_THRESHOLD_PX;
    if (current < -thresh) {
      if (containerWidth > 0) {
        setIsAnimating(true);
        setTranslatePx(-containerWidth);
        setTimeout(() => {
          goNext();
          setTranslatePx(0);
          setIsAnimating(false);
        }, SNAP_DURATION_MS);
      } else {
        goNext();
      }
    } else if (current > thresh) {
      if (containerWidth > 0) {
        setIsAnimating(true);
        setTranslatePx(containerWidth);
        setTimeout(() => {
          goPrev();
          setTranslatePx(0);
          setIsAnimating(false);
        }, SNAP_DURATION_MS);
      } else {
        goPrev();
      }
    } else if (containerWidth > 0) {
      setIsAnimating(true);
      setTranslatePx(0);
      setTimeout(() => setIsAnimating(false), SNAP_DURATION_MS);
    }
  }, [threshold, containerWidth, goPrev, goNext]);

  const onTouchStart = (e: React.TouchEvent) => {
    handlePointerStart(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) e.preventDefault();
    handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    handlePointerEnd();
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerStart(e.clientX, e.clientY);
  };
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handlePointerMove, handlePointerEnd]);

  const handleTripClick = (groupId: string) => {
    navigate(`${ROUTES.GROUPS}/${groupId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent" />
        <p className="text-gray-500 text-sm">Loading calendar…</p>
      </div>
    );
  }

  if (networkError) {
    return (
      <DelightfulError
        onRetry={() => {
          setNetworkError(false);
          setLoading(true);
          api.get('/groups')
            .then((res) => {
              const data = res.data?.data?.groups ?? res.data?.groups ?? res.data;
              setGroups(Array.isArray(data) ? data : []);
            })
            .catch(() => setNetworkError(true))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  const showStrip = containerWidth > 0;
  const baseOffset = showStrip ? -containerWidth : 0;
  const totalTranslate = baseOffset + translatePx;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={goPrev}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
          {MONTH_LABELS[viewDate.month]} {viewDate.year}
        </h2>
        <div className="w-[120px]" />
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 shrink-0">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-hidden min-h-0 w-full"
        style={{ minHeight: 360 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {showStrip ? (
          <div
            className="flex h-full"
            style={{
              width: containerWidth * 3,
              transform: `translateX(${totalTranslate}px)`,
              transition: isDragging ? 'none' : `transform ${SNAP_DURATION_MS}ms ease-out`,
            }}
          >
            <div className="shrink-0 flex flex-col" style={{ width: containerWidth }}>
              <MonthGrid
                year={prevMonth.year}
                month={prevMonth.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
            <div className="shrink-0 flex flex-col" style={{ width: containerWidth }}>
              <MonthGrid
                year={viewDate.year}
                month={viewDate.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
            <div className="shrink-0 flex flex-col" style={{ width: containerWidth }}>
              <MonthGrid
                year={nextMonth.year}
                month={nextMonth.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <MonthGrid
              year={viewDate.year}
              month={viewDate.month}
              today={today}
              groups={groups}
              onTripClick={handleTripClick}
            />
          </div>
        )}
      </div>

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center shrink-0">
          <CalendarDaysIcon className="h-14 w-14 text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">No trips this month</p>
          <p className="text-gray-500 text-sm mt-1">Trips with dates will appear here.</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.GROUPS)}
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Go to Trips
          </button>
        </div>
      )}
    </div>
  );
};

export default Calendar;
