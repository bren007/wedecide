import React from 'react';
import { Server, Lock, Eye, Brain, Shield } from 'lucide-react';
import './MissionPage.css';

const trustItems = [
  {
    icon: <Server size={22} className="trust-icon-svg" />,
    label: 'Data Residency',
    detail: 'Hosted exclusively in AWS ap-southeast-2 (Sydney, Australia). No data transits outside this region.',
  },
  {
    icon: <Lock size={22} className="trust-icon-svg" />,
    label: 'Tenant Isolation',
    detail: 'Strict PostgreSQL Row-Level Security. No cross-tenant data access is architecturally possible.',
  },
  {
    icon: <Eye size={22} className="trust-icon-svg" />,
    label: 'Zero PII Ingestion',
    detail: 'The platform is designed to operate on anonymised portfolio metadata. No citizen data, no staff personal information is required or stored.',
  },
  {
    icon: <Brain size={22} className="trust-icon-svg" />,
    label: 'Zero-Retention AI',
    detail: 'All AI processing uses providers with zero-retention agreements. Your data is never used for model training.',
  },
  {
    icon: <Shield size={22} className="trust-icon-svg" />,
    label: 'NZ Privacy Act 2020',
    detail: 'Designed in compliance with the Privacy Act 2020 (NZ) and the Information Privacy Principles.',
  },
];

export const MissionPage: React.FC = () => {
  return (
    <div className="mission-page">

      {/* Section 1 — The Problem */}
      <section className="mission-section mission-hero">
        <div className="mission-container">
          <p className="mission-eyebrow">The Problem</p>
          <h1 className="mission-title">
            Government runs on infinite demand.<br />
            <span className="mission-title-accent">Delivery is not infinite.</span>
          </h1>
          <div className="mission-prose">
            <p>
              The Westminster system generates infinite political demand. Every budget round, every ministerial priority, every machinery of government change adds to the stack. Agencies have finite people, finite budgets, and finite bandwidth to deliver.
            </p>
            <p>
              The gap between political ambition and operational reality is not a leadership failure. It is a physics problem. AlturaGov was built to solve it mathematically.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — Founder Authority */}
      <section className="mission-section mission-founder">
        <div className="mission-container">
          <p className="mission-eyebrow">Founder</p>
          <h2 className="mission-section-title">Blair Renwick</h2>
          <div className="mission-prose">
            <p>
              AlturaGov was founded by Blair Renwick, a governance architect with over a decade of experience designing digital investment pipelines and enterprise programme management offices across complex, security-sensitive government environments.
            </p>
            <p>
              The platform emerges from an unusual combination of disciplines: the machinery of government (Political Science) and operational throughput (Operations Management). Most governance tools are built by technologists who understand software. AlturaGov is built by someone who understands the Cabinet cycle.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3 — Trust & Architecture */}
      <section className="mission-section mission-trust">
        <div className="mission-container">
          <p className="mission-eyebrow">Architecture & Compliance</p>
          <h2 className="mission-section-title">Built for the Public Sector</h2>
          <p className="mission-trust-lead">
            AlturaGov is designed from the ground up for government environments — not adapted from a commercial SaaS product.
          </p>
          <div className="trust-grid">
            {trustItems.map((item) => (
              <div key={item.label} className="trust-item">
                <div className="trust-icon-wrap">{item.icon}</div>
                <div className="trust-text">
                  <span className="trust-label">{item.label}</span>
                  <span className="trust-detail">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
