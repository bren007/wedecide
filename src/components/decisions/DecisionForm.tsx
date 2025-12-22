import React, { useState, useRef } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { X, UserPlus, Link as LinkIcon, Check, ChevronDown, Share2 } from 'lucide-react';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import './DecisionForm.css';

export interface DecisionFormData {
    title: string;
    decision: string;
    description: string;
    decision_type: 'approve' | 'note';
    initialPeople?: { userId: string; name: string; email: string }[];
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
    const { users } = useOrganizationUsers();

    // Step state: 1: Identity, 2: Type, 3: Evidence, 4: Consultation, 5: Impact, 6: Review
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Core Fields
    const [title, setTitle] = useState(initialData?.title || '');
    const [decisionText, setDecisionText] = useState(initialData?.decision || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [decisionType, setDecisionType] = useState<'approve' | 'note'>(initialData?.decision_type || 'approve');

    // List Fields
    const [people, setPeople] = useState<{ userId: string; name: string; email: string }[]>(initialData?.initialPeople || []);
    const [documents, setDocuments] = useState<{ name: string; url: string; type: string }[]>(initialData?.initialDocuments || []);
    const [affectedParties, setAffectedParties] = useState<string[]>(initialData?.affectedParties || []);

    // Temp state for adding items
    const [selectedUserId, setSelectedUserId] = useState('');
    const [tempDocName, setTempDocName] = useState('');
    const [tempDocUrl, setTempDocUrl] = useState('');
    const [tempPartyName, setTempPartyName] = useState('');

    const formRef = useRef<HTMLFormElement>(null);

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
    };

    const addPerson = () => {
        if (!selectedUserId) return;
        const userToAdd = users.find(u => u.id === selectedUserId);
        if (userToAdd && !people.some(p => p.userId === selectedUserId)) {
            setPeople([...people, { userId: userToAdd.id, name: userToAdd.name, email: userToAdd.email }]);
            setSelectedUserId('');
        }
    };

    const addDocument = () => {
        if (!tempDocName || !tempDocUrl) return;
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
        <form onSubmit={handleSubmit} className="vertical-wizard-form" ref={formRef}>
            {externalError && <div className="decision-error-message">{externalError}</div>}

            {/* Step 1: Decision Details */}
            <div className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${completedSteps.includes(1) ? 'completed' : ''}`}>
                {renderStepHeader(1, "Name & Context", title || "Untitled Decision", 1)}
                <div className="step-content">
                    <p className="step-description">Provide the core details for this decision. This will be used to build your agenda later.</p>

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
                        <p className="field-explainer">The name used to identify this item in lists and agendas.</p>
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
                        <p className="field-explainer">The specific motion, action, or record that needs agreement.</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Decision Type</label>
                        <p className="field-explainer" style={{ marginBottom: '0.5rem' }}>Is this something that needs a vote/agreement, or just a record for awareness?</p>
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
                        <label htmlFor="description" className="form-label">Background & Rationale</label>
                        <textarea
                            id="description"
                            className="form-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Provide context, why is this decision needed now? What are the key points?"
                            rows={4}
                            disabled={isLoading}
                        />
                        <p className="field-explainer">Supporting information that helps others understand the context.</p>
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

            {/* Original Step 2 (Decision Type) is now merged into Step 1. 
                Keep numbering internal but skip step 2 for UI. */}

            {/* Step 3: Supporting Evidence */}
            <div className={`wizard-step ${currentStep === 3 ? 'active' : ''} ${completedSteps.includes(3) ? 'completed' : ''} ${completedSteps.includes(1) ? '' : 'disabled'}`}>
                {renderStepHeader(3, "Supporting Documents", `${documents.length} document(s) added`, 2)}
                <div className="step-content">
                    <p className="step-description">Link to any Google Docs, PDFs, or websites that provide context for this decision.</p>

                    <div className="wizard-list">
                        {documents.map((d, i) => (
                            <div key={i} className="wizard-list-item">
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
                                onChange={(e) => setTempDocUrl(e.target.value)}
                            />
                            <Button type="button" variant="ghost" onClick={addDocument} disabled={!tempDocName || !tempDocUrl}>
                                <PlusIcon />
                            </Button>
                        </div>
                    </div>

                    <div className="step-actions">
                        <Button type="button" variant="primary" onClick={() => (setCompletedSteps([...completedSteps, 2]), completeStep(3))}>
                            Next: People Involved
                        </Button>
                    </div>
                </div>
            </div>

            {/* Step 4: People Involved */}
            <div className={`wizard-step ${currentStep === 4 ? 'active' : ''} ${completedSteps.includes(4) ? 'completed' : ''} ${completedSteps.includes(3) ? '' : 'disabled'}`}>
                {renderStepHeader(4, "People Involved", `${people.length} person(s) consulted`, 3)}
                <div className="step-content">
                    <p className="step-description">Who was consulted or involved in preparing this decision?</p>

                    <div className="wizard-list">
                        {people.map((p) => (
                            <div key={p.userId} className="wizard-list-item">
                                <UserPlus size={14} />
                                <span>{p.name}</span>
                                <button type="button" onClick={() => setPeople(people.filter(x => x.userId !== p.userId))}>
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

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

                    <div className="step-actions">
                        <Button type="button" variant="primary" onClick={() => completeStep(4)}>
                            Next: Impact
                        </Button>
                    </div>
                </div>
            </div>

            {/* Step 5: Impact / Affected Parties */}
            <div className={`wizard-step ${currentStep === 5 ? 'active' : ''} ${completedSteps.includes(5) ? 'completed' : ''} ${completedSteps.includes(4) ? '' : 'disabled'}`}>
                {renderStepHeader(5, "Affected Parties", `${affectedParties.length} groups/entities affected`, 4)}
                <div className="step-content">
                    <p className="step-description">Which groups, teams, or organizations are affected by this decision?</p>

                    <div className="wizard-list">
                        {affectedParties.map((party, i) => (
                            <div key={i} className="wizard-list-item">
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
                        <Button type="button" variant="primary" onClick={() => completeStep(5)}>
                            Final Review
                        </Button>
                    </div>
                </div>
            </div>

            {/* Step 6: Final Review & Submit */}
            <div className={`wizard-step ${currentStep === 6 ? 'active' : ''} ${completedSteps.includes(6) ? 'completed' : ''} ${completedSteps.includes(5) ? '' : 'disabled'}`}>
                {renderStepHeader(6, "Review & Launch", "Ready to publish", 5)}
                <div className="step-content">
                    <div className="review-summary-card">
                        <p>You are about to create a decision named: <strong>"{title}"</strong>.</p>
                        <ul className="review-stats">
                            <li>{documents.length} Supporting Documents</li>
                            <li>{people.length} {people.length === 1 ? 'Person' : 'People'} Consulted</li>
                            <li>{affectedParties.length} Affected {affectedParties.length === 1 ? 'Party' : 'Parties'} listed</li>
                        </ul>
                    </div>

                    <div className="step-actions">
                        <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
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
