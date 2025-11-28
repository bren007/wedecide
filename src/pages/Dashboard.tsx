import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

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
              <h3>Recent Decisions</h3>
              <div className="empty-state">
                <p>No decisions yet. Create your first decision to get started!</p>
              </div>
            </Card>

            <Card className="dashboard-card">
              <h3>Quick Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Total Decisions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Active</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
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
