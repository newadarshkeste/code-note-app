'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getPracticeModeFeedback } from '@/app/actions';
import { useNotes } from '@/context/NotesContext';
import { useToast } from '@/hooks/use-toast';
import type { PracticeModeOutput } from '@/ai/flows/ai-assistant-flow';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { Loader2, Sparkles, Trophy, ListChecks, Lightbulb, Repeat, Columns, Dumbbell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const DiffEditor = dynamic(() => import('@monaco-editor/react').then(mod => mod.DiffEditor), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

type View = 'practice' | 'feedback' | 'diff';

interface PracticeModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCode: string;
  language: string;
  noteId: string;
}

const FeedbackSection = ({ icon: Icon, title, items, variant }: { icon: React.ElementType, title: string, items: string[], variant: 'destructive' | 'default' | 'constructive' }) => {
  if (items.length === 0) return null;

  const colors = {
    destructive: 'border-red-500/50 text-red-500',
    default: 'border-blue-500/50 text-blue-500',
    constructive: 'border-green-500/50 text-green-500'
  }

  return (
    <div>
      <h3 className={`flex items-center gap-2 font-semibold text-lg mb-2 ${colors[variant]}`}>
        <Icon className="h-5 w-5" />
        {title}
      </h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/90">
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  )
}

const cleanCodeForDiff = (code: string): string => {
  if (!code) return "";
  // More aggressive cleaning for diffing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = code.replace(/<br\s*\/?>/gi, '\n');
  return tempDiv.textContent || tempDiv.innerText || '';
};

export function PracticeModeModal({ isOpen, onClose, originalCode, language, noteId }: PracticeModeModalProps) {
  const [userAttempt, setUserAttempt] = useState('');
  const [view, setView] = useState<View>('practice');
  const [feedback, setFeedback] = useState<PracticeModeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { studyStats } = useNotes();

  useEffect(() => {
    // Reset state when modal opens for a new session
    if (isOpen) {
      setUserAttempt('');
      setView('practice');
      setFeedback(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setFeedback(null);

    const response = await getPracticeModeFeedback(originalCode, userAttempt);
    if (response.success && response.feedback) {
      setFeedback(response.feedback);
      setView('feedback');
      if (studyStats && studyStats.practiceSession) {
        studyStats.practiceSession.recordPracticeSession(noteId, response.feedback.score);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Evaluation Error',
        description: response.error || 'Could not get feedback from the AI.',
      });
    }
    setIsLoading(false);
  };
  
  const cleanedOriginalCode = useMemo(() => cleanCodeForDiff(originalCode), [originalCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-headline flex items-center gap-3">
             <Dumbbell className="h-6 w-6 text-primary" /> Practice Mode
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow min-h-0 px-6 pb-6 flex flex-col gap-4">
          {view === 'practice' && (
            <div className="flex-grow min-h-0 border rounded-md overflow-hidden">
                <CodeEditor
                    value={userAttempt}
                    onChange={(value) => setUserAttempt(value || '')}
                    language={language}
                    options={{ minimap: { enabled: true } }}
                />
            </div>
          )}

          {view === 'feedback' && feedback && (
             <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                    <div className="flex items-center gap-6">
                       <div className="text-center">
                            <p className="text-5xl font-bold text-primary">{feedback.score}</p>
                            <p className="text-sm text-muted-foreground">/ 100</p>
                       </div>
                       <div className="flex-grow">
                            <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                AI Evaluation
                            </h3>
                            <p className="text-sm text-foreground/90">{feedback.evaluation}</p>
                       </div>
                    </div>
                    
                    <FeedbackSection icon={ListChecks} title="Mistakes" items={feedback.mistakes} variant="destructive" />
                    <FeedbackSection icon={Lightbulb} title="Suggestions" items={feedback.suggestions} variant="constructive" />

                    {feedback.score === 100 && (
                        <Alert className="border-green-500/50 text-green-600">
                            <Trophy className="h-4 w-4 !text-green-500" />
                            <AlertTitle>Excellent Work!</AlertTitle>
                            <AlertDescription>
                                You've perfectly recreated the code. Great job!
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </ScrollArea>
          )}

          {view === 'diff' && (
             <div className="flex-grow min-h-0 border rounded-md overflow-hidden">
                <DiffEditor
                    height="100%"
                    language={language}
                    original={cleanedOriginalCode}
                    modified={userAttempt}
                    theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
                    options={{
                        readOnly: true,
                        renderSideBySide: true,
                        minimap: { enabled: false }
                    }}
                />
            </div>
          )}

        </div>

        <DialogFooter className="p-6 pt-2 border-t bg-background/80 flex-shrink-0">
          <div className="flex w-full justify-between items-center">
            <div>
              {view !== 'practice' && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setView('practice')}>
                        <Repeat className="h-4 w-4 mr-2"/> Try Again
                    </Button>
                    <Button variant="secondary" onClick={() => setView(view === 'diff' ? 'feedback' : 'diff')}>
                        <Columns className="h-4 w-4 mr-2"/> {view === 'diff' ? 'Show Feedback' : 'Show Differences'}
                    </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost">
                    {view === 'practice' ? 'Cancel' : 'Close'}
                </Button>
              </DialogClose>
              {view === 'practice' && (
                <Button onClick={handleSubmit} disabled={isLoading || !userAttempt}>
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2"/> : <Sparkles className="h-4 w-4 mr-2" />}
                  Check My Attempt
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
