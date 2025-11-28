import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewDecision.css';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const NewDecision: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stakeholders, setStakeholders] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock save - in production, this would call an API
    console.log('Creating decision:', { title, description, stakeholders });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="new-decision-page">
      <div className="container">
        <div className="new-decision-container fade-in">
          <Card className="new-decision-card">
            <h1 className="page-title">Create New Decision</h1>
            <p className="page-subtitle">
              Start your decision-making process by providing some basic information
            </p>

            <form onSubmit={handleSubmit} className="decision-form">
              <Input
                type="text"
                label="Decision Title"
                placeholder="What decision needs to be made?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="input-wrapper">
                <label className="input-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="Provide context and details about this decision..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <Input
                type="text"
                label="Stakeholders"
                placeholder="Who should be involved? (comma-separated)"
                value={stakeholders}
                onChange={(e) => setStakeholders(e.target.value)}
              />

              <div className="form-actions">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Decision'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
