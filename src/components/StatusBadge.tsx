import './StatusBadge.css';

interface StatusBadgeProps {
    status: 'draft' | 'active' | 'completed' | string;
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    return (
        <span className={`status-badge ${status.toLowerCase()} ${className}`}>
            {status}
        </span>
    );
}
