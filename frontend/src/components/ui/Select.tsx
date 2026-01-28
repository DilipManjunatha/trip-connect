import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  label,
  error,
  helperText,
  disabled,
  className,
}) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const hasError = !!error;
  const fieldId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              id={fieldId}
              className={clsx(
                'relative w-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm',
                'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
                hasError
                  ? 'border border-error-300 bg-white text-error-900 focus:border-error-500 focus:ring-error-500'
                  : 'border border-gray-300 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500'
              )}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined
              }
            >
              <span className={clsx('block truncate', !selectedOption && 'text-gray-500')}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
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
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
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

export default Select;
