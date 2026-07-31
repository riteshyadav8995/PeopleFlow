import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = '', glass = false, style }: CardProps) {
  return (
    <div className={`card ${glass ? 'glass' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}
