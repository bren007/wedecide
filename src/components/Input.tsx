import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endAdornment?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  endAdornment,
  ...props
}) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        <input
          className={`input ${error ? 'input--error' : ''} ${className} ${endAdornment ? 'input--has-adornment' : ''}`}
          {...props}
        />
        {endAdornment && <div className="input-adornment">{endAdornment}</div>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
