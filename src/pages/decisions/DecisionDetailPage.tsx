import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useDecisions, type Decision } from '../../hooks/useDecisions';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/Loading';
import { StakeholderManager } from '../../components/decisions/StakeholderManager';
import { DocumentManager } from '../../components/decisions/DocumentManager';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { AffectedPartiesManager } from '../../components/decisions/AffectedPartiesManager';
import './DecisionDetailPage.css';

export function DecisionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getDecision, updateDecision, deleteDecision } = useDecisions();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const isEditable = decision ? decision.status !== 'completed' : false;
    const canManage = isEditable || isUnlocking;



    async function handleStatusChange(newStatus: 'draft' | 'active' | 'completed') {
        if (!decision) return;
        setUpdating(true);
        try {
            const updated = await updateDecision(decision.id, { status: newStatus });
            setDecision(updated);
        } catch (err) {
            console.error('Failed to update status:', err);
            // Optionally set an error message visible to the user
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!decision) return;
        if (!window.confirm('Are you sure you want to delete this decision? This action cannot be undone.')) return;

        setDeleting(true);
        try {
            await deleteDecision(decision.id);
            navigate('/decisions');
        } catch (err) {
            console.error('Failed to delete:', err);
            setDeleting(false);
            // Could add error toast here
        }
    }

    useEffect(() => {
        async function loadDecision() {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getDecision(id);
                if (data) {
                    setDecision(data);
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

    if (loading) return <LoadingSpinner fullScreen />;

    if (error || !decision) return (
        <div className="decision-detail-container">
            <div className="decision-section" style={{ textAlign: 'center' }}>
                <h3 className="section-title">Error</h3>
                <p className="section-content">{error || 'Decision not found'}</p>
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <Button variant="ghost" onClick={() => navigate('/decisions')}>
                        Back to Decisions
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="decision-detail-container container-entity">

            <div className="decision-header">
                <button
                    onClick={() => navigate('/decisions')}
                    className="back-button"
                    aria-label="Back to Decisions"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="decision-title">{decision.title}</h1>
                <div className="decision-meta">
                    <span className={`status-badge ${decision.status}`}>
                        {decision.status}
                    </span>

                    {decision.status === 'draft' && (
                        <Button
                            variant="primary"
                            onClick={() => handleStatusChange('active')}
                            disabled={updating}
                            className="btn--sm"
                        >
                            {updating ? 'Updating...' : 'Publish (Active)'}
                        </Button>
                    )}

                    {!isEditable && !isUnlocking && (
                        <Button
                            variant="outline"
                            onClick={() => setIsUnlocking(true)}
                            className="btn--sm"
                        >
                            Enable Editing
                        </Button>
                    )}

                    {!isEditable && isUnlocking && (
                        <Button
                            variant="ghost"
                            onClick={() => setIsUnlocking(false)}
                            className="btn--sm"
                        >
                            Lock Decision
                        </Button>
                    )}


                    {decision.status === 'active' && (
                        <Button
                            variant="success"
                            onClick={() => handleStatusChange('completed')}
                            disabled={updating}
                            className="btn--sm"
                        >
                            {updating ? 'Updating...' : 'Close (Complete)'}
                        </Button>
                    )}


                    <div className="separator" aria-hidden="true" />

                    {canManage && (
                        <button
                            onClick={() => navigate(`/decisions/${decision.id}/edit`)}
                            className="icon-button"
                            title="Edit Decision"
                        >
                            <Pencil size={20} />
                        </button>
                    )}

                    {canManage && (
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="btn--sm"
                            title="Delete Decision"
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}



                </div>
            </div>

            <div className="decision-section">
                <h3 className="section-title">Description</h3>
                <div className="section-content">
                    <p>{decision.description || 'No description provided.'}</p>
                </div>
            </div>

            <div className="decision-section">
                <h3 className="section-title">People Involved (Consultation Log)</h3>
                <StakeholderManager
                    decisionId={decision.id}
                    isOwner={user?.id === decision.owner_id && canManage}
                />
            </div>

            <div className="decision-section">
                <h3 className="section-title">Documents</h3>
                <DocumentManager
                    decisionId={decision.id}
                    isOwner={user?.id === decision.owner_id && canManage}
                />
            </div>

            <div className="decision-section">
                <AffectedPartiesManager
                    decisionId={decision.id}
                    isOwner={user?.id === decision.owner_id && canManage}
                />
            </div>

        </div>
    );
}
