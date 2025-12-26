import { useState } from 'react';
import { X, Plus, Share2 } from 'lucide-react';
import { useAffectedParties, type AffectedParty } from '../../hooks/useAffectedParties';
import { Button } from '../Button';
import { LoadingSpinner } from '../Loading';
import './StakeholderManager.css'; // Reuse common styles

interface AffectedPartiesManagerProps {
    decisionId: string;
    isOwner: boolean;
}

export function AffectedPartiesManager({ decisionId, isOwner }: AffectedPartiesManagerProps) {
    const {
        parties,
        loading,
        addParty,
        removeParty
    } = useAffectedParties(decisionId);

    const [isAdding, setIsAdding] = useState(false);
    const [tempPartyName, setTempPartyName] = useState('');
    const [adding, setAdding] = useState(false);

    async function handleAddParty() {
        if (!tempPartyName.trim()) return;

        setAdding(true);
        try {
            await addParty(tempPartyName.trim());
            setIsAdding(false);
            setTempPartyName('');
        } catch (error) {
            console.error('Failed to add affected party:', error);
        } finally {
            setAdding(false);
        }
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="stakeholder-manager">
            <div className="stakeholder-header">
                <h3 className="stakeholder-title">Impact / Affected Parties</h3>
                {isOwner && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="add-btn"
                    >
                        <Plus size={16} />
                        Add Party
                    </button>
                )}
            </div>

            <div className="stakeholder-list">
                {parties.length === 0 && !isAdding ? (
                    <p className="empty-state">No affected parties listed.</p>
                ) : (
                    parties.map((party: AffectedParty) => (
                        <div key={party.id} className="stakeholder-item">
                            <div className="stakeholder-info">
                                <div className="stakeholder-avatar" style={{ background: 'var(--color-secondary-translucent)', color: 'var(--color-secondary)' }}>
                                    <Share2 size={16} />
                                </div>
                                <div className="stakeholder-details">
                                    <span className="stakeholder-name">{party.name}</span>
                                </div>
                            </div>
                            {isOwner && (
                                <Button
                                    variant="danger"
                                    onClick={() => removeParty(party.id)}
                                    className="remove-btn"
                                    title="Remove Party"
                                    size="sm"
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <div className="add-stakeholder-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="e.g. Local Sports Club, HR Team..."
                            className="custom-input"
                            value={tempPartyName}
                            onChange={(e) => setTempPartyName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddParty()}
                            autoFocus
                        />
                    </div>

                    <div className="form-actions-inline">
                        <Button
                            variant="ghost"
                            onClick={() => setIsAdding(false)}
                            disabled={adding}
                            className="btn--sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleAddParty}
                            disabled={!tempPartyName.trim() || adding}
                            className="btn--sm"
                        >
                            {adding ? 'Adding...' : 'Add'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
