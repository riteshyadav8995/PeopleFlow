import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  leftIcon,
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={16} /> : leftIcon}
      {children}
    </button>
  );
}
