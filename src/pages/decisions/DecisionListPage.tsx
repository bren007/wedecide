import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { Plus } from 'lucide-react';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import './DecisionListPage.css';

export function DecisionListPage() {
    const navigate = useNavigate();
    const { decisions, loading, error } = useDecisions();
    const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed'>('all');

    const filteredDecisions = decisions.filter(
        d => filter === 'all' || d.status === filter
    );

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

            <div className="filters-bar">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'draft' ? 'active' : ''}`}
                    onClick={() => setFilter('draft')}
                >
                    Drafts
                </button>
                <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active
                </button>
                <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
            </div>

            <div className="decision-list-container">
                {filteredDecisions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Plus size={32} />
                        </div>
                        <h3 className="empty-state-title">No decisions found</h3>
                        <p className="empty-state-text">
                            {filter === 'all'
                                ? "Get started by creating a new decision record."
                                : `No ${filter} decisions found.`}
                        </p>
                        {filter === 'all' && (
                            <div className="mt-6">
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('new')}
                                >
                                    Create Decision
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <ul className="decision-list">
                        {filteredDecisions.map((decision) => (
                            <li key={decision.id} className="decision-list-item">
                                <a href={`/decisions/${decision.id}`} className="decision-link">
                                    <div className="decision-header">
                                        <h3 className="decision-title">{decision.title}</h3>
                                        <div className="decision-status">
                                            <StatusBadge status={decision.status} />
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
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
