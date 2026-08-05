import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className={`form-group ${className}`}>
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <input 
          id={inputId}
          ref={ref}
          className="form-input"
          {...props} 
        />
        {error && <span className="form-error ">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
