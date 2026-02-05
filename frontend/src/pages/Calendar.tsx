/**
 * Calendar — month view, trip date ranges (spec §6.9, §10.1).
 * BOARD layout, lazy-loaded. Horizontal swipe via Framer Motion drag (100px threshold), date-fns for date logic.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, animate, useReducedMotion, useDragControls } from 'framer-motion';
import { addMonths, subMonths, format } from 'date-fns';
import { api } from '../services/api';
import { TripGroup } from '../types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import DelightfulError from '../components/DelightfulError';
import MonthGrid from '../components/Calendar/MonthGrid';
import { ROUTES } from '../ux';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DRAG_THRESHOLD_PX = 100;
const SNAP_DURATION_S = 0.28;

export default function Calendar() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [today] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [groups, setGroups] = useState<TripGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  // Use fallback width so the draggable strip always renders (layout may report 0 before paint)
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? Math.min(window.innerWidth, 480) : 400
  );
  const x = useMotionValue(0);
  const dragControls = useDragControls();
  const pointerUpRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Center the middle panel when container width is known (strip layout: prev | current | next)
  useEffect(() => {
    if (containerWidth > 0) x.set(-containerWidth);
  }, [containerWidth, x]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);
    };
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      if (w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    updateWidth();
    return () => ro.disconnect();
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

  const viewDateObj = useMemo(
    () => new Date(viewDate.year, viewDate.month, 1),
    [viewDate.year, viewDate.month]
  );
  const goPrev = () => {
    const prev = subMonths(viewDateObj, 1);
    setViewDate({ year: prev.getFullYear(), month: prev.getMonth() });
  };
  const goNext = () => {
    const next = addMonths(viewDateObj, 1);
    setViewDate({ year: next.getFullYear(), month: next.getMonth() });
  };
  const goToToday = () => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
  };

  const prevMonth = useMemo(() => {
    const d = subMonths(viewDateObj, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [viewDateObj]);
  const nextMonth = useMemo(() => {
    const d = addMonths(viewDateObj, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [viewDateObj]);

  const TAP_THRESHOLD_PX = 8;
  const restX = -containerWidth; // middle panel (current month) in view
  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (containerWidth <= 0) return;
    const wasTap = Math.abs(info.offset.x) < TAP_THRESHOLD_PX;
    const up = pointerUpRef.current;
    pointerUpRef.current = null;
    if (wasTap && up) {
      const { clientX, clientY } = up;
      requestAnimationFrame(() => {
        const overlay = document.getElementById('calendar-drag-overlay');
        if (overlay) {
          overlay.style.pointerEvents = 'none';
          const target = document.elementFromPoint(clientX, clientY);
          overlay.style.pointerEvents = '';
          if (target && target !== overlay) {
            (target as HTMLElement).click();
          }
        }
      });
      return;
    }
    const duration = reduceMotion ? 0 : SNAP_DURATION_S;
    if (info.offset.x < -DRAG_THRESHOLD_PX) {
      // Dragged left → reveal next month; animate full left then reset to center
      animate(x, -2 * containerWidth, {
        type: 'tween',
        duration,
        ease: 'easeOut',
        onComplete: () => {
          goNext();
          x.set(restX);
        },
      });
    } else if (info.offset.x > DRAG_THRESHOLD_PX) {
      // Dragged right → reveal prev month; animate full right then reset to center
      animate(x, 0, {
        type: 'tween',
        duration,
        ease: 'easeOut',
        onComplete: () => {
          goPrev();
          x.set(restX);
        },
      });
    } else {
      animate(x, restX, { type: 'tween', duration, ease: 'easeOut' });
    }
  };

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
          api
            .get('/groups')
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

  const monthYearLabel = format(viewDateObj, 'MMMM yyyy');
  const showStrip = containerWidth > 0;

  return (
    <div
      className="h-full min-h-[480px] flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden select-none"
      role="application"
      aria-label="Calendar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Today
          </button>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={goPrev}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
          {monthYearLabel}
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
        className="flex-1 overflow-hidden min-h-0 w-full min-w-0"
        style={{ minHeight: 360 }}
      >
        {showStrip ? (
          <motion.div
            className="flex flex-col h-full cursor-grab active:cursor-grabbing relative"
            style={{
              width: containerWidth * 3,
              x,
              touchAction: 'none',
            }}
            drag={reduceMotion ? false : 'x'}
            dragConstraints={{ left: -2 * containerWidth, right: 0 }}
            dragElastic={0}
            dragMomentum={false}
            dragControls={dragControls}
            dragListener={false}
            onDragEnd={handleDragEnd}
            transition={{ type: 'tween', duration: SNAP_DURATION_S, ease: 'easeOut' }}
          >
            <div className="flex flex-1 min-h-0 relative">
            <div className="shrink-0 flex flex-col flex-1 min-h-0" style={{ width: containerWidth }}>
              <MonthGrid
                year={prevMonth.year}
                month={prevMonth.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
            <div className="shrink-0 flex flex-col flex-1 min-h-0" style={{ width: containerWidth }}>
              <MonthGrid
                year={viewDate.year}
                month={viewDate.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
            <div className="shrink-0 flex flex-col flex-1 min-h-0" style={{ width: containerWidth }}>
              <MonthGrid
                year={nextMonth.year}
                month={nextMonth.month}
                today={today}
                groups={groups}
                onTripClick={handleTripClick}
              />
            </div>
            {/* Overlay captures pointer to start drag from any row; taps are forwarded */}
            <div
              id="calendar-drag-overlay"
              className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                if (!reduceMotion) dragControls.start(e);
              }}
              onPointerUp={(e) => {
                pointerUpRef.current = { clientX: e.clientX, clientY: e.clientY };
              }}
              aria-hidden
            />
            </div>
          </motion.div>
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
            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Go to Trips
          </button>
        </div>
      )}
    </div>
  );
}
