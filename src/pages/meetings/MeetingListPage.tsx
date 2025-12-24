import React, { useState } from 'react';
import { useMeetings, type Meeting } from '../../hooks/useMeetings';
import { useAuth } from '../../context/AuthContext';
import { useToasts } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronRight, Plus, X } from 'lucide-react';
import './MeetingListPage.css';

export const MeetingListPage: React.FC = () => {
    const { meetings, loading, error, createMeeting } = useMeetings();
    const { isChair, isAdmin } = useAuth();
    const { showToast } = useToasts();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        scheduled_at: '',
        description: '',
        location: ''
    });

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await createMeeting(newMeeting);
            setShowCreateModal(false);
            setNewMeeting({ title: '', scheduled_at: '', description: '', location: '' });
            showToast('Meeting created successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to create meeting', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="meetings-loading">
            <div className="spinner"></div>
            <p>Loading meetings...</p>
        </div>
    );

    if (error) return (
        <div className="meetings-error">
            <h3>Error loading meetings</h3>
            <p>{error.message}</p>
        </div>
    );

    const now = new Date();
    const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_at) >= now && m.status !== 'cancelled');
    const pastMeetings = meetings.filter(m => new Date(m.scheduled_at) < now || m.status === 'cancelled').reverse();

    return (
        <div className="meeting-list-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>Meetings</h1>
                    <p className="header-subtitle">Formal gatherings and governance sessions.</p>
                </div>
                {(isChair || isAdmin) && (
                    <button
                        className="create-meeting-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={20} />
                        <span>New Meeting</span>
                    </button>
                )}
            </header>

            <div className="meeting-content">
                <section className="meeting-section">
                    <h2 className="section-title">Upcoming</h2>
                    {upcomingMeetings.length > 0 ? (
                        <div className="meeting-grid">
                            {upcomingMeetings.map(meeting => (
                                <MeetingCard key={meeting.id} meeting={meeting} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <p>No upcoming meetings scheduled.</p>
                            {(isChair || isAdmin) && (
                                <button className="btn-link" onClick={() => setShowCreateModal(true)}>
                                    Schedule the first one
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {pastMeetings.length > 0 && (
                    <section className="meeting-section past">
                        <h2 className="section-title">Past & Cancelled</h2>
                        <div className="meeting-grid">
                            {pastMeetings.map(meeting => (
                                <MeetingCard key={meeting.id} meeting={meeting} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Schedule Meeting</h3>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateMeeting}>
                            <div className="form-group">
                                <label>Meeting Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newMeeting.title}
                                    onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                                    placeholder="e.g., Q4 Strategy Session"
                                    autoFocus
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newMeeting.scheduled_at}
                                        onChange={e => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Location / Link</label>
                                <div className="input-with-icon">
                                    <MapPin size={18} />
                                    <input
                                        type="text"
                                        value={newMeeting.location}
                                        onChange={e => setNewMeeting({ ...newMeeting, location: e.target.value })}
                                        placeholder="Physical room or URL"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Brief Description</label>
                                <textarea
                                    value={newMeeting.description}
                                    onChange={e => setNewMeeting({ ...newMeeting, description: e.target.value })}
                                    placeholder="Add context for attendees..."
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Schedule Meeting'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const MeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
    const date = new Date(meeting.scheduled_at);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <Link to={`/meetings/${meeting.id}`} className={`meeting-card status-${meeting.status}`}>
            <div className="meeting-date-badge">
                <span className="month">{month}</span>
                <span className="day">{day}</span>
            </div>
            <div className="meeting-info">
                <div className="meeting-top">
                    <h3 className="meeting-title">{meeting.title}</h3>
                    <div className="status-indicator">{meeting.status}</div>
                </div>
                <div className="meeting-meta">
                    <div className="meta-item">
                        <Clock size={14} />
                        <span>{time}</span>
                    </div>
                    {meeting.location && (
                        <div className="meta-item">
                            <MapPin size={14} />
                            <span className="truncate">{meeting.location}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="meeting-arrow">
                <ChevronRight size={20} />
            </div>
        </Link>
    );
};
