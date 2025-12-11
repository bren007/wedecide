import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// import { useDecision } from '../../hooks/useDecisions'; // We'll implement this hook update later

export function DecisionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Placeholder data
    const decision = {
        id,
        title: 'Placeholder Decision',
        description: 'This is a placeholder for the decision detail view.',
        status: 'draft',
        created_at: new Date().toISOString()
    };

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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {decision.status}
                </span>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Description</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>{decision.description}</p>
                    </div>
                </div>
            </div>

            {/* Sections for Stakeholders and Documents will go here */}
        </div>
    );
}
