import React from 'react';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger':
            case 'warning':
                return <AlertTriangle size={24} className={variant === 'danger' ? 'text-danger' : 'text-warning'} style={{ marginRight: '12px', color: variant === 'danger' ? '#ef4444' : '#f59e0b' }} />;
            case 'info':
                return <Info size={24} className="text-info" style={{ marginRight: '12px', color: '#3b82f6' }} />;
            case 'success':
                return <CheckCircle size={24} className="text-success" style={{ marginRight: '12px', color: '#10b981' }} />;
            default:
                return null;
        }
    };

    // Helper to map Modal variant to Button variant
    // Button only supports: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger'
    const getButtonVariant = () => {
        if (variant === 'info') return 'primary';
        if (variant === 'warning') return 'danger'; // Map warning to danger as fallback
        if (variant === 'success') return 'success';
        return variant as any;
    };

    return (
        <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
            <div className="confirmation-modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="confirmation-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {getIcon()}
                        <h3 id="modal-title" className="confirmation-modal-title">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-close"
                        disabled={isLoading}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: 0 }}
                    >
                        &times;
                    </button>
                </div>

                <p className="confirmation-modal-description">
                    {message}
                </p>

                <div className="confirmation-modal-actions">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={getButtonVariant()}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};
