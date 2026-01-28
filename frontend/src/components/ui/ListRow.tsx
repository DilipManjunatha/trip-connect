import type { ReactNode } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  showChevron?: boolean;
  className?: string;
}

export default function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  href,
  showChevron = true,
  className,
}: ListRowProps) {
  const isInteractive = !!onClick || !!href;
  const Component: any = href ? 'a' : 'button';
  const componentProps = href
    ? { href }
    : { type: 'button' as const, onClick };

  return (
    <Component
      {...componentProps}
      className={clsx(
        'w-full text-left',
        'flex items-center gap-3 px-4 py-3',
        'min-h-[52px]',
        'bg-white',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset',
        isInteractive ? 'active:bg-gray-50 hover:bg-gray-50' : '',
        className
      )}
    >
      {leading ? <div className="flex-shrink-0">{leading}</div> : null}

      <div className="min-w-0 flex-1">
        <div className="text-[17px] leading-5 font-medium text-gray-900 truncate">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 text-[13px] leading-4 text-gray-500 truncate">
            {subtitle}
          </div>
        ) : null}
      </div>

      {trailing ? <div className="flex-shrink-0">{trailing}</div> : null}

      {showChevron ? (
        <ChevronRightIcon className="h-5 w-5 text-gray-300 flex-shrink-0" />
      ) : null}
    </Component>
  );
}

