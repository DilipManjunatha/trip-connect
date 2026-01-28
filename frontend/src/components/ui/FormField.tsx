import React from 'react';
import { clsx } from 'clsx';

export interface FormFieldProps {
  label?: React.ReactNode;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className,
  id,
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          <span>{label}</span>
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div id={fieldId}>
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<any>, {
              id: fieldId,
              'aria-invalid': hasError,
              'aria-describedby': error
                ? `${fieldId}-error`
                : helperText
                ? `${fieldId}-helper`
                : undefined,
            })
          : children}
      </div>
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

export default FormField;
