import React from 'react';
import './Loading.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    fullScreen = false,
    className = ''
}) => {
    return (
        <div className={`loading-spinner-container ${fullScreen ? 'fullscreen' : ''} ${className}`}>
            <div className={`loading-spinner ${size}`}></div>
        </div>
    );
};
