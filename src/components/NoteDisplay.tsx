'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNotes } from '@/context/NotesContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getHighlightedCode } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Loader2, Code, FileText } from 'lucide-react';
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
        Select a note from the sidebar to start editing, or create a new topic and note.
      </p>
    </div>
  );
}

export function NoteDisplay() {
  const { activeNote, updateNote, updateNoteContent } = useNotes();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { control, handleSubmit, reset, getValues, setValue } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: '', content: '' },
  });

  useEffect(() => {
    if (activeNote) {
      reset({
        title: activeNote.title,
        content: activeNote.content,
      });
    } else {
      reset({ title: '', content: '' });
    }
  }, [activeNote, reset]);

  const memoizedSetValue = useCallback(setValue, [setValue]);
  const memoizedGetValues = useCallback(getValues, [getValues]);
  const memoizedUpdateNote = useCallback(updateNote, [updateNote]);


  // Expose setValue to the context for the AI assistant
  useEffect(() => {
    if (activeNote) {
      const updater = (newContent: string) => {
        memoizedSetValue('content', newContent, { shouldDirty: true });
        // Also update the underlying note context immediately for a responsive feel
        memoizedUpdateNote(activeNote.id, memoizedGetValues('title'), newContent);
      };
      updateNoteContent(activeNote.id, updater);
    }
  }, [activeNote, updateNoteContent, memoizedSetValue, memoizedUpdateNote, memoizedGetValues]);

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

  if (!activeNote) {
    return (
      <main className="h-full w-full p-4">
        <Card className="h-full w-full flex items-center justify-center">
            <WelcomeScreen />
        </Card>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col p-2 md:p-4">
      <form onSubmit={handleSubmit(onSave)} className="flex flex-col flex-grow h-full">
        <Tabs defaultValue="edit" className="flex-grow flex flex-col h-full">
          <Card className="flex-grow flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Note Title"
                      className="text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-2xl h-auto p-0"
                    />
                  )}
                />
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="edit"><FileText className="w-4 h-4 mr-2"/>Edit</TabsTrigger>
                  <TabsTrigger value="preview"><Code className="w-4 h-4 mr-2"/>Preview</TabsTrigger>
                </TabsList>
                <Button type="submit" disabled={isSaving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                  <span className="ml-2 hidden md:inline">Save</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-0">
                <TabsContent value="edit" className="flex-grow mt-0">
                    <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <Textarea
                        {...field}
                        spellCheck="false"
                        placeholder="Write your code or notes here..."
                        className="h-full w-full resize-none border-0 rounded-none font-code text-base focus-visible:ring-0 p-6"
                        />
                    )}
                    />
                </TabsContent>
                <TabsContent value="preview" className="flex-grow mt-0">
                    <ScrollArea className="h-full w-full">
                    <div
                        className="prose dark:prose-invert max-w-none p-6 font-code [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-md"
                        dangerouslySetInnerHTML={{
                        __html: activeNote.highlightedContent || `<pre><code>${activeNote.content}</code></pre>`,
                        }}
                    />
                    </ScrollArea>
                </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </form>
    </main>
  );
}
