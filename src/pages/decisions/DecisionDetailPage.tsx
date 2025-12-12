import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDecisions, type Decision } from '../../hooks/useDecisions';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/Loading';

export function DecisionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getDecision, updateDecision } = useDecisions();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleStatusChange(newStatus: 'draft' | 'active' | 'completed') {
        if (!decision) return;
        setUpdating(true);
        try {
            const updated = await updateDecision(decision.id, { status: newStatus });
            setDecision(updated);
        } catch (err) {
            console.error('Failed to update status:', err);
            // Optionally set an error message visible to the user
        } finally {
            setUpdating(false);
        }
    }

    useEffect(() => {
        async function loadDecision() {
            if (!id) return;
            try {
                setLoading(true);
                const data = await getDecision(id);
                if (data) {
                    setDecision(data);
                } else {
                    setError('Decision not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load decision');
            } finally {
                setLoading(false);
            }
        }
        loadDecision();
    }, [id]); // Removed getDecision dependency to avoid infinite loops if hook reference changes

    if (loading) return <LoadingSpinner fullScreen />;

    if (error || !decision) return (
        <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-1 text-sm text-gray-500">{error || 'Decision not found'}</p>
            <button onClick={() => navigate('/decisions')} className="mt-4 text-primary hover:underline">
                Back to Decisions
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => navigate('/decisions')}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 flex-1">{decision.title}</h1>
                <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                        ${decision.status === 'completed' ? 'bg-green-100 text-green-800' :
                            decision.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`}>
                        {decision.status}
                    </span>

                    {decision.status === 'draft' && (
                        <button
                            onClick={() => handleStatusChange('active')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Publish (Active)'}
                        </button>
                    )}

                    {decision.status === 'active' && (
                        <button
                            onClick={() => handleStatusChange('completed')}
                            disabled={updating}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Close (Complete)'}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Description</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>{decision.description || 'No description provided.'}</p>
                    </div>
                </div>
            </div>

            {/* Sections for Stakeholders and Documents will go here */}
        </div>
    );
}
