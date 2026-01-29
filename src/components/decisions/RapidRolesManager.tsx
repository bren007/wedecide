import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import { useMeetingGroups } from '../../hooks/useMeetingGroups';
import type { RapidRoleAssignment } from '../../hooks/useRapidRoles';
import './RapidRolesManager.css';

interface RapidRolesManagerProps {
    roles: {
        recommend: RapidRoleAssignment[];
        agree: RapidRoleAssignment[];
        perform: RapidRoleAssignment[];
        input: RapidRoleAssignment[];
        decide: RapidRoleAssignment[];
    };
    onChange: (roles: RapidRolesManagerProps['roles']) => void;
    disabled?: boolean;
}


const ROLE_INFO = {
    recommend: {
        label: 'R - Recommend',
        description: 'Person who makes the recommendation or proposal',
        locked: true
    },
    agree: {
        label: 'A - Agree',
        description: 'People who must agree before the decision can proceed (e.g., Treasurer for financial decisions)',
        locked: false
    },
    perform: {
        label: 'P - Perform',
        description: 'People who will implement or execute the decision',
        locked: false
    },
    input: {
        label: 'I - Input',
        description: 'People who were consulted and provided input',
        locked: false
    },
    decide: {
        label: 'D - Decide',
        description: 'The decision-making body or person with final authority',
        locked: false
    }
};

