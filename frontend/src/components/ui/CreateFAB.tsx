import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface CreateFABProps {
  /** Button label (e.g. "Add", "Add trip", "Add expense"). Used for aria-label and optional visible text. */
  label: string;
  /** Same handler as the header create button (open modal or navigate to form). */
  onClick: () => void;
  /** Optional extra class names. */
  className?: string;
}

/**
 * Floating action button for primary "Add/Create" on mobile only.
 * Fixed bottom-right above the bottom nav; square with smooth rounded corners, large touch target.
 * Visible only below md; on desktop the page header button is used.
 */
export default function CreateFAB({ label, onClick, className }: CreateFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'md:hidden fixed z-[35] flex items-center justify-center rounded-xl shadow-lg',
        'h-14 w-14 min-h-touch min-w-touch p-0',
        'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'transition-colors duration-200',
        className
      )}
      style={{
        bottom: 'calc(56px + 1rem + env(safe-area-inset-bottom, 0px))',
        right: 'calc(1rem + env(safe-area-inset-right, 0px))',
      }}
      aria-label={label}
    >
      <PlusIcon className="h-7 w-7" aria-hidden />
    </button>
  );
}
