import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDecisions } from '../../hooks/useDecisions';
import { ArrowLeft } from 'lucide-react';
import { DecisionForm, type DecisionFormData } from '../../components/decisions/DecisionForm';
import { supabase } from '../../lib/supabase';
import './DecisionCreatePage.css';

export function DecisionCreatePage() {
    const navigate = useNavigate();
    const { createDecision } = useDecisions();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(data: DecisionFormData) {
        setLoading(true);
        setError(null);

        try {
            // 1. Create the Decision
            const decision = await createDecision({
                title: data.title,
                decision: data.decision,
                description: data.description,
                decision_type: data.decision_type
            });

            if (!decision) throw new Error('Failed to create decision object');

            // 2. Add People Involved (Consultation Log)
            if (data.initialPeople && data.initialPeople.length > 0) {
                await Promise.all(data.initialPeople.map(p =>
                    supabase.from('stakeholders').insert({
                        decision_id: decision.id,
                        user_id: p.userId,
                        name: p.name,
                        email: p.email
                    })
                ));
            }

            // 3. Add Documents
            if (data.initialDocuments && data.initialDocuments.length > 0) {
                await Promise.all(data.initialDocuments.map(doc =>
                    supabase.from('documents').insert({
                        decision_id: decision.id,
                        organization_id: decision.organization_id,
                        uploaded_by: decision.owner_id,
                        name: doc.name,
                        url: doc.url,
                        type: doc.type,
                        is_part_of_meeting_pack: false
                    })
                ));
            }

            // 4. Add Affected Parties
            if (data.affectedParties && data.affectedParties.length > 0) {
                await Promise.all(data.affectedParties.map(party =>
                    supabase.from('affected_parties').insert({
                        decision_id: decision.id,
                        name: party
                    })
                ));
            }

            navigate(`/decisions/${decision.id}`);
        } catch (err) {
            console.error('Decision creation failed:', err);
            setError('Failed to create decision. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="create-decision-page">
            <div className="page-header">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="back-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '0.25rem' }} />
                        Back
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create New Decision</h1>
                </div>
            </div>

            <DecisionForm
                onSubmit={handleSubmit}
                onCancel={() => navigate(-1)}
                isLoading={loading}
                submitLabel="Create Decision"
                error={error}
            />
        </div>
    );
}
