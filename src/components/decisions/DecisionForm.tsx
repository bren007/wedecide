import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { X, UserPlus, Link as LinkIcon, Check, ChevronDown, Share2 } from 'lucide-react';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import { useAuth } from '../../context/AuthContext';
import './DecisionForm.css';

const BASE_PERSISTENCE_KEY = 'wedecide_decision_draft';


export interface DecisionFormData {
    title: string;
    decision: string;
    description: string;
    decision_type: 'approve' | 'note' | null;
    initialPeople?: { userId?: string; name: string; email: string }[];
    initialDocuments?: { name: string; url: string; type: string }[];
    affectedParties?: string[];
}


interface DecisionFormProps {
    initialData?: DecisionFormData;
    onSubmit: (data: DecisionFormData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    submitLabel?: string;
    error?: string | null;
}

export function DecisionForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitLabel = 'Create Decision',
    error: externalError
}: DecisionFormProps) {
    const { user } = useAuth();
    const { users } = useOrganizationUsers();

    // User-specific persistence key
    const PERSISTENCE_KEY = user ? `${BASE_PERSISTENCE_KEY}_${user.id}` : null;

    // Step state: 1: Identity & Type, 2: Evidence, 3: Consultation, 4: Impact, 5: Review
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Core Fields
    const [title, setTitle] = useState(initialData?.title || '');
    const [decisionText, setDecisionText] = useState(initialData?.decision || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [decisionType, setDecisionType] = useState<'approve' | 'note'>(initialData?.decision_type || 'approve');

    // List Fields
    const [people, setPeople] = useState<{ userId?: string; name: string; email: string }[]>(initialData?.initialPeople || []);
    const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>(initialData?.initialDocuments || []);

    const [affectedParties, setAffectedParties] = useState<string[]>(initialData?.affectedParties || []);

    // Temp state for adding items
    const [selectedUserId, setSelectedUserId] = useState('');
    const [tempDocName, setTempDocName] = useState('');
    const [tempDocUrl, setTempDocUrl] = useState('');
    const [tempPartyName, setTempPartyName] = useState('');
    const [isExternal, setIsExternal] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualEmail, setManualEmail] = useState('');

    // Validation Errors
    const [emailError, setEmailError] = useState('');
    const [urlError, setUrlError] = useState('');


    const formRef = useRef<HTMLFormElement>(null);

    // Persistence: Load from localStorage on mount
    useEffect(() => {
        if (!PERSISTENCE_KEY) return;

        const saved = localStorage.getItem(PERSISTENCE_KEY);
        if (saved && !initialData) {
            try {
                const data = JSON.parse(saved);
                if (data.title) setTitle(data.title);
                if (data.decision) setDecisionText(data.decision);
                if (data.description) setDescription(data.description);
                if (data.decision_type) setDecisionType(data.decision_type);
                if (data.initialPeople) setPeople(data.initialPeople);
                if (data.initialDocuments) setDocuments(data.initialDocuments);
                if (data.affectedParties) setAffectedParties(data.affectedParties);
                if (data.currentStep) setCurrentStep(data.currentStep);
                if (data.completedSteps) setCompletedSteps(data.completedSteps);
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, [initialData, PERSISTENCE_KEY]);

    // Persistence: Save to localStorage on change
    useEffect(() => {
        if (PERSISTENCE_KEY && !initialData && (title || decisionText || description || people.length > 0 || documents.length > 0 || affectedParties.length > 0)) {
            const data = {
                title,
                decision: decisionText,
                description,
                decision_type: decisionType,
                initialPeople: people,
                initialDocuments: documents,
                affectedParties,
                currentStep,
                completedSteps
            };
            localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(data));
        }
    }, [title, decisionText, description, decisionType, people, documents, affectedParties, currentStep, completedSteps, initialData, PERSISTENCE_KEY]);

    // Sync state with initialData if it changes (e.g. on Edit page load)
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setDecisionText(initialData.decision || '');
            setDescription(initialData.description || '');
            setDecisionType(initialData.decision_type || 'approve');
            setPeople(initialData.initialPeople || []);
            setDocuments(initialData.initialDocuments || []);
            setAffectedParties(initialData.affectedParties || []);
            // Usually we stay on step 1 for edit
        }
    }, [initialData]);

    const clearDraft = () => {
        if (PERSISTENCE_KEY) {
            localStorage.removeItem(PERSISTENCE_KEY);
        }
    };

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Precisely anchor active step to navbar during transitions
    useEffect(() => {
        const activeStep = formRef.current?.querySelector('.wizard-step.active') as HTMLElement;
        if (activeStep) {
            const navHeight = 90; // Header offset
            const startTime = Date.now();
            const duration = 500; // Match 0.4s CSS + buffer
            let frameId: number;

            const stickToTop = () => {
                const elapsed = Date.now() - startTime;
                const rect = activeStep.getBoundingClientRect();
                const delta = rect.top - navHeight;

                if (Math.abs(delta) > 0.5) {
                    window.scrollBy(0, delta);
                }

                if (elapsed < duration) {
                    frameId = requestAnimationFrame(stickToTop);
                }
            };

            frameId = requestAnimationFrame(stickToTop);
            return () => cancelAnimationFrame(frameId);
        }
    }, [currentStep]);




    const completeStep = (step: number) => {
        if (!completedSteps.includes(step)) {
            setCompletedSteps([...completedSteps, step]);
        }
        if (currentStep === step) {
            setCurrentStep(step + 1);
        }
    };

    const goToStep = (step: number) => {
        if (step <= completedSteps.length + 1) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await onSubmit({
            title,
            decision: decisionText,
            description,
            decision_type: decisionType,
            initialPeople: people,
            initialDocuments: documents,
            affectedParties
        });

        // Clear draft AFTER successful submission
        clearDraft();
    };


    const isValidEmail = (email: string) => {
        if (!email) return true; // Optional email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidUrl = (url: string) => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    const addPerson = () => {
        setEmailError('');
        if (isExternal) {
            if (!manualName) return;
            if (manualEmail && !isValidEmail(manualEmail)) {
                setEmailError('Please enter a valid email address');
                return;
            }
            setPeople([...people, { name: manualName, email: manualEmail }]);
            setManualName('');
            setManualEmail('');
        } else {
            if (!selectedUserId) return;
            const userToAdd = users.find(u => u.id === selectedUserId);
            if (userToAdd && !people.some(p => p.userId === selectedUserId)) {
                setPeople([...people, { userId: userToAdd.id, name: userToAdd.name, email: userToAdd.email }]);
                setSelectedUserId('');
            }
        }
    };


    const addDocument = () => {
        setUrlError('');
        if (!tempDocName || !tempDocUrl) return;

        if (!isValidUrl(tempDocUrl)) {
            setUrlError('Please enter a valid URL (including https://)');
            return;
        }

        setDocuments([...documents, { name: tempDocName, url: tempDocUrl, type: 'url' }]);
        setTempDocName('');
        setTempDocUrl('');
    };

    const addAffectedParty = () => {
        if (!tempPartyName) return;
        if (!affectedParties.includes(tempPartyName)) {
            setAffectedParties([...affectedParties, tempPartyName]);
            setTempPartyName('');
        }
    };

    const renderStepHeader = (step: number, title: string, summary: string, displayStep?: number) => {
        const isActive = currentStep === step;
        const isCompleted = completedSteps.includes(step);

        return (
            <div
                className={`step-header ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => isCompleted && goToStep(step)}
            >
                <div className="step-number">
                    {isCompleted ? <Check size={16} /> : (displayStep || step)}
                </div>
                <div className="step-info">
                    <h3 className="step-title">{title}</h3>
                    {!isActive && isCompleted && <p className="step-summary">{summary}</p>}
                </div>
                {isCompleted && !isActive && <ChevronDown size={20} className="step-chevron" />}
                {!isCompleted && !isActive && <div className="step-lock" />}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="vertical-wizard-form container-entity" ref={formRef}>

            {externalError && <div className="decision-error-message">{externalError}</div>}

            {/* Step 1: Decision Details */}
            <div className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${completedSteps.includes(1) ? 'completed' : ''}`}>
                {renderStepHeader(1, "Name & Context", title || "Untitled Decision", 1)}
                <div className="step-content">


                    <div className="form-group">
                        <Input
                            label="Decision Name"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="A short, clear name for the agenda (e.g. Q4 Budget Approval)"
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="decisionText" className="form-label">The Decision to be Made</label>
                        <textarea
                            id="decisionText"
                            className="form-textarea"
                            value={decisionText}
                            onChange={(e) => setDecisionText(e.target.value)}
                            placeholder="What exactly is being decided? (e.g. To approve the 2024 Q4 budget as presented by the Treasurer)"
                            rows={3}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Decision Type</label>
                        <div className="type-options horizontal">

                            <div
                                className={`type-card compact ${decisionType === 'approve' ? 'selected' : ''}`}
                                onClick={() => setDecisionType('approve')}
                            >
                                <div className="type-icon approve"><Check size={16} /></div>
                                <div className="type-text">
                                    <strong>Approve</strong>
                                    <span>Needs agreement</span>
                                </div>
                            </div>
                            <div
                                className={`type-card compact ${decisionType === 'note' ? 'selected' : ''}`}
                                onClick={() => setDecisionType('note')}
                            >
                                <div className="type-icon note">📝</div>
                                <div className="type-text">
                                    <strong>Note</strong>
                                    <span>For the record</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description" className="form-label">Supporting Information</label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide context, why is this decision needed now? What are the key points?"
                            rows={4}
                            disabled={isLoading}
                        />
                    </div>


                    <div className="step-actions">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => title && decisionText && completeStep(1)}
                            disabled={!title || !decisionText}
                        >
                            Next: Supporting Documents
                        </Button>
                    </div>
                </div>
            </div>

            {/* Step 2: Supporting Evidence */}
            <div className={`wizard-step ${currentStep === 2 ? 'active' : ''} ${completedSteps.includes(2) ? 'completed' : ''} ${completedSteps.includes(1) ? '' : 'disabled'}`}>
                {renderStepHeader(2, "Supporting Documents", `${documents.length} ${documents.length === 1 ? 'document' : 'documents'} added`, 2)}
                <div className="step-content">


                    <div className="wizard-list">
                        {documents.map((d, i) => (
                            <div key={`doc-${i}`} className="wizard-list-item">
                                <LinkIcon size={14} />
                                <span title={d.url}>{d.name}</span>
                                <button type="button" onClick={() => setDocuments(documents.filter((_, idx) => idx !== i))}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>


                    <div className="item-add-grid">
                        <Input
                            placeholder="Document Name (e.g. Safety Plan)"
                            value={tempDocName}
                            onChange={(e) => setTempDocName(e.target.value)}
                        />
                        <div className="input-with-button">
                            <Input
                                placeholder="URL (https://...)"
                                value={tempDocUrl}
                                onChange={(e) => {
                                    setTempDocUrl(e.target.value);
                                    if (urlError) setUrlError('');
                                }}
                                error={urlError}
                            />
                            <Button type="button" variant="ghost" onClick={addDocument} disabled={!tempDocName || !tempDocUrl}>
                                <PlusIcon />
                            </Button>
                        </div>
                    </div>

                    <div className="step-actions">
                        <Button type="button" variant="primary" onClick={() => {
                            if (tempDocName && tempDocUrl) {
                                if (!isValidUrl(tempDocUrl)) {
                                    setUrlError('Please enter a valid URL');
                                    return;
                                }
                                addDocument();
                            }
                            completeStep(2);
                        }}>
                            Next: People Consulted
                        </Button>
                    </div>

                </div>
            </div>

            {/* Step 3: People Consulted */}
            <div className={`wizard-step ${currentStep === 3 ? 'active' : ''} ${completedSteps.includes(3) ? 'completed' : ''} ${completedSteps.includes(2) ? '' : 'disabled'}`}>
                {renderStepHeader(3, "People Consulted", `${people.length} ${people.length === 1 ? 'person' : 'people'} consulted`, 3)}
                <div className="step-content">


                    <div className="wizard-list">
                        {people.map((p, i) => (
                            <div key={p.userId || `ext-${i}`} className="wizard-list-item">
                                <UserPlus size={14} />
                                <span>{p.name}</span>
                                <button type="button" onClick={() => setPeople(people.filter((_, idx) => idx !== i))}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>


                    <div className="stakeholder-type-toggle">
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
                        <div className="input-with-button">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="wizard-select"
                            >
                                <option value="">Select a person...</option>
                                {users.filter(u => !people.some(p => p.userId === u.id)).map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <Button type="button" variant="ghost" onClick={addPerson} disabled={!selectedUserId}>
                                <PlusIcon />
                            </Button>
                        </div>
                    ) : (
                        <div className="manual-entry">
                            <div className="input-with-button">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', flex: 1 }}>
                                    <Input
                                        placeholder="Full Name"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Email (Optional)"
                                        value={manualEmail}
                                        onChange={(e) => {
                                            setManualEmail(e.target.value);
                                            if (emailError) setEmailError('');
                                        }}
                                        error={emailError}
                                    />
                                </div>
                                <Button type="button" variant="ghost" onClick={addPerson} disabled={!manualName}>
                                    <PlusIcon />
                                </Button>
                            </div>
                        </div>
                    )}


                    <div className="step-actions">
                        <Button type="button" variant="primary" onClick={() => {
                            // Only add if there is something in the manual fields or selection
                            if (isExternal ? manualName.trim() : selectedUserId) {
                                if (isExternal && manualEmail && !isValidEmail(manualEmail)) {
                                    setEmailError('Please enter a valid email address');
                                    return;
                                }
                                addPerson();
                            }
                            completeStep(3);
                        }}>
                            Next: Impact
                        </Button>
                    </div>

                </div>
            </div>

            {/* Step 4: Stakeholders Impacted */}
            <div className={`wizard-step ${currentStep === 4 ? 'active' : ''} ${completedSteps.includes(4) ? 'completed' : ''} ${completedSteps.includes(3) ? '' : 'disabled'}`}>
                {renderStepHeader(4, "Stakeholders Impacted", `${affectedParties.length} ${affectedParties.length === 1 ? 'party' : 'parties'} affected`, 4)}
                <div className="step-content">


                    <div className="wizard-list">
                        {affectedParties.map((party, i) => (
                            <div key={`party-${i}-${party}`} className="wizard-list-item">
                                <Share2 size={14} />
                                <span>{party}</span>
                                <button type="button" onClick={() => setAffectedParties(affectedParties.filter((_, idx) => idx !== i))}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>


                    <div className="input-with-button">
                        <Input
                            placeholder="e.g. Local Sports Club, HR Team, Finance..."
                            value={tempPartyName}
                            onChange={(e) => setTempPartyName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAffectedParty())}
                        />
                        <Button type="button" variant="ghost" onClick={addAffectedParty} disabled={!tempPartyName}>
                            <PlusIcon />
                        </Button>
                    </div>

                    <div className="step-actions">
                        <Button type="button" variant="primary" onClick={() => {
                            if (tempPartyName) addAffectedParty();
                            completeStep(4);
                        }}>
                            Final Review
                        </Button>
                    </div>

                </div>
            </div>

            {/* Step 5: Final Review & Submit (Old Step 6) */}
            <div className={`wizard-step ${currentStep === 5 ? 'active' : ''} ${completedSteps.includes(5) ? 'completed' : ''} ${completedSteps.includes(4) ? '' : 'disabled'}`}>
                {renderStepHeader(5, "Review & Launch", "Ready to publish", 5)}
                <div className="step-content">
                    <div className="review-summary-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <div className="review-intro">
                            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-secondary)' }}>You are about to create a decision named:</p>
                            <h2 style={{ margin: 'var(--spacing-xs) 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</h2>
                        </div>

                        <div className="review-decision-block" style={{ padding: 'var(--spacing-md)', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>The Decision</h4>
                            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{decisionText}</p>
                        </div>

                        <div className="review-sections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                            <div className="review-block">
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>People Consulted ({people.length})</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {people.length > 0 ? people.slice(0, 3).map((p, i) => <li key={i}>• {p.name}</li>) : <li>None</li>}
                                    {people.length > 3 && <li style={{ fontStyle: 'italic', opacity: 0.7 }}>+ {people.length - 3} more...</li>}
                                </ul>
                            </div>

                            <div className="review-block">
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>Documents ({documents.length})</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {documents.length > 0 ? documents.slice(0, 3).map((d, i) => <li key={i}>• {d.name}</li>) : <li>None</li>}
                                    {documents.length > 3 && <li style={{ fontStyle: 'italic', opacity: 0.7 }}>+ {documents.length - 3} more...</li>}
                                </ul>
                            </div>

                            <div className="review-block">
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>Stakeholders Impacted ({affectedParties.length})</h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {affectedParties.length > 0 ? affectedParties.slice(0, 3).map((p, i) => <li key={i}>• {p}</li>) : <li>None</li>}
                                    {affectedParties.length > 3 && <li style={{ fontStyle: 'italic', opacity: 0.7 }}>+ {affectedParties.length - 3} more...</li>}
                                </ul>
                            </div>
                        </div>

                        <div className="review-disclaimer" style={{ padding: 'var(--spacing-md)', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            <p style={{ margin: 0 }}>This will be created as a <strong>Draft</strong>. You can review all details and add specific notes before publishing it to the organization.</p>
                        </div>
                    </div>

                    <div className="step-actions">
                        <Button variant="danger" type="button" onClick={() => {
                            if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                                clearDraft();
                                onCancel();
                            }
                        }} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" isLoading={isLoading} disabled={isLoading}>
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </div>

        </form>
    );
}

function PlusIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
}
