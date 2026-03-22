import React from 'react';
import './LegalPage.css';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">

        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-meta">Jurisdiction: New Zealand · Effective: March 2026 · Governed by the Privacy Act 2020 (NZ)</p>
        </div>

        <div className="legal-body">

          <section className="legal-section">
            <h2>1. B2B Scope</h2>
            <p>
              AlturaGov is a business-to-business application. We do not collect, process, or store New Zealand citizen data. This policy governs the relationship between AlturaGov and its government agency clients and their authorised users.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect only the minimum information required to provide the service:</p>
            <ul>
              <li><strong>Account Data:</strong> Name, work email address, and government agency name provided at signup.</li>
              <li><strong>Portfolio Metadata:</strong> Anonymised initiative names, resource cost scores, and mandate classifications uploaded by clients.</li>
              <li><strong>Usage Logs:</strong> Timestamp and action logs for security, audit, and service improvement purposes.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Data Minimisation Protocol</h2>
            <p>
              Clients are contractually required under the Terms of Service to redact individual staff names, sensitive vendor identifiers, and any classified or RESTRICTED information before uploading data via the Secure Drop facility. AlturaGov does not accept and is not liable for data uploaded in breach of this requirement.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Raw Upload Deletion</h2>
            <p>
              CSV files uploaded via the Secure Drop facility are hard-deleted from all storage systems within 7 calendar days of audit report generation. Derived, anonymised metadata extracted from the upload may be retained for service delivery and reporting purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. AI Processing</h2>
            <p>
              AI-assisted analysis is performed using providers operating under zero-retention agreements. No client data is used to train, fine-tune, or improve any AI model. AI outputs are decision-support tools and do not constitute authoritative operational records.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Residency</h2>
            <p>
              All data is stored and processed in AWS ap-southeast-2 (Sydney, Australia). No personal or organisational data is transferred outside this region. AlturaGov does not use data processors located in jurisdictions without equivalent privacy protections.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Disclosure</h2>
            <p>
              AlturaGov will not disclose client data to third parties except where required by New Zealand law, court order, or with the express written consent of the client. We will notify affected clients of any compelled disclosure to the extent permitted by law.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights Under the Privacy Act 2020</h2>
            <p>
              Under the Privacy Act 2020 (NZ) and the Information Privacy Principles (IPPs), authorised users have the right to access personal information held about them, request correction of inaccurate information, and raise a complaint regarding a suspected breach of the IPPs.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Privacy Contact</h2>
            <p>
              To exercise your rights or notify AlturaGov of a suspected privacy breach under the Privacy Act 2020, contact our Privacy Officer at:
            </p>
            <p className="legal-contact">
              <a href="mailto:support@alturagov.com">support@alturagov.com</a>
            </p>
            <p>
              We will respond to all privacy enquiries within 20 working days in accordance with our obligations under the Privacy Act 2020.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
