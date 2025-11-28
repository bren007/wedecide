import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  glass = true 
}) => {
  return (
    <div className={`card ${glass ? 'card--glass' : ''} ${className}`}>
      {children}
    </div>
  );
};
