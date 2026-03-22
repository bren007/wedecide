import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Target, ShieldCheck, Zap, Play, CirclePause, TriangleAlert, ArrowRight } from 'lucide-react';
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
  const navigate = useNavigate();

  // Sandbox State
  const limit = 10;
  const [capacity, setCapacity] = useState(8); // Start at 8/10
  const dummyInitiativeCost = 3;

  const isOver = capacity > limit;

  const handleDrag = () => {
    // Toggle state for demo purposes
    if (capacity === 8) setCapacity(8 + dummyInitiativeCost);
    else setCapacity(8);
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
              Stop funding the noise. AlturaGov enforces the Physics of Focus — giving you the evidence to prove what your organisation can realistically deliver, and the standing to defend what it cannot.
            </p>
            <div className="hero-cta-wrapper flex flex-col items-center mt-6">
              <button
                onClick={() => navigate('/audit')}
                className="bg-action-blue text-white font-bold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] hover:-translate-y-1 transition-all flex items-center gap-3 text-lg mb-3"
              >
                Get Your Strategic Capacity Audit <ArrowRight size={20} />
              </button>
              <p className="text-sm text-slate-400 font-medium max-w-lg text-center">
                A fixed-fee diagnostic that proves what your organisation can deliver — and gives you the evidence to act on it.
              </p>
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
              <div className="tile-icon text-action-blue"><ShieldCheck size={32} /></div>
              <h3 className="tile-title">Protect What Matters</h3>
              <p className="tile-copy">
                Most organisations don't fail because of bad strategy. They fail because they approve more than they can steer. AlturaGov anchors your portfolio to what your organisation can realistically deliver — so your highest-priority programmes get the focus they were promised.
              </p>
            </div>

            <div className="bento-tile">
              <div className="tile-icon text-strategic-gold"><Target size={32} /></div>
              <h3 className="tile-title">End Strategic Drift</h3>
              <p className="tile-copy">
                When everything is a priority, nothing is. AlturaGov enforces a clear line between what advances your strategy and what consumes capacity without moving it. If an initiative can't be tied to a core pillar, it doesn't get a slot.
              </p>
            </div>

            <div className="bento-tile">
              <div className="tile-icon text-green-400"><Zap size={32} /></div>
              <h3 className="tile-title">Lead with Confidence When the Questions Come</h3>
              <p className="tile-copy">
                Ambiguity is a liability. Every trade-off made inside AlturaGov is reasoned, recorded, and retrievable. When ministers, auditors, or oversight bodies ask why a decision was made, you have a clear, defensible answer — not a memory, not a spreadsheet, a record.
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
              <Link to="/pricing" className="footer-link">Pricing</Link>
              <Link to="/audit" className="footer-link">Strategic Audit</Link>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Company</span>
              <Link to="/mission" className="footer-link">Our Mission</Link>
            </div>
            <div className="footer-col">
              <span className="footer-col-title">Legal</span>
              <Link to="/privacy" className="footer-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
