'use client';

import React, { useState, useEffect } from 'react';
import { useNotes } from '@/context/NotesContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getHighlightedCode } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Code, FileText, PanelLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string(),
});

export type NoteFormData = z.infer<typeof noteSchema>;

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Code className="w-24 h-24 text-muted-foreground/50 mb-4" />
      <h2 className="text-2xl font-headline font-semibold text-foreground">Welcome to CodeNote</h2>
      <p className="mt-2 text-muted-foreground">
        Select a note from the list to start editing, or create a new topic and note.
      </p>
    </div>
  );
}

export function NoteDisplay() {
  const { activeNote, updateNote } = useNotes();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const { toast } = useToast();

  const { control, handleSubmit, reset, watch } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', content: '' },
  });
  
  const watchedContent = watch('content');
  const watchedTitle = watch('title');

  useEffect(() => {
    if (activeNote) {
      reset({
        title: activeNote.title,
        content: activeNote.content,
      });
      setActiveTab('edit');
    } else {
      reset({ title: '', content: '' });
    }
  }, [activeNote, reset]);

  const onSave = async (data: NoteFormData) => {
    if (!activeNote) return;
    setIsSaving(true);
    try {
      const { highlightedCode, language } = await getHighlightedCode(data.content);
      updateNote(activeNote.id, data.title, data.content, highlightedCode, language);
      toast({
        title: 'Note Saved',
        description: `"${data.title}" has been updated.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Note',
        description: 'Could not save the note. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!activeNote) return;
    try {
      const { highlightedCode, language } = await getHighlightedCode(watchedContent);
      updateNote(activeNote.id, watchedTitle, watchedContent, highlightedCode, language);
    } catch (error) {
      console.error("Failed to update highlight on preview", error);
    }
  }

  if (!activeNote) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-background/80">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
       <Tabs value={activeTab} onValueChange={(value) => {
          if (value === 'preview') handlePreview();
          setActiveTab(value);
        }} className="flex flex-col flex-grow min-h-0">
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col flex-grow min-h-0">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b h-[65px] bg-background">
            <div className="flex items-center flex-grow min-w-0">
                <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                    <Input
                        {...field}
                        placeholder="Note Title"
                        className="text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-xl h-auto p-0 bg-transparent truncate"
                    />
                    )}
                />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <TabsList>
                <TabsTrigger value="edit"><FileText className="w-4 h-4 mr-2"/>Edit</TabsTrigger>
                <TabsTrigger value="preview"><Code className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
                </TabsList>
                <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2 hidden md:inline">Save</span>
                </Button>
            </div>
            </header>

            <div className="flex-grow relative min-h-0">
                <TabsContent value="edit" className="h-full w-full absolute inset-0 mt-0 focus-visible:ring-0">
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                spellCheck="false"
                                placeholder="Write your code or notes here..."
                                className="h-full w-full resize-none border-0 rounded-none font-code text-base focus-visible:ring-0 p-6 bg-transparent"
                            />
                        )}
                    />
                </TabsContent>
                <TabsContent value="preview" className="h-full w-full absolute inset-0 mt-0 focus-visible:ring-0">
                    <ScrollArea className="h-full w-full">
                        <div
                            className="prose dark:prose-invert max-w-none p-6 font-code [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-md"
                            dangerouslySetInnerHTML={{
                            __html: activeNote.highlightedContent || `<pre><code>${activeNote.content}</code></pre>`,
                            }}
                        />
                    </ScrollArea>
                </TabsContent>
            </div>
        </form>
       </Tabs>
    </div>
  );
}
