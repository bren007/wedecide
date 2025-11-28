import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container fade-in">
          <Card className="auth-card">
            <h1 className="auth-title">Get Started</h1>
            <p className="auth-subtitle">Create your WeDecide account</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <Input
                type="text"
                label="Name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                label="Password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error}
                required
              />

              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                disabled={loading}
                className="auth-button"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
