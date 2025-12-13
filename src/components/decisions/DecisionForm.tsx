import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import './DecisionForm.css';

export interface DecisionFormData {
    title: string;
    description: string;
}

interface DecisionFormProps {
    initialData?: DecisionFormData;
    onSubmit: (data: DecisionFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
    error?: string | null;
}

export function DecisionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel = 'Save',
    error: externalError
}: DecisionFormProps) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Reset form if initialData changes (useful for edit mode when data loads)
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ title, description });
    };

    return (
        <form onSubmit={handleSubmit} className="decision-form-container">
            {externalError && (
                <div className="decision-error-message">
                    {externalError}
                </div>
            )}

            <div className="decision-form-group">
                <Input
                    label="Title"
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Q4 Budget Approval"
                    disabled={isLoading}
                />
            </div>

            <div className="decision-form-group">
                <label htmlFor="description" className="decision-form-label">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    className="decision-form-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what needs to be decided..."
                    rows={4}
                    disabled={isLoading}
                />
            </div>

            <div className="decision-form-actions">
                <Button
                    variant="ghost"
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
