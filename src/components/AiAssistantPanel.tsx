'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '@/context/NotesContext';
import { getAiAssistantResponse } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './ui/card';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom whenever messages change or loading state changes
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'smooth',
            });
        }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    // Clear messages when the active note changes
    setMessages([]);
  }, [activeNote]);

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
    <div className="h-full flex flex-col bg-card/50">
      <header className="flex-shrink-0 p-4 flex items-center gap-2 border-b h-[65px]">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-headline font-semibold">AI Assistant</h2>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {!activeNote ? (
          <AiAssistantWelcome />
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <ScrollArea className="flex-grow" ref={scrollAreaRef}>
              <div className="px-4 py-6 space-y-6">
                {messages.length === 0 && (
                   <p className="text-sm text-muted-foreground">
                      I have access to <span className="font-semibold text-foreground">{activeNote.title}</span>. Ask me to explain, debug, or modify it.
                   </p>
                )}
                {messages.map((message, index) => (
                  <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1.5" />}
                    <div className={cn(
                      'rounded-lg p-3 text-sm max-w-[85%]', 
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-pre:bg-background/50 prose-pre:p-2" 
                        dangerouslySetInnerHTML={{ __html: message.content }} 
                      />
                    </div>
                     {message.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
                {isLoading && (
                   <div className="flex items-start gap-3">
                      <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1.5" />
                      <div className="rounded-lg p-3 text-sm bg-muted">
                          <Loader2 className="animate-spin h-5 w-5" />
                      </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-card/50 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <Textarea
                    placeholder="e.g., 'Explain this function...'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="resize-none font-body text-sm"
                    disabled={isLoading}
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    />
                    <Button type="submit" disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2">Ask AI</span>
                    </Button>
                </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
