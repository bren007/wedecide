
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateMeetingSummary } from '@/ai/flows/generate-meeting-summary';
import { generateSummaryFromAudio } from '@/app/meeting/actions';
import { Loader2, Sparkles, Clipboard, CheckCircle, Mic, UserCheck, StopCircle, MicOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Decision } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Textarea } from './ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';

export function MeetingSummary({ decisions }: { decisions: Decision[] }) {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isChathamHouse, setIsChathamHouse] = useState(false);


  useEffect(() => {
    async function getPermission() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    }
    getPermission();
  }, []);

  const startRecording = async () => {
    if (hasPermission === false) {
      toast({
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings to record audio.',
        variant: 'destructive',
      });
      return;
    }
    
    setSummary('');
    setIsApproved(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const result = await generateSummaryFromAudio(base64Audio, isChathamHouse);
            const formattedSummary = `## Discussion Summary\n${result.discussionSummary}\n\n## Decisions Agreed\n${result.decisionsAgreed}\n\n## Action Items\n${result.actionItems}`;
            setSummary(formattedSummary);
          } catch (error) {
            console.error('Failed to generate summary from audio:', error);
            toast({
              title: 'Error',
              description: 'Could not generate summary from the recording. Please try again.',
              variant: 'destructive',
            });
          } finally {
             setIsProcessing(false);
          }
        };
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
       console.error('Error starting recording:', error);
       toast({
        title: 'Recording Error',
        description: 'Could not start recording. Please ensure your microphone is connected and permissions are allowed.',
        variant: 'destructive',
       })
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setSummary('');
    setIsApproved(false);
    try {
      const result = await generateMeetingSummary({ decisions });
      setSummary(result.summary);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast({
        title: 'Error',
        description: 'Could not generate summary. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
        title: "Copied to Clipboard",
        description: "The meeting summary has been copied.",
    })
  }
  
  const handleApprove = () => {
    setIsApproved(true);
    toast({
        title: "Summary Approved",
        description: "The meeting summary has been approved and circulated.",
        variant: 'default'
    });
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Meeting Minutes</CardTitle>
        <CardDescription>
            Use speech-to-text to record the meeting, then generate structured minutes. The secretariat can edit the draft before the chair gives final approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPermission === false && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
              To record audio, please grant microphone permissions in your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                    variant="outline" 
                    onClick={handleRecordClick}
                    disabled={hasPermission === null || isProcessing}
                    className="w-full sm:w-auto"
                >
                {isRecording ? <StopCircle className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecording ? 'Stop Recording' : 'Record Meeting'}
                </Button>
                <Button onClick={handleGenerateSummary} disabled={isLoading || decisions.length === 0} className="w-full sm:w-auto">
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate from Decision Data
                </Button>
            </div>
             <div className="flex items-center space-x-2">
                <Switch id="chatham-house" checked={isChathamHouse} onCheckedChange={setIsChathamHouse} />
                <Label htmlFor="chatham-house" className="text-sm">Chatham House Rules</Label>
            </div>
        </div>

        {(isLoading || isProcessing) && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isProcessing ? 'Processing audio and generating summary...' : 'Generating summary from decision data...'}</span>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            <div className="relative">
                <Label htmlFor="meeting-minutes-textarea" className="text-sm font-medium">Editable Minutes Draft</Label>
                <Textarea
                id="meeting-minutes-textarea"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="pr-10 h-48 mt-2"
                aria-label="Meeting Summary"
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-8 right-2 h-7 w-7"
                    onClick={handleCopyToClipboard}
                >
                    <Clipboard className="h-4 w-4" />
                    <span className="sr-only">Copy to clipboard</span>
                </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                    onClick={handleApprove}
                    disabled={!summary || isApproved}
                    className="w-full sm:w-auto"
                    variant="default"
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isApproved ? 'Approved & Circulated' : 'Approve Minutes'}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCheck className="h-4 w-4" />
                    <span>Chair action only</span>
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
