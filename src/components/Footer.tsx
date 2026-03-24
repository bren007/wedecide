import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer: React.FC = () => {
    return (
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
    );
};
