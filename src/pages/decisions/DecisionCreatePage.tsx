import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import './DecisionCreatePage.css';

export function DecisionCreatePage() {
    const navigate = useNavigate();
    const { createDecision } = useDecisions();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createDecision({ title, description });
            navigate('/decisions');
        } catch (err) {
            setError('Failed to create decision. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="create-decision-page">
            <div className="page-header">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="back-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} />
                        Back
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create New Decision</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="form-container">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="title" className="form-label">
                        Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="form-input"
                        placeholder="e.g. Q4 Budget Approval"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="form-label">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-textarea"
                        placeholder="Briefly describe what needs to be decided..."
                    />
                </div>

                <div className="form-actions">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Decision'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
