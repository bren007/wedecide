
import React from 'react';
import { StrategicLedger } from '../components/StrategicLedger';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const StrategicLedgerPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen bg-slate-950 text-slate-200 font-sans flex flex-col overflow-hidden pt-24">
            {/* Header - Hidden on Print */}
            <div className="flex-none px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center gap-4 print:hidden">
                <Button onClick={() => navigate(-1)} variant="secondary" className="mr-4">
                    <ArrowLeft size={16} className="mr-2" />
                    Back
                </Button>
                <h1 className="text-xl font-bold text-white">Strategic Audit Log</h1>
            </div>

            {/* Main Content - Printable */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full print:p-0 print:overflow-visible">
                <StrategicLedger />
            </div>
        </div>
    );
};
