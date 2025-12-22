import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useConsultation, type ConsultationMember } from '../../hooks/useStakeholders';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import { Button } from '../Button';
import { LoadingSpinner } from '../Loading';
import './StakeholderManager.css';

interface StakeholderManagerProps {
    decisionId: string;
    isOwner: boolean;
}

export function StakeholderManager({ decisionId, isOwner }: StakeholderManagerProps) {
    const {
        members: stakeholders,
        loading: stakeholdersLoading,
        addMember: addStakeholder,
        removeMember: removeStakeholder
    } = useConsultation(decisionId);
    const { users, loading: usersLoading } = useOrganizationUsers();

    const [isAdding, setIsAdding] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [adding, setAdding] = useState(false);

    // Filter out users who are already stakeholders
    const availableUsers = users.filter(user =>
        !stakeholders.some(stakeholder => stakeholder.user_id === user.id)
    );

    async function handleAddStakeholder() {
        if (!selectedUserId) return;

        const userToAdd = users.find(u => u.id === selectedUserId);
        if (!userToAdd) return;

        setAdding(true);
        try {
            await addStakeholder(userToAdd.id, userToAdd.name, userToAdd.email);
            setIsAdding(false);
            setSelectedUserId('');
        } catch (error) {
            console.error('Failed to add stakeholder:', error);
        } finally {
            setAdding(false);
        }
    }

    if (stakeholdersLoading || usersLoading) return <LoadingSpinner />;

    return (
        <div className="stakeholder-manager">
            <div className="stakeholder-header">
                <h3 className="stakeholder-title">People Involved (Consultation Log)</h3>
                {isOwner && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="add-btn"
                    >
                        <Plus size={16} />
                        Add Stakeholder
                    </button>
                )}
            </div>

            <div className="stakeholder-list">
                {stakeholders.length === 0 && !isAdding ? (
                    <p className="empty-state">No stakeholders added yet.</p>
                ) : (
                    stakeholders.map((stakeholder: ConsultationMember) => (
                        <div key={stakeholder.id} className="stakeholder-item">
                            <div className="stakeholder-info">
                                <div className="stakeholder-avatar">
                                    {stakeholder.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="stakeholder-details">
                                    <span className="stakeholder-name">{stakeholder.name}</span>
                                    <span className="stakeholder-email">{stakeholder.email}</span>
                                </div>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => removeStakeholder(stakeholder.id)}
                                    className="remove-btn"
                                    title="Remove Stakeholder"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <div className="add-stakeholder-form">
                    <div className="form-group">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="custom-select"
                        >
                            <option value="">Select a team member...</option>
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
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
                            onClick={handleAddStakeholder}
                            disabled={!selectedUserId || adding}
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
