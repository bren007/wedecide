import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { ArrowLeft } from 'lucide-react';
import { DecisionForm } from '../../components/decisions/DecisionForm';
import './DecisionCreatePage.css';

export function DecisionCreatePage() {
    const navigate = useNavigate();
    const { createDecision } = useDecisions();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(data: { title: string; description: string }) {
        setLoading(true);
        setError(null);

        try {
            await createDecision(data);
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

            <DecisionForm
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
                isLoading={loading}
                submitLabel="Create Decision"
                error={error}
            />
        </div>
    );
}
