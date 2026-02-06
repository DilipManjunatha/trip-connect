import React, { Fragment, useState, useMemo } from 'react';
import { Combobox as HeadlessCombobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
}

const Combobox: React.FC<ComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Search or select...',
  label,
  error,
  helperText,
  disabled,
  searchable = true,
  className,
  onSearch,
}) => {
  const [query, setQuery] = useState('');
  const hasError = !!error;
  const fieldId = `combobox-${Math.random().toString(36).substr(2, 9)}`;

  const filteredOptions = useMemo(() => {
    if (!searchable || !query) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, searchable]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (onSearch) {
      onSearch(newQuery);
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <HeadlessCombobox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <div className="relative">
              <HeadlessCombobox.Input
                id={fieldId}
                className={clsx(
                  'w-full rounded-lg border py-2 pl-3 pr-10 shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm',
                  'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                  hasError
                    ? 'border-error-300 bg-white text-error-900 placeholder-error-300 focus:border-error-500 focus:ring-error-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500'
                )}
                displayValue={(selectedValue: string) => {
                  const option = options.find((opt) => opt.value === selectedValue);
                  return option ? option.label : '';
                }}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder={placeholder}
                aria-invalid={hasError}
                aria-describedby={
                  error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
                }
              />
              <HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </HeadlessCombobox.Button>
            </div>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery('')}
            >
              <HeadlessCombobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredOptions.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    Nothing found.
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <HeadlessCombobox.Option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ active, disabled }) =>
                        clsx(
                          'relative cursor-default select-none py-2 pl-10 pr-4',
                          active && 'bg-primary-100 text-primary-900',
                          !active && 'text-gray-900',
                          disabled && 'opacity-50 cursor-not-allowed'
                        )
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal'
                            )}
                          >
                            {option.label}
                          </span>
                          {selected ? (
                            <span
                              className={clsx(
                                'absolute inset-y-0 left-0 flex items-center pl-3',
                                active ? 'text-primary-600' : 'text-primary-600'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </HeadlessCombobox.Option>
                  ))
                )}
              </HeadlessCombobox.Options>
            </Transition>
          </div>
        )}
      </HeadlessCombobox>
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${fieldId}-helper`} className="mt-1.5 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Combobox;
