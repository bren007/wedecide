import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcurementModal } from '../components/ProcurementModal';
import './PricingPage.css';

type Tier = '6-Month Pilot — $9,500' | 'Annual Enterprise Licence — $25,000';

const faqs = [
  {
    q: 'How do we pay?',
    a: 'We issue a compliant NZ tax invoice payable by bank transfer. No credit card required.',
  },
  {
    q: 'Can we reference a Purchase Order number?',
    a: 'Yes. Include your PO number in the request form and it will appear on the invoice.',
  },
  {
    q: 'What is the data hosting jurisdiction?',
    a: 'All data is hosted in AWS ap-southeast-2 (Sydney). No data leaves this region.',
  },
];

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'faq-open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        {open ? <ChevronUp size={16} className="faq-chevron" /> : <ChevronDown size={16} className="faq-chevron" />}
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
};

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>('6-Month Pilot — $9,500');

  const openModal = (tier: Tier) => {
    setSelectedTier(tier);
    setModalOpen(true);
  };

  return (
    <div className="pricing-page">

      {/* Header */}
      <section className="pricing-header">
        <div className="pricing-container">
          <p className="pricing-eyebrow">
            <Building2 size={14} className="inline-block mr-1.5 mb-0.5" />
            Government Procurement
          </p>
          <h1 className="pricing-title">Procurement &amp; Licensing</h1>
          <p className="pricing-subtitle">
            AlturaGov is structured around New Zealand's public sector delegation thresholds. Each engagement model is designed to fit within a defined financial approval pathway — from P-card through to enterprise SaaS procurement.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards-section">
        <div className="pricing-container">
          <div className="pricing-cards">

            {/* Card 1 — Strategic Capacity Audit */}
            <div className="pricing-card pricing-card--entry">
              <div className="pricing-card-top">
                <span className="pricing-tier-label">Diagnostic</span>
                <h2 className="pricing-plan-name">Strategic Capacity Audit</h2>
                <div className="pricing-price-block">
                  <span className="pricing-amount">$1,950</span>
                  <span className="pricing-cadence">One-time</span>
                </div>
                <p className="pricing-delegation">
                  Delegation target: <strong>P-Card / Advisory services threshold</strong>
                </p>
              </div>
              <p className="pricing-description">
                A mathematical diagnostic that exposes structural delivery risk and calculates your agency's true throughput baseline. No ongoing commitment.
              </p>
              <ul className="pricing-features">
                <li>Physics of Focus capacity report</li>
                <li>Mandate risk score across active portfolio</li>
                <li>Executive summary for DDG / CE review</li>
                <li>GST-compliant NZ tax invoice</li>
              </ul>
              <button
                id="cta-audit"
                onClick={() => navigate('/audit')}
                className="pricing-cta pricing-cta--primary"
              >
                Commence Audit <ArrowRight size={16} />
              </button>
            </div>

            {/* Card 2 — 6-Month Pilot */}
            <div className="pricing-card pricing-card--pilot pricing-card--featured">
              <div className="pricing-featured-badge">Most Selected</div>
              <div className="pricing-card-top">
                <span className="pricing-tier-label">Pilot</span>
                <h2 className="pricing-plan-name">Command Centre · 6-Month Pilot</h2>
                <div className="pricing-price-block">
                  <span className="pricing-amount">$9,500</span>
                  <span className="pricing-cadence">Single invoice</span>
                </div>
                <p className="pricing-delegation">
                  Delegation target: <strong>Sole-source / direct procurement threshold</strong>
                </p>
              </div>
              <p className="pricing-description">
                Deploy the governance engine across your active portfolio. Surface failing mandates immediately. Calibrate executive bandwidth in real time.
              </p>
              <ul className="pricing-features">
                <li>Full Command Centre access · 6 months</li>
                <li>Live portfolio physics dashboard</li>
                <li>Mandate alignment scoring</li>
                <li>Single invoice, no auto-renewal</li>
                <li>Priority onboarding support</li>
              </ul>
              <button
                id="cta-pilot"
                onClick={() => openModal('6-Month Pilot — $9,500')}
                className="pricing-cta pricing-cta--featured"
              >
                Request Invoice <ArrowRight size={16} />
              </button>
            </div>

            {/* Card 3 — Annual Enterprise */}
            <div className="pricing-card pricing-card--enterprise">
              <div className="pricing-card-top">
                <span className="pricing-tier-label">Enterprise</span>
                <h2 className="pricing-plan-name">Command Centre · Annual Enterprise Licence</h2>
                <div className="pricing-price-block">
                  <span className="pricing-amount">$25,000</span>
                  <span className="pricing-cadence">Annual invoice</span>
                </div>
                <p className="pricing-delegation">
                  Delegation target: <strong>Enterprise SaaS / open panel procurement</strong>
                </p>
              </div>
              <p className="pricing-description">
                Continuous portfolio physics mapping for the executive leadership team. Full tenant, unlimited mandates, priority support.
              </p>
              <ul className="pricing-features">
                <li>Full Command Centre · 12 months</li>
                <li>Unlimited mandates &amp; initiatives</li>
                <li>Multi-user executive access</li>
                <li>Annual report summary package</li>
                <li>Dedicated support line</li>
              </ul>
              <button
                id="cta-enterprise"
                onClick={() => openModal('Annual Enterprise Licence — $25,000')}
                className="pricing-cta pricing-cta--primary"
              >
                Request Invoice <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Strip */}
      <section className="pricing-faq-section">
        <div className="pricing-container">
          <h2 className="pricing-faq-title">Procurement FAQ</h2>
          <div className="faq-list">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      <ProcurementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTier={selectedTier}
      />
    </div>
  );
};
