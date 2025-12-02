'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNotes } from '@/context/NotesContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Code, Type, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/CodeEditor';
import { Skeleton } from './ui/skeleton';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});


function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-24 h-24 text-muted-foreground/50 mb-4" />
      <h2 className="text-2xl font-headline font-semibold text-foreground">Welcome to CodeNote</h2>
      <p className="mt-2 text-muted-foreground">
        Select a note from the list to start editing, or create a new topic and note.
      </p>
    </div>
  );
}

export function NoteDisplay() {
  const { activeNote, updateNote, isDirty, setIsDirty, isSaving } = useNotes();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setIsDirty(false);
    } else {
      setTitle('');
      setContent('');
    }
  }, [activeNote, setIsDirty]);

  // Debounce saving
  useEffect(() => {
    if (!isDirty || !activeNote) return;

    const handler = setTimeout(() => {
      handleSave();
    }, 1500); // Auto-save after 1.5 seconds of inactivity

    return () => {
      clearTimeout(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, isDirty]);


  const handleContentChange = (newContent: string | undefined) => {
    setContent(newContent || '');
    if (!isDirty) setIsDirty(true);
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!isDirty) setIsDirty(true);
  }

  const handleSave = async () => {
    if (!activeNote || !isDirty) return;
    try {
      await updateNote(activeNote.id, { title, content });
      setIsDirty(false);
      // Optional: Add a subtle save indicator instead of a toast for autosave
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Saving Note',
        description: 'Could not save the note. Please try again.',
      });
    }
  };

  if (!activeNote) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-background/80">
        <WelcomeScreen />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b h-[65px] bg-background">
        <div className="flex items-center gap-3 flex-grow min-w-0">
            <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Note Title"
                className="text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-xl h-auto p-0 bg-transparent truncate"
            />
            <Badge variant="outline" className="flex-shrink-0">
              {activeNote.type === 'code' ? (
                  <Code className="h-3 w-3 mr-1.5" />
              ) : (
                  <Type className="h-3 w-3 mr-1.5" />
              )}
              {activeNote.type === 'code' ? 'Code' : 'Text'}
            </Badge>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <Button onClick={handleSave} disabled={isSaving || !isDirty} size="sm">
              {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span className="ml-2 hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
        </div>
      </header>

      <div className="flex-grow relative min-h-0">
        {activeNote.type === 'code' ? (
           <CodeEditor
              value={content}
              onChange={handleContentChange}
              language={activeNote?.language || 'plaintext'}
            />
        ) : (
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
          />
        )}
      </div>
    </div>
  );
}
