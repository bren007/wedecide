import { useNavigate } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import './DecisionListPage.css';

export function DecisionListPage() {
    const navigate = useNavigate();
    const { decisions, loading, error } = useDecisions();

    if (loading) return <div className="loading-state">Loading decisions...</div>;
    if (error) return <div className="error-state">Error loading decisions</div>;

    return (
        <div className="decision-list-page">
            <div className="page-header">
                <div className="page-title">
                    <h1>Decisions</h1>
                    <p className="page-subtitle">
                        Manage your organization's decisions and outcomes.
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('new')}
                    className="create-button"
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    New Decision
                </Button>
            </div>

            <div className="decision-list-container">
                <ul className="decision-list">
                    {decisions.length === 0 ? (
                        <li className="empty-state">
                            <p>No decisions yet. Create one to get started.</p>
                        </li>
                    ) : (
                        decisions.map((decision) => (
                            <li key={decision.id} className="decision-list-item">
                                <a href={`/decisions/${decision.id}`} className="decision-link">
                                    <div className="decision-header">
                                        <h3 className="decision-title">{decision.title}</h3>
                                        <div className="decision-status">
                                            <span className={`status-badge ${decision.status}`}>
                                                {decision.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="decision-content">
                                        <p className="decision-description">
                                            {decision.description || 'No description provided.'}
                                        </p>
                                        <div className="decision-meta">
                                            <span className="created-date">
                                                Created on {new Date(decision.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
