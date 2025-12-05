
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '@/context/NotesContext';
import { getAiAssistantResponse } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, User, Bot, Paperclip, XCircle, File as FileIcon, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { CodeEditor } from './CodeEditor';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Attachment {
  name: string;
  type: string;
  dataUri: string;
}

function AiAssistantWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <Sparkles className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h2 className="text-xl font-headline font-semibold text-foreground">AI Assistant</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        I can help you write, debug, or explain your code. You can also ask me general questions.
      </p>
    </div>
  );
}

const MessageContent = React.memo(({ content }: { content: string }) => {
    const parts = content.split(/(\`\`\`[\w\s-]*\n[\s\S]*?\n\`\`\`)/g);

    return (
        <div className="ai-assistant-output">
            {parts.map((part, index) => {
                const codeBlockMatch = part.match(/\`\`\`(\w*)\n([\s\S]*?)\n\`\`\`/);
                if (codeBlockMatch) {
                    const language = codeBlockMatch[1] || 'plaintext';
                    const code = codeBlockMatch[2];
                    return (
                        <div key={index} className="my-3 rounded-md border bg-background overflow-hidden">
                            <div className="h-48">
                                <CodeEditor
                                    value={code}
                                    language={language}
                                    options={{ readOnly: true, domReadOnly: true, minimap: { enabled: false } }}
                                />
                            </div>
                        </div>
                    );
                }
                
                const paragraphs = part.split('\n').filter(p => p.trim() !== '').map((p, i) => `<p>${p.replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`).join('');
                return <div key={index} dangerouslySetInnerHTML={{ __html: paragraphs }} />;
            })}
        </div>
    );
});
MessageContent.displayName = 'MessageContent';


export function AiAssistantPanel() {
  const { activeNote, dirtyNoteContent } = useNotes();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
    setMessages([]);
    setAttachment(null);
  }, [activeNote?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setAttachment({
          name: file.name,
          type: file.type,
          dataUri: loadEvent.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && !attachment) || isLoading) return;

    const userMessageContent = prompt.trim() + (attachment ? `\n\n[Attached: ${attachment.name}]` : '');
    const userMessage: ChatMessage = { role: 'user', content: userMessageContent };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    const currentCode = activeNote && dirtyNoteContent ? dirtyNoteContent.content : '';

    const response = await getAiAssistantResponse(currentCode, prompt, attachment?.dataUri);

    setAttachment(null);

    if (response.success && response.answer) {
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Assistant Error',
        description: response.error || 'Could not get a response from the AI.',
      });
      setMessages(prev => prev.slice(0, -1));
    }

    setIsLoading(false);
  };
  
  return (
    <div className="h-full flex flex-col bg-card/50 min-h-0 overflow-hidden">
      <header className="flex-shrink-0 p-4 flex items-center gap-2 border-b h-[65px]">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-headline font-semibold">AI Assistant</h2>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col h-full min-h-0">
            <ScrollArea className="flex-grow min-h-0" ref={scrollAreaRef}>
              <div className="px-4 py-6 space-y-6">
                  {messages.length === 0 && (
                     <>
                        {activeNote ? (
                             <p className="text-sm text-muted-foreground">
                                I have access to <span className="font-semibold text-foreground">{activeNote.title}</span>. Ask me to explain, debug, or modify it. You can also ask general questions.
                             </p>
                        ) : (
                            <AiAssistantWelcome />
                        )}
                     </>
                  )}
                  {messages.map((message, index) => (
                    <div key={index} className={cn('flex items-start gap-3 w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                      {message.role === 'assistant' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1.5" />}
                      <div className={cn(
                        'rounded-lg p-3 text-sm max-w-[90%] w-auto text-foreground', 
                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <div className="ai-output">
                          <MessageContent content={message.content} />
                        </div>
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
                    {attachment && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border text-sm">
                        {attachment.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate flex-1">{attachment.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setAttachment(null)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="relative flex items-center">
                        <Textarea
                            placeholder="e.g., 'Explain this function...'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="resize-none font-body text-sm pr-10"
                            disabled={isLoading}
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                         />
                         <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || !!attachment}
                          >
                           <Paperclip className="h-4 w-4"/>
                         </Button>
                    </div>
                    <Button type="submit" disabled={isLoading || (!prompt.trim() && !attachment)}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        <span className="ml-2">Ask AI</span>
                    </Button>
                </form>
            </div>
          </div>
      </div>
    </div>
  );
}
