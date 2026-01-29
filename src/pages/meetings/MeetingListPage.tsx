import React, { useState } from 'react';
import { useMeetings, type Meeting } from '../../hooks/useMeetings';
import { useAuth } from '../../context/AuthContext';
import { useToasts } from '../../context/ToastContext';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronRight, Plus } from 'lucide-react';
import { MeetingForm, type MeetingFormData } from '../../components/meetings/MeetingForm';
import './MeetingListPage.css';

export const MeetingListPage: React.FC = () => {
    const { meetings, loading, error, createMeeting } = useMeetings();
    const { isChair, isAdmin } = useAuth();
    const { showToast } = useToasts();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateMeeting = async (data: MeetingFormData) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            await createMeeting(data);
            setShowCreateModal(false);
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
                <MeetingForm
                    onSubmit={handleCreateMeeting}
                    onCancel={() => setShowCreateModal(false)}
                    isSubmitting={isSubmitting}
                    submitLabel="Schedule Meeting"
                    title="Schedule Meeting"
                />
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
