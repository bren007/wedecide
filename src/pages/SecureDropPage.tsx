import React, { useState } from 'react';
import { UploadCloud, CheckCircle, ShieldCheck, FileText, Download, Loader2 } from 'lucide-react';
import { MAX_FILE_SIZE, VALID_APPROVAL_MANDATES, VALID_RELATIVE_PRIORITIES } from '../constants/validation';

import { supabase } from '../lib/supabase';
import Papa from 'papaparse';


interface CsvRow {
  initiative_name?: string;
  strategic_pillar?: string;
  approval_mandate?: string;
  relative_priority?: string;
  complexity_stakeholders_1_to_3?: string;
  complexity_novelty_1_to_3?: string;
  complexity_dependency_1_to_3?: string;
  current_fy_budget?: string;
  lifecycle_stage?: string;
  target_delivery_quarter?: string;
  next_milestone_date?: string;
  dependency_blockers?: string;
  [key: string]: unknown;
}



export default function SecureDropPage() {
    
    const [bookingEmail, setBookingEmail] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [duplicate, setDuplicate] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Ensure user is authenticated before allowing submission


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        validateAndSetFile(selectedFile);
    };



    const validateAndSetFile = (selectedFile: File | undefined) => {
        if (!selectedFile) return;

        // Ensure file is CSV
        if (!selectedFile.name.endsWith('.csv')) {
            setError('Please upload a .csv file using the provided template.');
            setFile(null);
            return;
        }
        // Enforce max file size (5MB)
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('File size exceeds 5MB limit.');
            setFile(null);
            return;
        }

        // Run CSV Structure Validation
        Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const required = [
                    'initiative_name', 'strategic_pillar', 'approval_mandate',
                    'relative_priority', 'complexity_stakeholders_1_to_3',
                    'complexity_novelty_1_to_3', 'complexity_dependency_1_to_3',
                    'current_fy_budget', 'lifecycle_stage', 'target_delivery_quarter',
                    'next_milestone_date', 'dependency_blockers'
                ];

                const missing = required.filter(h => !headers.includes(h));
                if (missing.length > 0) {
                    setError(`Invalid Template. Missing headers: ${missing.join(', ')}`);
                    setFile(null);
                    return;
                }

                const errors: string[] = [];
                for (let i = 0; i < results.data.length; i++) {
                    const row: CsvRow = results.data[i] as CsvRow;
                    const initName = row.initiative_name || `(Row ${i + 1})`;

                    if (!row.initiative_name) {
                        errors.push(`Row ${i + 1}: Missing required field [initiative_name].`);
                    }

                    if (!row.approval_mandate) {
                        errors.push(`Row ${i + 1} [${initName}]: Missing required field [approval_mandate].`);
                    } else if (!VALID_APPROVAL_MANDATES.includes(row.approval_mandate)) {
                        errors.push(`Row ${i + 1} [${initName}]: Invalid approval_mandate [${row.approval_mandate}]. Must be one of: ${VALID_APPROVAL_MANDATES.join(', ')}.`);
                    }

                    if (!row.relative_priority) {
                        errors.push(`Row ${i + 1} [${initName}]: Missing required field [relative_priority].`);
                    } else if (!VALID_RELATIVE_PRIORITIES.includes(row.relative_priority)) {
                        errors.push(`Row ${i + 1} [${initName}]: Invalid relative_priority [${row.relative_priority}]. Must be one of: ${VALID_RELATIVE_PRIORITIES.join(', ')}.`);
                    }

                    if (!row.target_delivery_quarter) {
                        errors.push(`Row ${i + 1} [${initName}]: Missing required field [target_delivery_quarter].`);
                    }

                    const validateScore = (val: string, field: string) => {
                        if (!val) { errors.push(`Row ${i + 1} [${initName}]: Missing required field [${field}].`); return; }
                        const num = parseInt(val, 10);
                        if (isNaN(num) || num < 1 || num > 3) errors.push(`Row ${i + 1} [${initName}]: Invalid ${field} (must be 1-3).`);
                    };

                    validateScore(row.complexity_stakeholders_1_to_3, 'complexity_stakeholders_1_to_3');
                    validateScore(row.complexity_novelty_1_to_3, 'complexity_novelty_1_to_3');
                    validateScore(row.complexity_dependency_1_to_3, 'complexity_dependency_1_to_3');
                }

                if (errors.length > 0) {
                    const summary = errors.length === 1
                        ? errors[0]
                        : `${errors.length} validation errors found:\n• ${errors.join('\n• ')}`;
                    setError(summary + '\n\nPlease correct the flagged rows and re-upload.');
                    setFile(null);
                } else {
                    // Ensure CSV has at least one data row
                    if (results.data.length === 0) {
                        setError('CSV contains no data rows.');
                        setFile(null);
                        return;
                    }
                    setFile(selectedFile);
                    setError(null);
                }
            },
            error: () => {
                setError('Failed to securely process the local CSV dataset. Please check the file formatting.');
                setFile(null);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
    setDuplicate(false);

        if (!bookingEmail || !file) {
            setError('Please provide your booking email and select a file.');
            return;
        }

        // Begin submission – disable the button to prevent double clicks
        setLoading(true);
        try {
            // Upload to audit_uploads bucket
            const fileExt = file.name.split('.').pop();
            const sanitizedEmail = bookingEmail.trim().toLowerCase();

            // Use sanitized email for all DB operations
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audit_uploads')
                .upload(`${sanitizedEmail}_${Date.now()}.${fileExt}`, file);

            if (uploadError) throw uploadError;

            // Upsert lead record based on email to avoid duplicate key errors
            const { error: upsertError } = await supabase
                .from('leads')
                .upsert(
                    {
                        email: sanitizedEmail,
                        file_url: uploadData.path,
                        audit_status: 'data_uploaded'
                    },
                    { onConflict: 'email' }
                );

            if (upsertError) throw upsertError;

            setSubmitted(true);
            setLoading(false);
            } catch (err: unknown) {
                console.error('Error securely transferring data:', err);
                const e = err as { code?: string; message?: string };
                // Detect duplicate lead error (unique constraint on email)
                if (e?.code === '23505' || e?.message?.includes('duplicate key')) {
                    setDuplicate(true);
                } else {
                    setError(e.message || 'An unexpected error occurred during secure transfer.');
                }
                setLoading(false);
                return;
            }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-12 font-sans flex flex-col items-center">
                <div className="w-full max-w-2xl px-4 sm:px-6 animate-in zoom-in duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-12 text-center overflow-hidden relative">
                        {/* Decorative Background glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                        <CheckCircle size={80} className="text-green-500 mx-auto mb-8 relative z-10" />
                        <h2 className="text-3xl font-extrabold text-white mb-4 relative z-10">Data Received & Secured</h2>
                        <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed relative z-10">
                            This file is now secured under the AlturaGov Mutual NDA and will be purged upon completion of your audit. You may now close this window.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    // Duplicate submission detected – show informational UI instead of form
    if (duplicate) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-12 font-sans flex flex-col items-center">
                <div className="w-full max-w-2xl px-4 sm:px-6 animate-in zoom-in duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-12 text-center overflow-hidden relative">
                        {/* Decorative Background glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <CheckCircle size={80} className="text-yellow-500 mx-auto mb-8 relative z-10" />
                        <h2 className="text-3xl font-extrabold text-white mb-4 relative z-10">Duplicate Request Detected</h2>
                        <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed relative z-10">
                            If you need to supply updated files, please contact AlturaGov support at support@alturagov.com.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-12 font-sans flex flex-col items-center">
            <div className="w-full max-w-3xl px-4 sm:px-6">

                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 flex justify-center items-center gap-4">
                        <ShieldCheck className="text-action-blue" size={40} /> Secure Drop Portal
                    </h1>
                    <p className="text-slate-400 max-w-xl mx-auto font-medium">
                        Upload your portfolio dataset to prepare for your Strategic Capacity Audit. Files must strictly adhere to the <span className="text-white font-bold">.csv format</span> using the provided template.
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-10">
                    <div className="mb-10 pb-8 border-b border-slate-800">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="bg-action-blue text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                            Download Audit Template
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-950 p-6 rounded-xl border border-slate-800">
                            <div>
                                <p className="text-slate-300 font-medium">Mandatory Data Schema</p>
                                <p className="text-sm text-slate-500">Ensure all rows contain required priority and complexity metrics.</p>
                            </div>
                            <a href="/audit_template.csv" download className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-slate-600">
                                <Download size={16} /> Download CSV
                            </a>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="bg-action-blue text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                            Upload Dataset
                        </h2>

                        <div className="mb-8">
                            <label className={`block text-sm font-bold mb-2 transition-colors ${file && !bookingEmail ? 'text-red-400' : 'text-slate-300'}`}>
                                Booking Email Address
                                {file && !bookingEmail && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-red-400/20 text-red-400 uppercase tracking-tighter">Required</span>}
                            </label>
                            <input
                                type="email"
                                required
                                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-action-blue focus:border-action-blue transition-all ${file && !bookingEmail ? 'border-red-500/50' : 'border-slate-700'}`}
                                placeholder="The email used to purchase your audit"
                                value={bookingEmail}
                                onChange={(e) => setBookingEmail(e.target.value)}
                            />
                            <p className="text-xs text-slate-500 mt-2">Required to link your file securely to your scheduled Slot-Sync session.</p>
                        </div>

                        <div className="mb-10">
                            <label className="block text-sm font-bold text-slate-300 mb-2">Raw Portfolio Dataset</label>

                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 transition-colors ${file ? 'border-action-blue bg-blue-950/20' : 'border-slate-700 bg-slate-950 group-hover:border-slate-500'}`}>
                                    {file ? (
                                        <>
                                            <FileText className="text-action-blue mb-3" size={48} />
                                            <span className="text-white font-bold mb-1">{file.name}</span>
                                            <span className="text-slate-400 text-sm">{(file.size / 1024).toFixed(2)} KB</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="text-slate-500 mb-4 group-hover:text-action-blue transition-colors" size={48} />
                                            <span className="text-white font-bold mb-2 text-lg">Drag & Drop your dataset here</span>
                                            <span className="text-slate-500 text-sm">Strictly validated .csv only.</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            {file && !bookingEmail && (
                                <p className="text-sm text-red-400 mt-3 font-semibold flex items-center gap-1">
                                    <span className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center text-[10px]">&times;</span>
                                    Please enter your booking email above to enable the transfer button.
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="mb-8 p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || !file || !bookingEmail}
                                className="bg-action-blue text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <div data-testid="loader">{loading ? (
                                    <div className="flex items-center">
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Transferring...
                                    </div>
                                ) : 'Securely Transfer Data'}</div>
                            </button>
                        </div>

                    </form>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-xs text-slate-500 tracking-wide font-medium uppercase">
                        Protected by AlturaGov Enterprise Encryption. All data purged after 60 days.
                    </p>
                </div>
            </div>
        </div>
    );
}