export function RapidRolesManager({ roles, onChange, disabled = false }: RapidRolesManagerProps) {
    const { users } = useOrganizationUsers();
    const { meetingGroups } = useMeetingGroups();

    // Debug logging
    useEffect(() => {
        console.log('👥 Organization users loaded:', users);
        console.log('📋 Meeting groups loaded:', meetingGroups);
    }, [users, meetingGroups]);

    // Separate state for each role to prevent field replication
    const [roleStates, setRoleStates] = useState<Record<string, {
        selectionType: 'team' | 'group' | 'external';
        selectedUserId: string;
        externalName: string;
        externalRole: string;
        selectedMeetingGroupId: string;
    }>>({});

    // Get state for a specific role
    const getRoleState = (roleType: string) => {
        return roleStates[roleType] || {
            selectionType: 'team' as const,
            selectedUserId: '',
            externalName: '',
            externalRole: '',
            selectedMeetingGroupId: ''
        };
    };

    // Update state for a specific role
    const updateRoleState = (roleType: string, updates: Partial<ReturnType<typeof getRoleState>>) => {
        setRoleStates(prev => ({
            ...prev,
            [roleType]: { ...getRoleState(roleType), ...updates }
        }));
    };

    const addAssignment = (roleType: keyof typeof roles) => {
        const state = getRoleState(roleType);

        if (state.selectionType === 'group' && state.selectedMeetingGroupId) {
            // Add meeting group
            const meetingGroup = meetingGroups.find(mg => mg.id === state.selectedMeetingGroupId);
            if (meetingGroup) {
                onChange({
                    ...roles,
                    [roleType]: [...roles[roleType], {
                        role_type: roleType,
                        meeting_group_id: meetingGroup.id,
                        meeting_group_name: meetingGroup.name
                    }]
                });
                updateRoleState(roleType, { selectedMeetingGroupId: '' });
            }
        } else if (state.selectionType === 'external' && state.externalName) {
            // Add external person
            onChange({
                ...roles,
                [roleType]: [...roles[roleType], {
                    role_type: roleType,
                    external_name: state.externalName,
                    external_role: state.externalRole || undefined
                }]
            });
            updateRoleState(roleType, { externalName: '', externalRole: '' });
        } else if (state.selectionType === 'team' && state.selectedUserId) {
            // Add team member
            const selectedUser = users.find(u => u.id === state.selectedUserId);
            if (selectedUser) {
                onChange({
                    ...roles,
                    [roleType]: [...roles[roleType], {
                        role_type: roleType,
                        user_id: selectedUser.id,
                        user_name: selectedUser.name
                    }]
                });
                updateRoleState(roleType, { selectedUserId: '' });
            }
        }
    };

    const removeAssignment = (roleType: keyof typeof roles, index: number) => {
        onChange({
            ...roles,
            [roleType]: roles[roleType].filter((_, i) => i !== index)
        });
    };

    const renderAssignmentList = (roleType: keyof typeof roles) => {
        const assignments = roles[roleType];
        const info = ROLE_INFO[roleType];
        const state = getRoleState(roleType);

        return (
            <div className="rapid-role-section" key={roleType}>
                <div className="role-header">
                    <h4 className="role-label">{info.label}</h4>
                    <p className="role-description">{info.description}</p>
                </div>

                <div className="role-assignments" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {assignments.map((assignment, index) => (
                        <div key={index} className="assignment-item">
                            <UserPlus size={14} />
                            <span className="assignment-name">
                                {assignment.user_name || assignment.meeting_group_name || assignment.external_name}
                                {assignment.external_role && ` (${assignment.external_role})`}
                            </span>
                            {!info.locked && (
                                <button
                                    type="button"
                                    onClick={() => removeAssignment(roleType, index)}
                                    className="remove-btn"
                                    disabled={disabled}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {!info.locked && (
                    <div className="role-add-section">
                        {/* All roles now support: Team Member | Decision Group | External Person */}
                        <div className="assignment-type-toggle">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    checked={state.selectionType === 'team'}
                                    onChange={() => updateRoleState(roleType, { selectionType: 'team' })}
                                    disabled={disabled}
                                />
                                Team Member
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    checked={state.selectionType === 'group'}
                                    onChange={() => updateRoleState(roleType, { selectionType: 'group' })}
                                    disabled={disabled}
                                />
                                Decision Group
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    checked={state.selectionType === 'external'}
                                    onChange={() => updateRoleState(roleType, { selectionType: 'external' })}
                                    disabled={disabled}
                                />
                                External Person
                            </label>
                        </div>

                        {/* Team Member Selection */}
                        {state.selectionType === 'team' && (
                            <div className="input-with-button">
                                <select
                                    value={state.selectedUserId}
                                    onChange={(e) => updateRoleState(roleType, { selectedUserId: e.target.value })}
                                    className="rapid-select"
                                    disabled={disabled}
                                >
                                    <option value="">Select a person...</option>
                                    {users.filter(u => !roles[roleType].some(a => a.user_id === u.id)).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => addAssignment(roleType)}
                                    disabled={!state.selectedUserId || disabled}
                                >
                                    <PlusIcon />
                                </Button>
                            </div>
                        )}

                        {/* Decision Group Selection */}
                        {state.selectionType === 'group' && (
                            <div className="input-with-button">
                                <select
                                    value={state.selectedMeetingGroupId}
                                    onChange={(e) => updateRoleState(roleType, { selectedMeetingGroupId: e.target.value })}
                                    className="rapid-select"
                                    disabled={disabled}
                                >
                                    <option value="">Select decision-making group...</option>
                                    {meetingGroups.map(mg => (
                                        <option key={mg.id} value={mg.id}>{mg.name}</option>
                                    ))}
                                </select>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => addAssignment(roleType)}
                                    disabled={!state.selectedMeetingGroupId || disabled}
                                >
                                    <PlusIcon />
                                </Button>
                            </div>
                        )}

                        {/* External Person Entry */}
                        {state.selectionType === 'external' && (
                            <div className="external-entry">
                                <div className="input-with-button">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', flex: 1 }}>
                                        <Input
                                            placeholder="Full Name (Press Enter to add)"
                                            value={state.externalName}
                                            onChange={(e) => updateRoleState(roleType, { externalName: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (state.externalName) addAssignment(roleType);
                                                }
                                            }}
                                            disabled={disabled}
                                        />
                                        <Input
                                            placeholder="Role/Title (Optional)"
                                            value={state.externalRole}
                                            onChange={(e) => updateRoleState(roleType, { externalRole: e.target.value })}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (state.externalName) addAssignment(roleType);
                                                }
                                            }}
                                            disabled={disabled}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => addAssignment(roleType)}
                                        disabled={!state.externalName || disabled}
                                    >
                                        <PlusIcon />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="rapid-roles-manager">
            {(Object.keys(ROLE_INFO) as Array<keyof typeof roles>).map(roleType => renderAssignmentList(roleType))}
        </div>
    );
}

function PlusIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
