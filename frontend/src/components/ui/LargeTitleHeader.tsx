import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Optional right-side action (e.g. "Add")
   */
  action?: ReactNode;
  className?: string;
}

export default function LargeTitleHeader({
  title,
  subtitle,
  action,
  className,
}: LargeTitleHeaderProps) {
  return (
    <div className={clsx('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-[34px] leading-[40px] font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

