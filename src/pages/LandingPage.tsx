import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content fade-in">
            <h1 className="hero-title">
              Make Better Decisions<br />
              <span className="text-gradient">Together</span>
            </h1>
            <p className="hero-subtitle">
              WeDecide empowers community groups to make informed, collaborative decisions
              with confidence. Harness the power of collective intelligence.
            </p>
            <div className="hero-cta">
              <Link to="/signup">
                <Button variant="primary" size="lg">Get Started Free</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why WeDecide?</h2>
          <div className="features-grid">
            <Card className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Structured Decision Making</h3>
              <p>
                Guide your team through a proven decision-making framework
                that ensures all perspectives are heard and considered.
              </p>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Collaborative Intelligence</h3>
              <p>
                Leverage the collective wisdom of your group with tools
                designed for transparent, inclusive collaboration.
              </p>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data-Driven Insights</h3>
              <p>
                Make informed choices backed by clear data visualization
                and comprehensive analysis of all options.
              </p>
            </Card>
            
            <Card className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Intuitive</h3>
              <p>
                Get started in minutes with our streamlined interface
                designed for speed without sacrificing depth.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <Card className="cta-card">
            <h2>Ready to Transform Your Decision Making?</h2>
            <p>Join teams making smarter decisions, faster.</p>
            <Link to="/signup">
              <Button variant="primary" size="lg">Start Your Free Trial</Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};
