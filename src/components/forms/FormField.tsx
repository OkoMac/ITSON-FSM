import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
  className?: string;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
  helper,
  disabled,
  className = '',
}: FormFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-400 ml-4">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
      />
      {error && <p className="form-error">{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required,
  error,
  helper,
  disabled,
  placeholder = 'Select an option',
}: SelectFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-400 ml-4">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`input-field ${error ? 'input-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
  rows?: number;
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
  helper,
  disabled,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-400 ml-4">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`input-field ${error ? 'input-error' : ''}`}
      />
      {error && <p className="form-error">{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  );
}
