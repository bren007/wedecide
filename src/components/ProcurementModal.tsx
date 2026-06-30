import React, { useState } from 'react';
import { X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import './ProcurementModal.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier: '6-Month Pilot — $9,500' | 'Annual Enterprise Licence — $25,000';
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export const ProcurementModal: React.FC<ProcurementModalProps> = ({ isOpen, onClose, initialTier }) => {
  const [form, setForm] = useState({
    full_name: '',
    work_email: '',
    phone: '',
    agency: '',
    selected_tier: initialTier,
    po_number: '',
    notes: '',
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState('loading');
    setErrorMsg('');

    try {
      // Write to Supabase invoice_requests table via Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/send-invoice-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Submission failed. Please try again.');
      }

      setSubmitState('success');
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || 'An unexpected error occurred.');
      setSubmitState('error');
    }
  };

  const handleClose = () => {
    setSubmitState('idle');
    setForm({ full_name: '', work_email: '', phone: '', agency: '', selected_tier: initialTier, po_number: '', notes: '' });
    onClose();
  };

  return (
    <div className="proc-overlay" onClick={handleClose}>
      <div className="proc-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="proc-title">

        <div className="proc-header">
          <div>
            <p className="proc-eyebrow">Formal Invoice Request</p>
            <h2 id="proc-title" className="proc-title">Request Invoice</h2>
          </div>
          <button onClick={handleClose} className="proc-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {submitState === 'success' ? (
          <div className="proc-success">
            <CheckCircle size={48} className="proc-success-icon" />
            <h3 className="proc-success-title">Invoice request received.</h3>
            <p className="proc-success-body">
              You will receive a GST-compliant NZ tax invoice at <strong>{form.work_email}</strong> within one business day. The invoice will reference your PO number (if provided) and include bank transfer payment details.
            </p>
            <p className="proc-success-body">
              Access to your Command Centre activates automatically upon payment confirmation. If you have a deadline or specific procurement requirements, reply directly to the invoice email.
            </p>
            <button onClick={handleClose} className="proc-done-btn">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="proc-form">

            <div className="proc-field-row">
              <div className="proc-field">
                <label htmlFor="full_name">Full Name <span className="proc-required">*</span></label>
                <input
                  id="full_name" name="full_name" type="text" required
                  value={form.full_name} onChange={handleChange}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="proc-field">
                <label htmlFor="work_email">Work Email <span className="proc-required">*</span></label>
                <input
                  id="work_email" name="work_email" type="email" required
                  value={form.work_email} onChange={handleChange}
                  placeholder="e.g. jane.smith@agency.govt.nz"
                />
              </div>
            </div>

            <div className="proc-field-row">
              <div className="proc-field">
                <label htmlFor="phone">Direct Phone Number <span className="proc-required">*</span></label>
                <input
                  id="phone" name="phone" type="tel" required
                  value={form.phone} onChange={handleChange}
                  placeholder="e.g. +64 4 xxx xxxx"
                />
              </div>
              <div className="proc-field">
                <label htmlFor="agency">Government Agency / Organisation <span className="proc-required">*</span></label>
                <input
                  id="agency" name="agency" type="text" required
                  value={form.agency} onChange={handleChange}
                  placeholder="e.g. Ministry of Business, Innovation and Employment"
                />
              </div>
            </div>

            <div className="proc-field">
              <label htmlFor="selected_tier">Selected Tier <span className="proc-required">*</span></label>
              <select id="selected_tier" name="selected_tier" required value={form.selected_tier} onChange={handleChange}>
                <option value="6-Month Pilot — $9,500">6-Month Pilot — $9,500</option>
                <option value="Annual Enterprise Licence — $25,000">Annual Enterprise Licence — $25,000</option>
              </select>
            </div>

            <div className="proc-field">
              <label htmlFor="po_number">
                Purchase Order (PO) Number
                <span className="proc-hint"> — Optional. If your finance team has issued a PO, enter it here. It will appear on your tax invoice.</span>
              </label>
              <input
                id="po_number" name="po_number" type="text"
                value={form.po_number} onChange={handleChange}
                placeholder="e.g. PO-2026-00142"
              />
            </div>

            <div className="proc-field">
              <label htmlFor="notes">
                Any procurement requirements or deadline constraints?
                <span className="proc-hint"> — Optional</span>
              </label>
              <textarea
                id="notes" name="notes" rows={3}
                value={form.notes} onChange={handleChange}
                placeholder="e.g. We need the invoice within 5 working days to meet our financial year close."
              />
            </div>

            {submitState === 'error' && (
              <div className="proc-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="proc-footer">
              <p className="proc-footer-note">
                No credit card required. We issue a compliant NZ tax invoice payable by bank transfer within one business day.
              </p>
              <button type="submit" className="proc-submit" disabled={submitState === 'loading'}>
                {submitState === 'loading' ? (
                  <><Loader size={16} className="proc-spinner" /> Submitting…</>
                ) : (
                  'Request Formal Invoice'
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
