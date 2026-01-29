import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { useMeetings } from '../../hooks/useMeetings';

interface AttendeePickerProps {
    excludeUserIds: string[];
    onInvite: (userId: string) => Promise<void>;
    onClose: () => void;
}

export const AttendeePicker: React.FC<AttendeePickerProps> = ({ excludeUserIds, onInvite, onClose }) => {
    const { getOrgUsers } = useMeetings();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [inviting, setInviting] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getOrgUsers();
            setUsers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userId: string) => {
        try {
            setInviting(userId);
            await onInvite(userId);
            // Optionally remove from list locally or show success state
        } catch (err) {
            // Error handled by parent toast usually
        } finally {
            setInviting(null);
        }
    };

    const filteredUsers = users
        .filter(u => !excludeUserIds.includes(u.id))
        .filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Invite Attendees</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="picker-search">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="picker-list">
                    {loading ? (
                        <div className="picker-loading">Loading users...</div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <div key={user.id} className="picker-user-row">
                                <div className="user-info">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                                <button
                                    className="btn-primary btn-sm"
                                    onClick={() => handleInvite(user.id)}
                                    disabled={inviting === user.id}
                                >
                                    {inviting === user.id ? 'Inviting...' : <><UserPlus size={14} /> Invite</>}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="empty-picker-state">
                            <p>No available users found matching "{search}".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
