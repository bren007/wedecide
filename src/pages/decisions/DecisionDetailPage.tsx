import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDecisions, type Decision } from '../../hooks/useDecisions';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '../../components/Loading';

export function DecisionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getDecision } = useDecisions();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                <h1 className="text-2xl font-bold text-gray-900">{decision.title}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize 
                    ${decision.status === 'completed' ? 'bg-green-100 text-green-800' :
                        decision.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                    {decision.status}
                </span>
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
