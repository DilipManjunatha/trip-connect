import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface GroupedListProps {
  /**
   * Optional section header (small, iOS grouped style)
   */
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function GroupedList({ title, children, className }: GroupedListProps) {
  return (
    <section className={clsx('w-full', className)}>
      {title ? (
        <div className="px-2 pb-2">
          <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            {title}
          </h2>
        </div>
      ) : null}
      <div className="rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
        {children}
      </div>
    </section>
  );
}

