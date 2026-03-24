import React from 'react';
import './LegalPage.css';

export const NDAPage: React.FC = () => {
    return (
        <div className="legal-page">
            <div className="legal-container">
                <div className="legal-header">
                    <span className="legal-eyebrow">Confidentiality</span>
                    <h1 className="legal-title">Standard Mutual Non-Disclosure Agreement</h1>
                    <p className="legal-meta">Version 1.0 — Effective from March 2026</p>
                </div>

                <div className="legal-body">
                    <section className="legal-section">
                        <h2>1. Parties and Purpose</h2>
                        <p>
                            This Mutual Non-Disclosure Agreement ("Agreement") is entered into between AlturaGov ("Receiving Party" / "Disclosing Party") and the entity requesting an audit or using the platform ("Receiving Party" / "Disclosing Party").
                            The purpose of this Agreement is to protect confidential information disclosed during the course of the Strategic Capacity Audit, Command Centre pilot, or other business interactions ("Permitted Purpose").
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>2. Confidential Information</h2>
                        <p>
                            "Confidential Information" means any non-public information disclosed by either party, whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.
                        </p>
                        <p>
                            Confidential Information includes, but is not limited to:
                        </p>
                        <ul>
                            <li>Strategic portfolio data, initiatives, budgets, and priority assessments.</li>
                            <li>Pricing, business plans, algorithms, and technical architecture of AlturaGov.</li>
                            <li>Any analysis, reports, or diagnostics generated from the disclosed data.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>3. Obligations of the Receiving Party</h2>
                        <p>
                            The Receiving Party agrees to:
                        </p>
                        <ul>
                            <li><strong>Limit use:</strong> Use the Confidential Information solely for the Permitted Purpose.</li>
                            <li><strong>Maintain secrecy:</strong> Use the same degree of care it uses to protect its own confidential information of like kind (but not less than reasonable care).</li>
                            <li><strong>Limit access:</strong> Restrict access to employees, contractors, and agents who need to know such information for the Permitted Purpose and who are bound by confidentiality obligations as least as protective as those in this Agreement.</li>
                            <li><strong>Data minimisation:</strong> The Disclosing Party must ensure no sensitive Personally Identifiable Information (PII) is uploaded to AlturaGov, as defined in our Privacy Policy.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>4. Exclusions</h2>
                        <p>
                            Confidential Information does not include information that:
                        </p>
                        <ul>
                            <li>Is or becomes generally available to the public without breach of this Agreement.</li>
                            <li>Was known to the Receiving Party prior to its disclosure by the Disclosing Party.</li>
                            <li>Is independently developed by the Receiving Party without use of or reference to the Disclosing Party's Confidential Information.</li>
                            <li>Is lawfully received from a third party without breach of any confidentiality obligation.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>5. Term and Termination</h2>
                        <p>
                            This Agreement shall commence on the date of agreement and shall remain in effect until either party terminates it with 30 days written notice. However, the obligations to protect Confidential Information disclosed prior to termination shall survive for a period of five (5) years from the date of disclosure.
                        </p>
                    </section>
                    
                    <section className="legal-section">
                        <h2>6. Return or Destruction of Materials</h2>
                        <p>
                            Upon the Disclosing Party's written request, the Receiving Party shall promptly return or, at the Disclosing Party's option, destroy all Confidential Information (including all copies) and certify such destruction in writing. Exceptions apply to automated backups governed by the Privacy Policy's retention periods, provided such backups remain subject to these confidentiality obligations.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>7. Governing Law</h2>
                        <p>
                            This Agreement shall be governed by and construed in accordance with the laws of New Zealand. Any disputes arising out of or in connection with this Agreement shall be subject to the exclusive jurisdiction of the courts of New Zealand.
                        </p>
                    </section>

                    <p className="legal-contact">
                        For questions regarding this Agreement, please contact <a href="mailto:support@alturagov.com">support@alturagov.com</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};
