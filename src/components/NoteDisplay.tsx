'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNotes } from '@/context/NotesContext';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from '@/lib/pdf-export';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Code, Type, FileText, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/CodeEditor';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

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

type ExportType = 'note' | 'topic' | 'all';

export function NoteDisplay() {
  const { activeNote, updateNote, isDirty, setIsDirty, isSaving, notes, activeTopic, topics, getAllNotes } = useNotes();
  const { toast } = useToast();
  
  const [title, setTitle] = useState(activeNote?.title || '');
  const [content, setContent] = useState(activeNote?.content || '');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('note');

  useEffect(() => {
    // Only update local state from activeNote if there are no unsaved changes.
    // This prevents overwriting the user's input during autosave.
    if (activeNote && !isDirty) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
    }
    // If activeNote is null (e.g., topic deleted), clear the fields.
    if (!activeNote) {
        setTitle('');
        setContent('');
        setIsDirty(false);
    }
  }, [activeNote, isDirty, setIsDirty]);


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

  const handleExport = async () => {
    setIsExporting(true);
    setIsExportDialogOpen(false);
    try {
      let notesToExport: any[] = [];
      let exportFilename = "CodeNote-Export.pdf";

      if (exportType === 'note' && activeNote && activeTopic) {
        notesToExport.push({ ...activeNote, topicName: activeTopic.name });
        exportFilename = `${activeNote.title}.pdf`;
      } else if (exportType === 'topic' && activeTopic) {
        notesToExport = notes.map(note => ({ ...note, topicName: activeTopic.name }));
        exportFilename = `${activeTopic.name}-Notes.pdf`;
      } else if (exportType === 'all') {
         notesToExport = await getAllNotes();
         exportFilename = `Full-Notebook.pdf`;
      }

      if (notesToExport.length > 0) {
        await generatePdf(notesToExport);
        toast({
          title: "PDF Generated",
          description: "Your PDF has been downloaded.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Export Failed",
            description: "No notes available to export for the selected option.",
        });
      }
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while generating the PDF.",
      });
    } finally {
      setIsExporting(false);
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
    <>
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
            {isSaving && <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />}
            <Button onClick={handleSave} disabled={isSaving || !isDirty} size="sm" variant="ghost">
              <Save className="h-4 w-4" />
              <span className="ml-2 hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} size="sm">
              {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
              <span className="ml-2 hidden md:inline">{isExporting ? 'Exporting...' : 'Download PDF'}</span>
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
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Notes as PDF</DialogTitle>
          <DialogDescription>
            Choose what you would like to export. The PDF will be generated in a clean, light-mode format for readability.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="note" id="export-note" />
              <Label htmlFor="export-note" className="font-normal">Export This Note ({activeNote.title})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="topic" id="export-topic" />
              <Label htmlFor="export-topic" className="font-normal">Export This Topic ({activeTopic?.name})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="export-all" />
              <Label htmlFor="export-all" className="font-normal">Export Full Notebook (All Topics & Notes)</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="flex justify-end gap-2">
           <Button variant="ghost" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
           <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              Export
            </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
