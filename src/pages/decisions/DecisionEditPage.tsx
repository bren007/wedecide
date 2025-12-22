import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { ArrowLeft } from 'lucide-react';
import { DecisionForm, type DecisionFormData } from '../../components/decisions/DecisionForm';
import { LoadingSpinner } from '../../components/Loading';

export function DecisionEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getDecision, updateDecision } = useDecisions();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialData, setInitialData] = useState<DecisionFormData | undefined>(undefined);

    useEffect(() => {
        async function loadDecision() {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getDecision(id);
                if (data) {
                    setInitialData({
                        title: data.title,
                        decision: data.decision || '',
                        description: data.description || '',
                        decision_type: data.decision_type
                    });
                } else {
                    setError('Decision not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load decision');
            } finally {
                setLoading(false);
            }
        }
        loadDecision();
    }, [id]);

    async function handleSubmit(data: DecisionFormData) {
        if (!id) return;
        setSaving(true);
        setError(null);

        try {
            await updateDecision(id, data);
            navigate(`/decisions/${id}`);
        } catch (err) {
            setError('Failed to update decision. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <LoadingSpinner fullScreen />;

    if (error && !initialData) return (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>Error</h3>
            <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{error}</p>
            <button
                onClick={() => navigate('/decisions')}
                style={{ marginTop: '1rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Back to Decisions
            </button>
        </div>
    );

    return (
        <div style={{ maxWidth: '42rem', margin: '0 auto', paddingBottom: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="back-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', marginBottom: '1rem', padding: 0 }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} />
                        Back
                    </button>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800 }}>Edit Decision</h1>
                </div>
            </div>

            <DecisionForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
                isLoading={saving}
                submitLabel="Update Decision"
                error={error}
            />
        </div>
    );
}
