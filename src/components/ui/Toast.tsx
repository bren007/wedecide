import React from 'react';
import { useToasts } from '../../context/ToastContext';
import type { ToastType } from '../../context/ToastContext';

import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
}

const Toast: React.FC<ToastProps> = ({ id, message, type }) => {
    const { removeToast } = useToasts();

    const icons = {
        success: <CheckCircle className="toast-icon success" size={20} />,
        error: <XCircle className="toast-icon error" size={20} />,
        info: <Info className="toast-icon info" size={20} />,
        warning: <AlertTriangle className="toast-icon warning" size={20} />,
    };

    return (
        <div className={`toast toast--${type} fade-in`}>
            <div className="toast-content">
                {icons[type]}
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(id)} aria-label="Close notification">
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts } = useToasts();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </div>
    );
};
