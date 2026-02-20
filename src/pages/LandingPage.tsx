import React, { useState } from 'react';
import { Target, ShieldCheck, Zap, Play, CirclePause, TriangleAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './LandingPage.css';

const Gauge = ({ label, value, limit, isOver }: any) => {
  const colorClass = isOver
    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]'
    : 'text-slate-100';

  return (
    <div className={`gauge-container ${isOver ? 'animate-pulse' : ''}`}>
      <span className="gauge-label">{label}</span>
      <div className={`gauge-value ${colorClass}`}>
        {value} <span className="gauge-limit">/ {limit}</span>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  // Lead Capture State
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Mini-Sandbox State
  const limit = 10;
  const [capacity, setCapacity] = useState(8); // Start at 8/10
  const dummyInitiativeCost = 3;

  const isOver = capacity > limit;

  const handleDrag = () => {
    // Toggle state for demo purposes
    if (capacity === 8) setCapacity(8 + dummyInitiativeCost);
    else setCapacity(8);
  };

  const handleLeadCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await supabase.from('leads' as any).insert([{ email }]);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      console.error('Lead capture error:', err);
    }
  };

  return (
    <div className="landing-page font-sans">

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content fade-in">
            <h1 className="hero-title">
              Your Strategy is a Wish List.<br />
              <span className="text-strategic-gold">Your Capacity is a Reality.</span>
            </h1>
            <p className="hero-subtitle">
              Break the "Illusion of Infinite Capacity." AlturaGov enforces the physics of organizational focus, turning over-committed backlogs into governed strategic intent.
            </p>
            <div className="hero-cta-wrapper">
              <form onSubmit={handleLeadCapture} className="lead-form">
                {!submitted ? (
                  <>
                    <input
                      type="email"
                      placeholder="Enter work email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="lead-input"
                      required
                    />
                    <button type="submit" className="btn-action-blue glow-effect" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                      Request Strategic Audit
                    </button>
                  </>
                ) : (
                  <div className="lead-success text-green-400 font-bold">Request received. Our team will contact you shortly.</div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mini-Sandbox Section */}
      <section className="demo-section">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="hero-visual demo-section-wrapper fade-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="sandbox-panel panel-dark bento-card border-glow">
              <div className="sandbox-header border-bottom-dark">
                <span className="sandbox-title flex items-center gap-2">
                  <Zap size={18} className="text-action-blue" /> Physics Engine Demo
                </span>
                <Gauge label="Focus Load" value={capacity} limit={limit} isOver={isOver} />
              </div>
              <div className="sandbox-body" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                <div className="dummy-initiative bento-inner opacity-60">
                  <div className="initiative-info">
                    <span className="initiative-name font-bold">Core Platform Migration</span>
                    <span className="initiative-cost">5 Focus Slots (Active)</span>
                  </div>
                  <button className="btn-toggle bg-slate-800/50 text-slate-500 cursor-not-allowed border-slate-700/50">
                    Locked
                  </button>
                </div>

                <div className="dummy-initiative bento-inner opacity-60">
                  <div className="initiative-info">
                    <span className="initiative-name font-bold">Q3 Compliance Audit</span>
                    <span className="initiative-cost">3 Focus Slots (Active)</span>
                  </div>
                  <button className="btn-toggle bg-slate-800/50 text-slate-500 cursor-not-allowed border-slate-700/50">
                    Locked
                  </button>
                </div>

                <div className={`dummy-initiative bento-inner transition-all duration-300 ${isOver ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-blue-950/10 border-action-blue/30 hover:border-action-blue/50'}`}>
                  <div className="initiative-info">
                    <span className="initiative-name font-bold">AI Governance Module</span>
                    <span className={`initiative-cost font-bold transition-colors ${isOver ? 'text-red-400' : 'text-action-blue'}`}>
                      + {dummyInitiativeCost} Focus Slots
                    </span>
                  </div>
                  <button
                    onClick={handleDrag}
                    className={`btn-toggle shadow-md ${isOver ? 'btn-park bg-red-950 text-red-400 hover:bg-red-500 hover:text-white' : 'btn-activate bg-blue-900 text-blue-300 hover:bg-action-blue hover:text-white'}`}
                  >
                    {isOver ? <CirclePause size={20} /> : <Play size={20} />}
                    {isOver ? 'Park Item' : 'Activate Item'}
                  </button>
                </div>
                {isOver && (
                  <div className="capacity-warning animate-pulse mt-4 shadow-lg shadow-red-900/20 text-lg py-4">
                    <TriangleAlert size={24} /> CAPACITY EXCEEDED - STRATEGIC DRIFT DETECTED
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="bento-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(2, 6, 23, 0.6)' }}>
                <ShieldCheck className="text-green-400 mb-4" size={32} />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Integrity Check</span>
                <span className={isOver ? 'text-red-400 font-bold transition-colors text-xl' : 'text-green-400 font-bold transition-colors text-xl'}>{isOver ? 'FAILING (DRIFT)' : 'PASSING (ALIGNED)'}</span>
              </div>
              <div className="bento-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(2, 6, 23, 0.6)' }}>
                <Target className="text-strategic-gold mb-4" size={32} />
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Alignment Score</span>
                <span className="text-white font-bold text-3xl transition-all">{isOver ? '68%' : '94%'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Tiles Section */}
      <section className="value-tiles-section">
        <div className="container">
          <div className="bento-grid">

            <div className="bento-tile">
              <div className="tile-icon text-action-blue"><Zap size={32} /></div>
              <h3 className="tile-title">Enforce the Physics of Focus</h3>
              <p className="tile-copy">
                Organizations don't fail for lack of ideas; they fail for lack of focus. Our "Focus Slot" engine prevents you from approving work your leadership team cannot steer.
              </p>
            </div>

            <div className="bento-tile">
              <div className="tile-icon text-strategic-gold"><Target size={32} /></div>
              <h3 className="tile-title">Ensure Strategic Integrity</h3>
              <p className="tile-copy">
                Eliminate "Strategic Drift." Every initiative is forced into alignment with your core pillars. If a project doesn't move the needle, it doesn't get a slot.
              </p>
            </div>

            <div className="bento-tile">
              <div className="tile-icon text-green-400"><ShieldCheck size={32} /></div>
              <h3 className="tile-title">Establish Defensible Governance</h3>
              <p className="tile-copy">
                Replace ambiguity with an immutable record of truth. AlturaGov provides the visible logic and audit trail to back your trade-offs. Every decision is logged and rationalized, ensuring transparency for stakeholders and auditors alike.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="brand-text">AlturaGov</span>
            <p className="footer-copy">© 2026 AlturaGov. All rights reserved.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <span className="footer-col-title">Product</span>
              <a href="#" className="footer-link">Features</a>
              <a href="#" className="footer-link">Pricing</a>
              <a href="#" className="footer-link">Case Studies</a>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Company</span>
              <a href="#" className="footer-link">About Us</a>
              <a href="#" className="footer-link">Careers</a>
              <a href="#" className="footer-link">Contact</a>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Legal</span>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
