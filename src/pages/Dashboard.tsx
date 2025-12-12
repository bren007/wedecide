import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useDecisions } from '../hooks/useDecisions';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { decisions, loading } = useDecisions();

  const activeDecisions = decisions.filter(d => d.status === 'active').length;
  const completedDecisions = decisions.filter(d => d.status === 'completed').length;

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header fade-in">
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p className="dashboard-subtitle">
            Ready to make some great decisions?
          </p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-actions slide-in">
            <Link to="/decisions/new">
              <Button variant="primary" size="lg">
                + New Decision
              </Button>
            </Link>
          </div>

          <div className="dashboard-grid">
            <Card className="dashboard-card">
              <div className="card-header">
                <h3>Recent Decisions</h3>
                <Link to="/decisions" className="view-all-link">View All</Link>
              </div>

              {loading ? (
                <div className="loading-state">Loading decisions...</div>
              ) : decisions.length === 0 ? (
                <div className="empty-state">
                  <p>No decisions yet. Create your first decision to get started!</p>
                </div>
              ) : (
                <ul className="recent-decisions-list">
                  {decisions.slice(0, 5).map(decision => (
                    <li key={decision.id} className="decision-item">
                      <Link to={`/decisions/${decision.id}`}>
                        <div className="decision-info">
                          <span className="decision-title">{decision.title}</span>
                          <span className={`status-badge status-${decision.status}`}>
                            {decision.status}
                          </span>
                        </div>
                        <span className="decision-date">
                          {new Date(decision.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="dashboard-card">
              <h3>Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{decisions.length}</div>
                  <div className="stat-label">Total Decisions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{activeDecisions}</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{completedDecisions}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
