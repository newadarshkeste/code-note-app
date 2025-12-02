'use client';

import React, { useState } from 'react';
import { useNotes } from '@/context/NotesContext';
import { getAiAssistantResponse } from '@/app/actions';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  const { activeNote } = useNotes();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    const response = await getAiAssistantResponse(activeNote.content, prompt);

    if (response.success && response.answer) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: response.error || 'Could not get a response from the AI.',
      });
      // Remove the user message if the API call failed
      setMessages(prev => prev.slice(0, -1));
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
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-grow mb-4 pr-4 -mr-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                     <p className="text-sm text-muted-foreground">
                        I have access to <span className="font-semibold text-foreground">{activeNote.title}</span>. Ask me to explain, debug, or modify it.
                     </p>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                      <div className={`rounded-lg p-3 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.content }} />
                      </div>
                       {message.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    </div>
                  ))}
                  {isLoading && (
                     <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="rounded-lg p-3 text-sm bg-muted">
                            <Loader2 className="animate-spin" />
                        </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <Textarea
                  placeholder="e.g., 'Explain this function to me.'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="resize-none font-body text-sm"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                  }}
                />
                <Button type="submit" disabled={isLoading || !prompt.trim()}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="ml-2">Ask AI</span>
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
