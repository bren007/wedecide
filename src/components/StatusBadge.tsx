import './StatusBadge.css';

interface StatusBadgeProps {
    status: 'draft' | 'active' | 'completed' | string;
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const getLabel = (s: string) => {
        switch (s.toLowerCase()) {
            case 'rejected': return 'Changes Requested';
            case 'submitted': return 'Pending Review';
            default: return s.replace('_', ' ');
        }
    };

    return (
        <span className={`status-badge ${status.toLowerCase()} ${className}`}>
            {getLabel(status)}
        </span>
    );
}
