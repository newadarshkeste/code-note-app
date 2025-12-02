'use client';

import React, { useState } from 'react';
import { useNotes } from '@/context/NotesContext';
import { getAiAssistantResponse } from '@/app/actions';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

function AiAssistantWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Sparkles className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-xl font-headline font-semibold text-foreground">AI Assistant</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Select a note and I can help you write, debug, or explain your code.
      </p>
    </div>
  );
}

export function AiAssistantPanel() {
  const { activeNote, getNoteContentUpdater } = useNotes();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !prompt.trim() || isLoading) return;

    setIsLoading(true);
    
    const updater = getNoteContentUpdater(activeNote.id);
    if (!updater) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not connect to the editor.',
      });
      setIsLoading(false);
      return;
    }

    const response = await getAiAssistantResponse(activeNote.content, prompt);

    if (response.success && response.newCode) {
      updater(response.newCode);
      toast({
        title: 'Success',
        description: 'The AI assistant has updated your note.',
      });
      setPrompt('');
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: response.error || 'Could not get a response from the AI.',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="hidden lg:flex flex-col w-[350px] min-w-[300px] max-w-[500px] border-l bg-background p-2 resize-x overflow-auto">
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-headline font-semibold">AI Assistant</h2>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 gap-4">
          {!activeNote ? (
            <AiAssistantWelcome />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col flex-grow gap-4">
                <p className="text-sm text-muted-foreground">
                    I have access to the content of <span className="font-semibold text-foreground">{activeNote.title}</span>. Ask me to explain, debug, or modify it.
                </p>
              <Textarea
                placeholder="e.g., 'Refactor this code to use async/await' or 'Explain this function to me.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-grow resize-none font-body text-sm"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !prompt.trim()}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                <span className="ml-2">Ask AI</span>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
