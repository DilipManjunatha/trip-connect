import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
  autoFocus,
}: SearchFieldProps) {
  return (
    <div
      className={clsx(
        'relative w-full',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={clsx(
          'block w-full rounded-[12px] bg-gray-100 text-gray-900 placeholder:text-gray-500',
          'pl-10 pr-10 py-2.5',
          'border border-transparent',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-200',
          'transition-colors'
        )}
        type="search"
        inputMode="search"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}

