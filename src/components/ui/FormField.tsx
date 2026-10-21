'use client';

import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export default function FormField({
  id,
  label,
  children,
  error,
  hint,
  required,
  className = '',
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })
    : children;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {child}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-[11px] font-medium leading-relaxed text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
