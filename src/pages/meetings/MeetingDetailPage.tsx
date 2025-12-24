import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetings, type Meeting } from '../../hooks/useMeetings';
import { useDecisions } from '../../hooks/useDecisions';
import { useAuth } from '../../context/AuthContext';
import { useToasts } from '../../context/ToastContext';
import {
    Calendar, MapPin, Clock, ArrowLeft, Plus,
    Trash2, Gavel, FileText, X, Link as LinkIcon
} from 'lucide-react';
import './MeetingDetailPage.css';

export const MeetingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getMeeting, createAgendaItem, deleteAgendaItem, updateMeeting, deleteMeeting, linkDecisionToAgendaItem } = useMeetings();
    const { decisions, refresh: refreshDecisions } = useDecisions();
    const { isChair, isAdmin } = useAuth();
    const { showToast } = useToasts();

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddAgenda, setShowAddAgenda] = useState(false);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [showDecisionPicker, setShowDecisionPicker] = useState<string | null>(null); // Agenda ID

    useEffect(() => {
        if (id) {
            loadMeeting();
        }
    }, [id]);

    const loadMeeting = async () => {
        try {
            setLoading(true);
            const data = await getMeeting(id!);
            setMeeting(data);
        } catch (err: any) {
            showToast('Failed to load meeting', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAgendaItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAgendaItem(id!, {
                title: newItemTitle,
                order_index: (meeting?.agenda_items?.length || 0) + 1
            });
            setNewItemTitle('');
            setShowAddAgenda(false);
            loadMeeting();
            showToast('Agenda item added', 'success');
        } catch (err: any) {
            showToast('Failed to add agenda item', 'error');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Remove this agenda item?')) return;
        try {
            await deleteAgendaItem(itemId);
            loadMeeting();
            showToast('Item removed', 'success');
        } catch (err: any) {
            showToast('Failed to remove item', 'error');
        }
    };

    const handleLinkDecision = async (agendaId: string, decisionId: string) => {
        try {
            await linkDecisionToAgendaItem(decisionId, agendaId);
            setShowDecisionPicker(null);
            loadMeeting();
            refreshDecisions();
            showToast('Decision linked to agenda', 'success');
        } catch (err: any) {
            showToast('Failed to link decision', 'error');
        }
    };

    const handleUnlinkDecision = async (decisionId: string) => {
        try {
            await linkDecisionToAgendaItem(decisionId, null);
            loadMeeting();
            refreshDecisions();
            showToast('Decision unlinked', 'info');
        } catch (err: any) {
            showToast('Failed to unlink decision', 'error');
        }
    };

    const handleStatusChange = async (status: Meeting['status']) => {
        try {
            await updateMeeting(id!, { status });
            setMeeting(prev => prev ? { ...prev, status } : null);
            showToast(`Meeting status updated to ${status}`, 'success');
        } catch (err: any) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleDeleteMeeting = async () => {
        if (!window.confirm('Permanently delete this meeting?')) return;
        try {
            await deleteMeeting(id!);
            navigate('/meetings');
            showToast('Meeting deleted', 'success');
        } catch (err: any) {
            showToast('Failed to delete meeting', 'error');
        }
    };

    if (loading) return (
        <div className="meetings-loading">
            <div className="spinner"></div>
            <p>Loading meeting details...</p>
        </div>
    );

    if (!meeting) return (
        <div className="meetings-error">
            <h3>Meeting not found</h3>
            <button className="btn-secondary" onClick={() => navigate('/meetings')}>Return to List</button>
        </div>
    );

    const formattedDate = new Date(meeting.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = new Date(meeting.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    return (
        <div className="meeting-detail-page">
            <nav className="detail-nav">
                <button className="back-btn" onClick={() => navigate('/meetings')}>
                    <ArrowLeft size={20} />
                    <span>Back to Meetings</span>
                </button>
                <div className="detail-actions">
                    {(isChair || isAdmin) && (
                        <>
                            {meeting.status === 'scheduled' && (
                                <button className="btn-status start" onClick={() => handleStatusChange('in_progress')}>
                                    Start Meeting
                                </button>
                            )}
                            {meeting.status === 'in_progress' && (
                                <button className="btn-status complete" onClick={() => handleStatusChange('completed')}>
                                    Complete Meeting
                                </button>
                            )}
                            <button className="btn-icon-danger" onClick={handleDeleteMeeting} title="Delete Meeting">
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </nav>

            <header className="meeting-header-detail">
                <div className={`status-badge detail status-${meeting.status}`}>{meeting.status}</div>
                <h1>{meeting.title}</h1>
                <div className="header-meta-detail">
                    <div className="meta-item">
                        <Calendar size={18} />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="meta-item">
                        <Clock size={18} />
                        <span>{formattedTime}</span>
                    </div>
                    {meeting.location && (
                        <div className="meta-item">
                            <MapPin size={18} />
                            <span className="location-text">{meeting.location}</span>
                        </div>
                    )}
                </div>
                {meeting.description && <p className="meeting-description-text">{meeting.description}</p>}
            </header>

            <main className="meeting-content-detail">
                <section className="agenda-section-detail">
                    <div className="section-header-detail">
                        <h2>Agenda</h2>
                        {meeting.status !== 'completed' && (
                            <button className="add-agenda-btn" onClick={() => setShowAddAgenda(true)}>
                                <Plus size={18} />
                                <span>Add Item</span>
                            </button>
                        )}
                    </div>

                    <div className="agenda-list-detail">
                        {meeting.agenda_items && meeting.agenda_items.length > 0 ? (
                            meeting.agenda_items.map((item, index) => (
                                <div key={item.id} className="agenda-item-tile">
                                    <div className="agenda-item-number">{index + 1}</div>
                                    <div className="agenda-item-body">
                                        <h3>{item.title}</h3>
                                        {item.decision ? (
                                            <div className="linked-decision-tag">
                                                <Gavel size={14} />
                                                <span className="label">Linked Decision: </span>
                                                <button
                                                    className="decision-link-btn"
                                                    onClick={() => navigate(`/decisions/${item.decision.id}`)}
                                                >
                                                    {item.decision.title}
                                                </button>
                                                <button
                                                    className="unlink-icon-btn"
                                                    onClick={() => handleUnlinkDecision(item.decision.id)}
                                                    title="Unlink decision"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="decision-picker-prompt">
                                                <LinkIcon size={14} />
                                                <button className="text-link-btn" onClick={() => setShowDecisionPicker(item.id)}>
                                                    Link a decision to this item
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {meeting.status !== 'completed' && (isChair || isAdmin) && (
                                        <button className="agenda-item-delete" onClick={() => handleDeleteItem(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="empty-agenda-detail">
                                <FileText size={48} />
                                <p>This meeting has no agenda items yet.</p>
                                <button className="btn-secondary btn-sm" onClick={() => setShowAddAgenda(true)}>Create the first item</button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {showAddAgenda && (
                <div className="modal-overlay" onClick={() => setShowAddAgenda(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Agenda Item</h3>
                            <button className="close-btn" onClick={() => setShowAddAgenda(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddAgendaItem}>
                            <div className="form-group">
                                <label>Item Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newItemTitle}
                                    onChange={e => setNewItemTitle(e.target.value)}
                                    placeholder="e.g., Financial Report Q3"
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddAgenda(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add to Agenda</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDecisionPicker && (
                <div className="modal-overlay" onClick={() => setShowDecisionPicker(null)}>
                    <div className="modal-card wide" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Link a Decision</h3>
                            <button className="close-btn" onClick={() => setShowDecisionPicker(null)}><X size={20} /></button>
                        </div>
                        <p className="modal-subtitle">Select a decision to present during this agenda item.</p>
                        <div className="decision-picker-scroll">
                            {decisions.filter(d => !d.agenda_item_id).length > 0 ? (
                                <div className="picker-grid">
                                    {decisions.filter(d => !d.agenda_item_id).map(d => (
                                        <div key={d.id} className="picker-option">
                                            <div className="option-info">
                                                <span className="option-title">{d.title}</span>
                                                <span className={`option-status status-${d.status}`}>{d.status}</span>
                                            </div>
                                            <button
                                                className="btn-primary btn-sm"
                                                onClick={() => handleLinkDecision(showDecisionPicker, d.id)}
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-picker-state">
                                    <p>No unlinked decisions available.</p>
                                    <button className="btn-secondary" onClick={() => navigate('/decisions/new')}>Create New Decision</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
