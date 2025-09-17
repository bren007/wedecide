
'use client';

import { useTransition, useState } from 'react';
import { analyzeDocument } from '@/app/submit/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, Lightbulb, Sparkles, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AnalyzeDecisionDocumentOutput } from '@/ai/flows/analyze-decision-document';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

function DocumentAnalysisResult({ assessment, onUseSuggestions }: { assessment: AnalyzeDecisionDocumentOutput, onUseSuggestions: () => void }) {
    if (!assessment) return null;

    return (
        <div className="space-y-4 pt-4">
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                        <Lightbulb />
                        Initial Feedback
                    </CardTitle>
                    <CardDescription className="text-blue-800 dark:text-blue-300">
                        The AI has analyzed your document (identified as a **{assessment.documentType}**) and provided some initial points to consider for strengthening your proposal. Review the suggested content improvements below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-200">
                        {assessment.preVettingAssessment.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            
            <Accordion type="multiple" defaultValue={['title', 'decisionSought', 'background']} className="w-full">
                <AccordionItem value="title">
                    <AccordionTrigger>Suggested Title</AccordionTrigger>
                    <AccordionContent>{assessment.suggestedTitle}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="decisionSought">
                    <AccordionTrigger>Suggested Decision Sought</AccordionTrigger>
                    <AccordionContent>{assessment.suggestedDecisionSought}</AccordionContent>
                </AccordionItem>
                <AccordionItem value="background">
                    <AccordionTrigger>Suggested Background</AccordionTrigger>
                    <AccordionContent className="whitespace-pre-wrap">{assessment.suggestedBackground}</AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <Button onClick={onUseSuggestions}>
                <Copy className="mr-2 h-4 w-4" />
                Use these suggestions
            </Button>
        </div>
    )
}

export function IntelligentIngestion() {
  const { toast } = useToast();
  const [isAnalyzing, startAnalysisTransition] = useTransition();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeDecisionDocumentOutput | null>(null);

  const handleAnalyzeDocument = () => {
    startAnalysisTransition(async () => {
      setAnalysisResult(null);
      try {
        const result = await analyzeDocument();
        setAnalysisResult(result);
        toast({
            title: "Analysis Complete",
            description: `The document has been analyzed and suggestions have been generated.`
        });
      } catch (error) {
        console.error('Failed to analyze document:', error);
        toast({
          title: 'Error Analyzing Document',
          description: 'Could not analyze the document. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };
  
   const handleUseSuggestions = () => {
    if (analysisResult) {
      // This is a simplified way to pass data to the parent form.
      // In a more complex app, you might use a shared state manager (like Zustand or Context).
      document.dispatchEvent(new CustomEvent('useAiSuggestions', { detail: analysisResult }));
      toast({
          title: "Content Applied",
          description: "AI suggestions have been populated into the form."
      });
    }
  };

  return (
    <div className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">
          Have a pre-written document, business case, or policy paper? Let AI analyze it, provide feedback, and suggest improvements. This can be an iterative process before you fill out the final submission form.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={handleAnalyzeDocument} disabled={isAnalyzing}>
          {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Analyze Document (Simulated Upload)
        </Button>
        {isAnalyzing && (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-1/T hird" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {analysisResult && <DocumentAnalysisResult assessment={analysisResult} onUseSuggestions={handleUseSuggestions} />}
    </div>
  );
}
