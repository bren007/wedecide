import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';


export interface AgendaFormData {
    title: string;
    description: string;
    notes: string;
}

interface AgendaItemFormProps {
    initialData?: Partial<AgendaFormData>;
    onSubmit: (data: AgendaFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    title?: string;
}

export const AgendaItemForm: React.FC<AgendaItemFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSubmitting,
    title = 'Edit Agenda Item'
}) => {
    const [formData, setFormData] = useState<AgendaFormData>({
        title: '',
        description: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Item Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Financial Report"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Details about this item..."
                            rows={2}
                        />
                    </div>
                    <div className="form-group">
                        <label>Minutes / Notes</label>
                        <textarea
                            className="notes-input"
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Capture minutes, decisions, and action items here..."
                            rows={5}
                            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                    </div>
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Save Item' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
