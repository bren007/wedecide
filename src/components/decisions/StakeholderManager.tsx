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
    const [isExternal, setIsExternal] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');
    const [adding, setAdding] = useState(false);


    // Filter out users who are already stakeholders
    const availableUsers = users.filter(user =>
        !stakeholders.some(stakeholder => stakeholder.user_id === user.id)
    );

    async function handleAddStakeholder() {
        if (!isExternal && !selectedUserId) return;
        if (isExternal && !manualName) return;

        setAdding(true);
        try {
            if (isExternal) {
                await addStakeholder(undefined, manualName, manualEmail);
            } else {
                const userToAdd = users.find(u => u.id === selectedUserId);
                if (userToAdd) {
                    await addStakeholder(userToAdd.id, userToAdd.name, userToAdd.email);
                }
            }
            setIsAdding(false);
            setSelectedUserId('');
            setManualName('');
            setManualEmail('');
            setIsExternal(false);
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
                                <Button
                                    variant="danger"
                                    onClick={() => removeStakeholder(stakeholder.id)}
                                    className="remove-btn"
                                    title="Remove Stakeholder"
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
                    <div className="form-group stakeholder-type-toggle">
                        <label className="radio-label">
                            <input
                                type="radio"
                                checked={!isExternal}
                                onChange={() => setIsExternal(false)}
                            />
                            Team Member
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                checked={isExternal}
                                onChange={() => setIsExternal(true)}
                            />
                            External Person
                        </label>
                    </div>

                    {!isExternal ? (
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
                    ) : (
                        <div className="manual-entry">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="custom-input"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="email"
                                    placeholder="Email (Optional)"
                                    className="custom-input"
                                    value={manualEmail}
                                    onChange={(e) => setManualEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

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
                            disabled={(isExternal ? !manualName : !selectedUserId) || adding}
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
