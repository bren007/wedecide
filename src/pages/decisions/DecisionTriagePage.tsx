import React, { useState } from 'react';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useDecisions } from '../../hooks/useDecisions';
import type { Decision } from '../../hooks/useDecisions';
import { useAuth } from '../../context/AuthContext';
import { useToasts } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import './DecisionTriagePage.css';

export const DecisionTriagePage: React.FC = () => {
    const { decisions, loading, approveDecision, rejectDecision } = useDecisions();
    const { isChair } = useAuth();
    const { showToast } = useToasts();
    const navigate = useNavigate();

    const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
    const [decisionToApprove, setDecisionToApprove] = useState<string | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionFeedback, setRejectionFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isChair) {
        return (
            <div className="triage-access-denied">
                <h2>Access Denied</h2>
                <p>Only the Chairperson can triage decisions.</p>
                <div style={{ marginTop: '1rem' }}>
                    <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
                </div>
            </div>
        );
    }

    const submittedDecisions = decisions.filter(d => d.status === 'submitted');

    const initiateApprove = (id: string) => {
        setDecisionToApprove(id);
        setShowApproveModal(true);
    };

    const confirmApprove = async () => {
        if (!decisionToApprove) return;
        setIsSubmitting(true);
        try {
            await approveDecision(decisionToApprove);
            showToast('Decision approved and marked as Active', 'success');
            setShowApproveModal(false);
            setDecisionToApprove(null);
        } catch (err: any) {
            showToast('Failed to approve decision', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReject = (decision: Decision) => {
        setSelectedDecision(decision);
        setRejectionFeedback('');
        setShowRejectModal(true);
    };

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDecision || !rejectionFeedback.trim()) return;

        try {
            setIsSubmitting(true);
            await rejectDecision(selectedDecision.id, rejectionFeedback);
            showToast('Decision returned to author with feedback', 'info');
            setShowRejectModal(false);
        } catch (err: any) {
            showToast('Failed to reject decision', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="decision-triage-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Decision Triage</h1>
                    <p>Review submitted decisions and assign them to the agenda.</p>
                </div>
            </header>

            <div className="triage-container">
                {submittedDecisions.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle size={48} className="text-success" />
                        <h3>All caught up!</h3>
                        <p>There are no decisions pending review.</p>
                    </div>
                ) : (
                    <div className="triage-list">
                        {submittedDecisions.map(decision => (
                            <div key={decision.id} className="triage-card">
                                <div className="triage-card-header">
                                    <div className="decision-info">
                                        <h3>{decision.title}</h3>
                                        <div className="decision-badges">
                                            <span className="decision-type-badge">{decision.decision_type || 'Decide'}</span>
                                        </div>
                                        <p className="decision-meta">
                                            Submitted by {decision.owner?.name || 'User'} • {new Date(decision.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="triage-actions">
                                        <button
                                            className="btn-ghost-sm"
                                            onClick={() => navigate(`/decisions/${decision.id}`)}
                                        >
                                            View Details
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="triage-card-body">
                                    {decision.decision && (
                                        <div className="decision-preview-section">
                                            <label>Decision</label>
                                            <p className="decision-text">{decision.decision}</p>
                                        </div>
                                    )}
                                    <div className="description-preview-section">
                                        <label>Supporting Info</label>
                                        <p className="description-text">
                                            {decision.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="triage-card-footer">
                                    <button
                                        className="btn-danger-outline"
                                        onClick={() => handleOpenReject(decision)}
                                        disabled={isSubmitting}
                                    >
                                        <XCircle size={18} />
                                        Request Changes
                                    </button>
                                    <button
                                        className="btn-success"
                                        onClick={() => initiateApprove(decision.id)}
                                        disabled={isSubmitting}
                                    >
                                        <CheckCircle size={18} />
                                        Accept for Agenda
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal for Approval */}
            <ConfirmationModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={confirmApprove}
                title="Accept for Agenda?"
                message="Are you sure you want to approve this decision? It will become 'Active' and ready for inclusion in the board agenda."
                confirmText="Accept Decision"
                variant="success"
                isLoading={isSubmitting}
            />

            {/* Custom Modal for Rejection (Request Changes) */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Request Changes</h3>
                            <button className="close-btn" onClick={() => setShowRejectModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleReject}>
                            <div className="modal-body">
                                <p className="modal-description">
                                    Please provide specific feedback for the author. This will return the decision to "Draft" status.
                                </p>
                                <div className="form-group">
                                    <label>Feedback for Author</label>
                                    <textarea
                                        className="feedback-input"
                                        rows={4}
                                        value={rejectionFeedback}
                                        onChange={e => setRejectionFeedback(e.target.value)}
                                        placeholder="Explain what needs to be improved..."
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button type="submit" className="btn-danger" disabled={isSubmitting}>
                                    {isSubmitting ? 'Sending...' : 'Request Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
