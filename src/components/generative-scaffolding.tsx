
'use client';

import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateScaffold } from '@/app/submit/actions';
import type { GenerateDocumentScaffoldInput, GenerateDocumentScaffoldOutput } from '@/ai/flows/generate-document-scaffold';
import { Loader2, Wand2, Clipboard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';

const documentTypes: GenerateDocumentScaffoldInput['documentType'][] = [
    'Business Case',
    'Policy Paper',
    'Project Proposal',
    'Report',
];

export function GenerativeScaffolding() {
  const { toast } = useToast();
  const [isGenerating, startGenerationTransition] = useTransition();
  const [formState, setFormState] = useState<Partial<GenerateDocumentScaffoldInput>>({
      documentType: 'Business Case',
  });
  const [result, setResult] = useState<GenerateDocumentScaffoldOutput | null>(null);

  const handleGenerate = () => {
    if (!formState.proposalTitle || !formState.coreIdea || !formState.documentType) {
        toast({
            title: 'Missing Information',
            description: 'Please provide a title, core idea, and document type.',
            variant: 'destructive',
        });
        return;
    }
    startGenerationTransition(async () => {
        setResult(null);
        try {
            const output = await generateScaffold(formState as GenerateDocumentScaffoldInput);
            setResult(output);
            toast({
                title: 'Draft Generated',
                description: 'The AI has generated a draft document for you to review.',
            });
        } catch (error) {
            console.error('Failed to generate scaffold:', error);
            toast({
                title: 'Generation Failed',
                description: 'The AI could not generate a draft. Please try again.',
                variant: 'destructive',
            });
        }
    });
  };
  
  const handleCopyToClipboard = () => {
    if (result?.draftDocument) {
      navigator.clipboard.writeText(result.draftDocument);
      toast({
        title: "Copied to Clipboard",
        description: "The draft document has been copied.",
      });
    }
  };

  return (
    <div className="space-y-6 pt-4">
        <div className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="scaffold-doc-type">Document Type</Label>
                <Select 
                    value={formState.documentType} 
                    onValueChange={(value) => setFormState(prev => ({ ...prev, documentType: value as any}))}
                >
                    <SelectTrigger id="scaffold-doc-type">
                        <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {documentTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="scaffold-title">Proposal Title</Label>
                <Input 
                    id="scaffold-title" 
                    placeholder="e.g., National Digital Identity Platform"
                    value={formState.proposalTitle || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, proposalTitle: e.target.value }))}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="scaffold-idea">Core Idea</Label>
                <Textarea 
                    id="scaffold-idea"
                    placeholder="In one or two sentences, describe the core problem or proposal. e.g., Create a secure way for citizens to access government services online to reduce fraud and improve user experience." 
                    value={formState.coreIdea || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, coreIdea: e.target.value }))}
                    rows={3}
                />
            </div>
        </div>
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Draft
        </Button>

        {isGenerating && (
            <div className="space-y-4 pt-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-40 w-full" />
            </div>
        )}

        {result && (
            <div className="space-y-2 pt-4">
                 <div className="flex justify-between items-center">
                    <Label htmlFor="draft-output">Generated Draft</Label>
                    <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}>
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy
                    </Button>
                </div>
                <Textarea 
                    id="draft-output"
                    value={result.draftDocument}
                    readOnly
                    rows={15}
                    className="bg-muted/50 font-mono text-xs"
                />
            </div>
        )}
    </div>
  );
}
