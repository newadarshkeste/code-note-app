'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useNotes } from '@/context/NotesContext';
import { useToast } from '@/hooks/use-toast';
import { generatePdf } from '@/lib/pdf-export';
import { runCode } from '@/lib/judge0';
import { getLanguageId } from '@/lib/language-mapping';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Type, Download, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/CodeEditor';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});


function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50 mb-4">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>
      <h2 className="text-2xl font-headline font-semibold text-foreground">Welcome to CodeNote</h2>
      <p className="mt-2 text-muted-foreground">
        Select a note from the list to start editing, or create a new topic and note.
      </p>
    </div>
  );
}

type ExportType = 'note' | 'topic' | 'all';

function safeClean(code: string): string {
  if (!code) return "";

  // Convert HTML entities to actual characters FIRST
  code = code
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Replace <p> ... </p> with proper lines
  code = code.replace(/<\/p>/gi, "\n");
  code = code.replace(/<p[^>]*>/gi, "");

  // Remove ONLY visual container tags — not generic <>
  code = code
    .replace(/<\/?(div|span|strong|em|h\d|section|article|ul|ol|li|pre|code)[^>]*>/gi, "");

  return code.trim();
}


export function NoteDisplay() {
  const {
    activeNote,
    isDirty,
    setIsDirty,
    isSaving,
    notes,
    activeTopic,
    getAllNotes,
    dirtyNoteContent,
    setDirtyNoteContent,
    saveActiveNote,
    studyStats,
  } = useNotes();
  const { toast } = useToast();
  const { trackers } = studyStats;


  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('note');

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (isDirty) {
          saveActiveNote();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDirty, saveActiveNote]);

  useEffect(() => {
    if (activeNote) {
      setDirtyNoteContent({
        title: activeNote.title,
        content: activeNote.content,
        language: activeNote.language || 'plaintext'
      });
      setIsDirty(false);
      setOutput(null);
      
      // Hook for study tracker
      if(activeNote.type === 'code') {
        trackers.startCodingTimer();
      } else {
        trackers.stopCodingTimer();
      }

    } else {
      setDirtyNoteContent(null);
      trackers.stopCodingTimer();
    }
    
    return () => {
        trackers.stopCodingTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id]);


  const handleContentChange = (newContent: string | undefined) => {
    if (newContent !== undefined && dirtyNoteContent) {
      if(activeNote?.type === 'code') {
          const oldLineCount = dirtyNoteContent.content.split('\n').length;
          const newLineCount = newContent.split('\n').length;
          if(newLineCount > oldLineCount) {
              trackers.incrementLinesTyped();
          }
      }

      setDirtyNoteContent(prev => ({ ...prev!, content: newContent! }));
      if (!isDirty) setIsDirty(true);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (dirtyNoteContent) {
      setDirtyNoteContent(prev => ({ ...prev!, title: e.target.value }));
      if (!isDirty) setIsDirty(true);
    }
  }

  const handleLanguageChange = (lang: string) => {
    if (dirtyNoteContent) {
      setDirtyNoteContent(prev => ({ ...prev!, language: lang }));
      if (!isDirty) setIsDirty(true);
    }
  };

  const handleManualSave = async () => {
    await saveActiveNote();
  };

  const handleRunCode = async () => {
    if (!activeNote || activeNote.type !== 'code' || !dirtyNoteContent) return;

    setIsRunning(true);
    setOutput('Executing code...');

    try {
      const languageId = getLanguageId(dirtyNoteContent.language || 'plaintext');
      
      if (!languageId) {
        setOutput('Execution failed: Language not supported for execution.');
        setIsRunning(false);
        return;
      }

      const cleanCode = safeClean(dirtyNoteContent.content);

      const result = await runCode(languageId, cleanCode);

      let outputText = "";
      if (result.stdout && result.stdout.trim() !== "") {
        outputText = result.stdout;
      } else if (result.stderr && result.stderr.trim() !== "") {
        outputText = result.stderr;
      } else {
        outputText = result.status.description;
      }
      setOutput(outputText);

    } catch (error) {
      console.error("Code Execution Error:", error);
      let errorMessage = error instanceof Error ? error.message : 'Execution failed, try again.';
      if (errorMessage.includes("429") && errorMessage.includes("quota")) {
        errorMessage = "You have exceeded the daily limit for code execution. Please try again tomorrow.";
      }
      setOutput(errorMessage);
    } finally {
      setIsRunning(false);
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


  if (!activeNote || !dirtyNoteContent) {
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
              value={dirtyNoteContent.title}
              onChange={handleTitleChange}
              placeholder="Note Title"
              className="text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-xl h-auto p-0 bg-transparent truncate"
            />
            {activeNote.type !== 'code' && (
              <Badge variant="outline" className="flex-shrink-0">
                <Type className="h-3 w-3 mr-1.5" />
                Text
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {isSaving && <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />}
            <Button onClick={handleManualSave} disabled={isSaving || !isDirty} size="sm" variant="ghost">
              <Save className="h-4 w-4" />
              <span className="ml-2 hidden md:inline">{isSaving ? 'Saving...' : (isDirty ? 'Unsaved' : 'Saved')}</span>
            </Button>

            {activeNote.type === 'code' && (
              <>
                <Select value={dirtyNoteContent.language || 'plaintext'} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-[120px] h-9 text-sm">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="swift">Swift</SelectItem>
                    <SelectItem value="kotlin">Kotlin</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                    <SelectItem value="plaintext">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleRunCode} disabled={isRunning} size="sm">
                  {isRunning ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span className="ml-2 hidden md:inline">{isRunning ? 'Running...' : 'Run Code'}</span>
                </Button>
              </>
            )}

            <Button onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} size="sm">
              {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
              <span className="ml-2 hidden md-inline">{isExporting ? 'Exporting...' : 'Download PDF'}</span>
            </Button>
          </div>
        </header>

        <div className="flex-grow relative min-h-0">
          {activeNote.type === 'code' ? (
            <div className='h-full flex flex-col'>
              <div className='flex-grow min-h-0'>
                <CodeEditor
                  key={activeNote.id}
                  value={dirtyNoteContent.content}
                  onChange={handleContentChange}
                  language={dirtyNoteContent.language || 'plaintext'}
                />
              </div>
              <div className="code-output-box flex-shrink-0">
                <pre><code>{output || '(no output)'}</code></pre>
              </div>
            </div>
          ) : (
            <RichTextEditor
              key={activeNote.id}
              value={dirtyNoteContent.content}
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
