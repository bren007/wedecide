import { useState } from 'react';
import {
    FileText,
    FileSpreadsheet,
    Link as LinkIcon,
    File as FileIcon,
    Plus,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { Button } from '../Button';
import { LoadingSpinner } from '../Loading';
import './DocumentManager.css';

interface DocumentManagerProps {
    decisionId: string;
    isOwner: boolean;
}

const DOC_TYPES = [
    { value: 'google_docs', label: 'Google Doc', icon: FileText },
    { value: 'google_sheets', label: 'Google Sheet', icon: FileSpreadsheet },
    { value: 'm365_word', label: 'Word Document', icon: FileText },
    { value: 'm365_excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet },
    { value: 'pdf', label: 'PDF Document', icon: FileIcon },
    { value: 'url', label: 'Web Link', icon: LinkIcon },
];

export function DocumentManager({ decisionId, isOwner }: DocumentManagerProps) {
    const { documents, loading, addDocument, deleteDocument } = useDocuments(decisionId);

    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [type, setType] = useState('url');

    // Auto-detect type based on URL
    function handleUrlChange(newUrl: string) {
        setUrl(newUrl);
        if (newUrl.includes('docs.google.com/document')) setType('google_docs');
        else if (newUrl.includes('docs.google.com/spreadsheets')) setType('google_sheets');
        else if (newUrl.endsWith('.pdf')) setType('pdf');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name || !url) return;

        setSubmitting(true);
        try {
            await addDocument(name, url, type);
            // Reset form
            setName('');
            setUrl('');
            setType('url');
            setIsAdding(false);
        } catch (err) {
            console.error('Failed to add document:', err);
        } finally {
            setSubmitting(false);
        }
    }

    function getIcon(type: string) {
        const docType = DOC_TYPES.find(t => t.value === type);
        const Icon = docType ? docType.icon : FileIcon;
        return <Icon size={20} />;
    }

    function getLabel(type: string) {
        const docType = DOC_TYPES.find(t => t.value === type);
        return docType ? docType.label : 'Document';
    }

    if (loading) return <LoadingSpinner />;

    return (
        <div className="document-manager">
            <div className="document-header">
                <h3 className="document-title">Documents</h3>
                {isOwner && !isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="add-btn"
                    >
                        <Plus size={16} />
                        Add Resource
                    </button>
                )}
            </div>

            <div className="document-list">
                {documents.length === 0 && !isAdding ? (
                    <p className="empty-state">No documents attached yet.</p>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="document-item">
                            <div className="document-info">
                                <div className="document-icon">
                                    {getIcon(doc.type)}
                                </div>
                                <div className="document-details">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="document-name"
                                    >
                                        {doc.name}
                                        <ExternalLink size={12} />
                                    </a>
                                    <span className="document-meta">
                                        {getLabel(doc.type)}
                                    </span>
                                </div>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => deleteDocument(doc.id)}
                                    className="remove-btn"
                                    title="Remove Document"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="add-document-form">
                    <div className="doc-form-group">
                        <label className="doc-form-label">Resource Name</label>
                        <input
                            type="text"
                            className="doc-form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Q4 Financial Report"
                            required
                        />
                    </div>

                    <div className="doc-form-group">
                        <label className="doc-form-label">Link (URL)</label>
                        <input
                            type="url"
                            className="doc-form-input"
                            value={url}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://..."
                            required
                        />
                    </div>

                    <div className="doc-form-group">
                        <label className="doc-form-label">Type</label>
                        <select
                            className="doc-form-select"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            {DOC_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="doc-form-actions">
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setIsAdding(false)}
                            disabled={submitting}
                            className="btn--sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            disabled={submitting || !name || !url}
                            className="btn--sm"
                        >
                            {submitting ? 'Adding...' : 'Add Resource'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}
