import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useDecisions, type Decision } from '../../hooks/useDecisions';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/Loading';
import { DocumentManager } from '../../components/decisions/DocumentManager';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/Button';
import { useToasts } from '../../context/ToastContext';
import { useRapidRoles, type RapidRolesData } from '../../hooks/useRapidRoles';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import './DecisionDetailPage.css';

export function DecisionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isChair } = useAuth();
    const { showToast } = useToasts();
    const { getDecision, updateDecision, deleteDecision, approveDecision, rejectDecision } = useDecisions();
    const { getRapidRoles } = useRapidRoles();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [rapidRoles, setRapidRoles] = useState<RapidRolesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);

    // Modal state
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isEditable = decision ? decision.status !== 'completed' : false;
    const canManage = isEditable || isUnlocking;



    async function handleStatusChange(newStatus: 'draft' | 'submitted' | 'active' | 'completed' | 'rejected') {
        if (!decision) return;
        setUpdating(true);
        try {
            const updated = await updateDecision(decision.id, { status: newStatus });
            setDecision(updated);
            showToast(`Status updated to ${newStatus}`, 'success');
        } catch (err) {
            console.error('Failed to update status:', err);
            showToast('Failed to update status', 'error');
        } finally {
            setUpdating(false);
        }
    }

    async function handleChairApprove() {
        if (!decision) return;
        setUpdating(true);
        try {
            const updated = await approveDecision(decision.id);
            setDecision(updated);
            showToast('Decision accepted for agenda', 'success');
        } catch (err) {
            console.error('Failed to approve:', err);
            showToast('Failed to approve decision', 'error');
        } finally {
            setUpdating(false);
        }
    }

    async function handleChairReject() {
        if (!decision) return;
        const feedback = window.prompt('Enter feedback for the author:');
        if (!feedback) return;

        setUpdating(true);
        try {
            const updated = await rejectDecision(decision.id, feedback);
            setDecision(updated);
            showToast('Changes requested from author', 'info');
        } catch (err) {
            console.error('Failed to reject:', err);
            showToast('Failed to request changes', 'error');
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete() {
        if (!decision) return;

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
                    // Load RAPID roles
                    try {
                        const roles = await getRapidRoles(id);
                        setRapidRoles(roles);
                    } catch (err) {
                        console.error('Failed to load RAPID roles:', err);
                    }
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'rejected': return 'Changes Requested';
            case 'submitted': return 'Pending Review';
            case 'active': return 'Active (Ready for Agenda)';
            default: return status.replace('_', ' ');
        }
    };

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
                        {getStatusLabel(decision.status)}
                    </span>

                    {decision.status === 'draft' && canManage && (
                        <div className="status-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleStatusChange('submitted')}
                                disabled={updating}
                                className="btn--sm"
                                title="Submit for Triage"
                            >
                                {updating ? 'Submitting...' : 'Submit for Review'}
                            </Button>

                            {isChair && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleStatusChange('active')}
                                    disabled={updating}
                                    className="btn--sm"
                                >
                                    {updating ? 'Updating...' : 'Publish (Active)'}
                                </Button>
                            )}
                        </div>
                    )}

                    {decision.status === 'submitted' && (
                        <div className="status-info-actions">
                            <span className="status-explainer">(Pending Chair Review)</span>
                            {isChair && (
                                <div className="chair-actions">
                                    <Button
                                        variant="success"
                                        onClick={handleChairApprove}
                                        disabled={updating}
                                        className="btn--sm"
                                    >
                                        Accept for Agenda
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleChairReject}
                                        disabled={updating}
                                        className="btn--sm"
                                    >
                                        Request Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {decision.status === 'rejected' && canManage && (
                        <div className="status-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleStatusChange('submitted')}
                                disabled={updating}
                                className="btn--sm"
                            >
                                Resubmit
                            </Button>
                        </div>
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

            {decision.status === 'rejected' && decision.feedback && decision.feedback.length > 0 && (
                <div className="decision-section feedback-alert">
                    <h3 className="section-title feedback-title">Feedback from Chair</h3>
                    <div className="section-content">
                        {decision.feedback.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((f: any) => (
                            <div key={f.id} className="feedback-item">
                                <p className="feedback-content">{f.content}</p>
                                <span className="feedback-date">{new Date(f.created_at).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="decision-section highlight-section">
                <h3 className="section-title">The Decision</h3>
                <div className="section-content main-decision-text">
                    <p>{decision.decision || 'No decision text provided.'}</p>
                </div>
            </div>

            <div className="decision-section">
                <h3 className="section-title">Supporting Information</h3>
                <div className="section-content">
                    <p>{decision.description || 'No additional information provided.'}</p>
                </div>
            </div>

            <div className="decision-section">
                <h3 className="section-title">Decision Metadata</h3>
                <div className="section-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div>
                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Decision Type</strong>
                        <p style={{ margin: 0 }}>
                            {decision.decision_type === 'approve' ? '✓ Approve (Needs agreement)' : '📝 Note (For the record)'}
                        </p>
                    </div>
                    <div>
                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Reversibility</strong>
                        <p style={{ margin: 0 }}>
                            {decision.reversibility_type === 'type1_irreversible' ? '🚪 Type 1 (Irreversible)' :
                                decision.reversibility_type === 'type2_reversible' ? '🔄 Type 2 (Reversible)' :
                                    'Not specified'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="decision-section">
                <h3 className="section-title">RAPID Roles</h3>
                <div className="section-content">
                    {rapidRoles ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            {Object.entries(rapidRoles).map(([roleKey, assignments]) => {
                                const roleLabels: Record<string, string> = {
                                    recommend: 'R - Recommend',
                                    agree: 'A - Agree',
                                    perform: 'P - Perform',
                                    input: 'I - Input',
                                    decide: 'D - Decide'
                                };
                                return (
                                    <div key={roleKey}>
                                        <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            {roleLabels[roleKey]}
                                        </strong>
                                        <p style={{ margin: 0 }}>
                                            {assignments.length === 0 ? 'None' :
                                                assignments.map((a: any) => a.user_name || a.meeting_group_name || a.external_name).join(', ')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>Loading RAPID roles...</p>
                    )}
                </div>
            </div>

            <div className="decision-section">
                <DocumentManager
                    decisionId={decision.id}
                    isOwner={user?.id === decision.owner_id && canManage}
                />
            </div>

            {/* Decision Management / Danger Zone */}
            {(isChair || (canManage && decision.status === 'draft')) && (
                <div className="decision-section management-section">
                    <h3 className="section-title">Decision Management</h3>
                    <div className="section-content management-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>

                        <div className="management-group">
                            {/* Finalize Button for Chairs */}
                            {decision.status === 'active' && isChair && (
                                <div className="action-item">
                                    <p className="action-desc">Archive this decision after the board meeting is complete.</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowFinalizeModal(true)}
                                        disabled={updating}
                                        className="btn--sm btn-finalize"
                                    >
                                        Finalize & Archive
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Delete Button */}
                        {canManage && (
                            <div className="action-item">
                                <Button
                                    variant="danger"
                                    onClick={() => setShowDeleteModal(true)}
                                    disabled={deleting}
                                    className="btn--sm"
                                    title="Delete Decision"
                                >
                                    <Trash2 size={16} style={{ marginRight: '0.5rem' }} />
                                    Delete Decision
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showFinalizeModal}
                onClose={() => setShowFinalizeModal(false)}
                onConfirm={() => {
                    handleStatusChange('completed');
                    setShowFinalizeModal(false);
                }}
                title="Finalize & Archive Decision?"
                message="This action will mark the decision as completed and lock it from further editing. This should only be done AFTER the board meeting has occurred and deliberation is complete."
                confirmText="Yes, Finalize Decision"
                variant="warning"
                isLoading={updating}
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    handleDelete();
                    setShowDeleteModal(false);
                }}
                title="Delete Decision?"
                message="Are you sure you want to delete this decision? This action cannot be undone and will remove all associated data."
                confirmText="Delete Permanently"
                variant="danger"
                isLoading={deleting}
            />

        </div>
    );
}
