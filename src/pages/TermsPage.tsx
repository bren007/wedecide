import React from 'react';
import './LegalPage.css';

export const TermsPage: React.FC = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">

        <div className="legal-header">
          <p className="legal-eyebrow">Legal</p>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-meta">Jurisdiction: New Zealand · Effective: March 2026</p>
        </div>

        <div className="legal-body">

          <section className="legal-section">
            <h2>1. Product Definition</h2>
            <p>
              AlturaGov is a Decision Intelligence and Governance Tool. It is not an operational system of record, a financial management system, or a human resources management system. Capacity calculations and mandate risk scores are decision-support outputs, not authoritative operational data. Clients must not rely on AlturaGov outputs as a substitute for their own financial, HR, or programme management systems of record.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Client Data Responsibility</h2>
            <p>
              The client accepts full responsibility for ensuring that data submitted to the platform complies with their agency's data classification policies, information security requirements, and any obligations under the Official Information Act 1982 and the Privacy Act 2020. AlturaGov is not responsible for the classification or sensitivity of data uploaded by clients.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Acceptable Use — Data Uploads</h2>
            <p>
              Clients must not upload RESTRICTED, CONFIDENTIAL, or above-classification information to the platform. Clients must anonymise staff names and sensitive vendor details prior to upload via the Secure Drop facility. Breach of this clause constitutes grounds for immediate suspension of platform access pending investigation. AlturaGov reserves the right to permanently terminate access in the event of material breach.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Limitation of Liability</h2>
            <p>
              AlturaGov is not liable for executive decisions, resourcing changes, programme cancellations, or any operational outcomes made in reliance on the platform's outputs. The platform provides analytical guidance; accountability for decisions rests with the client's authorised officers. AlturaGov's total liability for any claim arising under these Terms shall not exceed the fees paid by the client in the three months preceding the claim.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Payment Terms</h2>
            <p>
              Invoices are due within 20 working days of issue, consistent with standard New Zealand government payment terms. Licence access activates upon confirmed receipt of payment. AlturaGov will issue a GST-compliant New Zealand tax invoice upon request or upon procurement. A Purchase Order (PO) number, if provided, will be referenced on the invoice.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Subscription & Renewal</h2>
            <p>
              Annual licences do not renew automatically. AlturaGov will provide notice of upcoming expiry no less than 20 working days before the licence term ends. Renewal is by mutual agreement and a new invoice.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Intellectual Property</h2>
            <p>
              AlturaGov retains all intellectual property rights in the platform, including the Physics of Focus methodology, scoring algorithms, and AI outputs. Clients retain full ownership of the data they upload. AlturaGov does not claim any rights in client portfolio data.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Termination</h2>
            <p>
              Either party may terminate the engagement with 20 working days written notice. Upon termination, client data will be deleted from AlturaGov systems within 30 calendar days, and a written confirmation of deletion will be provided on request.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of New Zealand. Any disputes shall be subject to the exclusive jurisdiction of the New Zealand courts. Nothing in these Terms limits any rights the client may have under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986, to the extent those acts apply.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact</h2>
            <p>
              For enquiries regarding these Terms, contact us at: <a href="mailto:support@alturagov.com" className="legal-contact-inline">support@alturagov.com</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
