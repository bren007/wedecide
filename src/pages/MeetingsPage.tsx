import React from 'react';
import { Card } from '../components/Card';
import { Calendar } from 'lucide-react';

export const MeetingsPage: React.FC = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-white mb-6">Meetings</h1>
            <Card>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-slate-900 p-4 rounded-full mb-4">
                        <Calendar size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-200 mb-2">Meetings Module Coming Soon</h2>
                    <p className="text-slate-500 max-w-md">
                        We are currently building the Meetings module. Soon you will be able to manage agendas, record decisions, and link them directly to your strategic initiatives.
                    </p>
                </div>
            </Card>
        </div>
    );
};
