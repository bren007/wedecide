import React, { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import './MeetingForm.css';

export interface MeetingFormData {
    title: string;
    scheduled_at: string;
    description: string;
    location: string;
}

interface MeetingFormProps {
    initialData?: Partial<MeetingFormData>;
    onSubmit: (data: MeetingFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    submitLabel?: string;
    title?: string;
}

export const MeetingForm: React.FC<MeetingFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel = 'Save',
    title = 'Meeting Details'
}) => {
    const [formData, setFormData] = useState<MeetingFormData>({
        title: '',
        scheduled_at: '',
        description: '',
        location: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                // Ensure date string is compatible with datetime-local (YYYY-MM-DDThh:mm)
                scheduled_at: initialData.scheduled_at
                    ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
                    : '',
                description: initialData.description || '',
                location: initialData.location || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Convert back to ISO string if needed, or keeping local time is fine depending on backend
        // Backend usually expects ISO. The input gives local time string "YYYY-MM-DDThh:mm".
        // simple construction new Date(value).toISOString() works but shifts timezone.
        // For now, passing the value as is or letting the parent handle strict parsing.
        // Let's pass the raw value, but ensure it's a valid date.

        await onSubmit(formData);
    };

    return (
        <div className="modal-overlay meeting-form-modal" onClick={onCancel}>
            <div className="modal-card meeting-form-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header meeting-form-header">
                    <h3>{title}</h3>
                    <button className="close-btn meeting-form-close" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="meeting-form-body">
                    <div className="form-group">
                        <label>Meeting Title</label>
                        <input
                            className="meeting-form-input"
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Q4 Strategy Session"
                            autoFocus
                        />
                    </div>

                    <div className="meeting-form-row">
                        <div className="form-group">
                            <label>Date & Time</label>
                            <input
                                className="meeting-form-input"
                                type="datetime-local"
                                required
                                value={formData.scheduled_at}
                                onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Location / Link</label>
                            <div className="input-with-icon">
                                <MapPin size={18} className="input-icon" />
                                <input
                                    className="meeting-form-input"
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Physical room or URL"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Brief Description</label>
                        <textarea
                            className="meeting-form-textarea"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add context for attendees..."
                            rows={3}
                        />
                    </div>
                </form>
                <div className="modal-actions meeting-form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : submitLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
