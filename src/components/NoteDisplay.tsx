
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
import { Save, Loader2, Type, Download, Play, Dumbbell, Menu, ChevronDown, ChevronUp, Folder, Sparkles, BrainCircuit, Timer, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/CodeEditor';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PracticeModeModal } from './PracticeModeModal';
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { AiAssistantPanel } from './AiAssistantPanel';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CodeNoteLogo } from './CodeNoteLogo';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';


const RichTextEditor = dynamic(() => import('@/components/RichTextEditor').then(mod => mod.RichTextEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});


function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 overflow-y-auto">
        <CodeNoteLogo />
        <h2 className="text-2xl md:text-3xl font-headline font-semibold text-foreground mt-4">Welcome to Your Study Hub</h2>
        <p className="mt-2 text-muted-foreground text-center max-w-xl">
            Organize your notes, test your knowledge, and stay focused. Create a topic on the left to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 w-full max-w-4xl">
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary"/>
                        Organize Notes
                    </CardTitle>
                    <CardDescription>
                        Create notes for code snippets or rich text. Organize everything into topics and nested folders for easy access.
                    </CardDescription>
                </CardHeader>
            </Card>
            <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Timer className="h-6 w-6 text-primary"/>
                        Stay Focused
                    </CardTitle>
                    <CardDescription>
                        Use the built-in Pomodoro timer and Focus Lock QR code to eliminate distractions on your phone and track your study streaks.
                    </CardDescription>
                </CardHeader>
            </Card>
             <Card className="bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <BrainCircuit className="h-6 w-6 text-primary"/>
                        AI-Powered Learning
                    </CardTitle>
                    <CardDescription>
                       Generate quizzes from your notes, PDFs, or any topic. Use the AI Assistant to explain, debug, and write code.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    </div>
  );
}

function FolderScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Folder className="w-24 h-24 text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-headline font-semibold text-foreground">This is a folder</h2>
            <p className="mt-2 text-muted-foreground">
                You can drag and drop notes into this folder in the list on the left.
            </p>
        </div>
    );
}

type ExportType = 'note' | 'topic' | 'all';

function safeClean(code: string): string {
  if (!code) return "";

  code = code
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  code = code.replace(/<\/p>/gi, "\n");
  code = code.replace(/<p[^>]*>/gi, "");

  code = code
    .replace(/<\/?(div|span|strong|em|h\d|section|article|ul|ol|li|pre|code)[^>]*>/gi, "");

  return code.trim();
}

interface NoteDisplayProps {
  isMobile: boolean;
  mobileHeaderActions?: React.ReactNode;
}

export function NoteDisplay({ isMobile, mobileHeaderActions }: NoteDisplayProps) {
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
  } = useNotes();
  const { toast } = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('note');
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

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
      if (activeNote.type !== 'folder') {
        setDirtyNoteContent({
          title: activeNote.title,
          content: activeNote.content,
          language: activeNote.language || 'plaintext'
        });
      } else {
        setDirtyNoteContent(null);
      }
      setIsDirty(false);
      setOutput(null);
      setIsOutputOpen(false);
    } else {
      setDirtyNoteContent(null);
    }
  }, [activeNote?.id]);


  const handleContentChange = (newContent: string | undefined) => {
    if (newContent !== undefined && dirtyNoteContent) {
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
    if(isMobile) setIsOutputOpen(true);

    try {
      const languageId = getLanguageId(dirtyNoteContent.language || 'plaintext');
      
      if (!languageId) {
        setOutput('Execution failed: Language not supported for execution.');
        setIsRunning(false);
        return;
      }

      const codeToRun = dirtyNoteContent.content;
      const result = await runCode(languageId, codeToRun);

      // This is the updated, more robust logic.
      if (result.stderr) {
          setOutput(`Error (${result.status.description}):\n------------------------------------\n${result.stderr}`);
      } else if (result.compile_output) {
          setOutput(`Compilation Error:\n--------------------\n${result.compile_output}`);
      } else if (result.stdout) {
          setOutput(`Output:\n-------\n${result.stdout}`);
      } else {
          setOutput(result.status.description);
      }

    } catch (error) {
      console.error("Code Execution Error:", error);
      let errorMessage = error instanceof Error ? error.message : 'Execution failed, try again.';
      if (errorMessage.includes("429") && (errorMessage.includes("quota") || errorMessage.includes("Quota"))) {
        errorMessage = "You have exceeded the daily limit for code execution. Please try again tomorrow.";
      }
      setOutput(`Execution failed:\n-----------------\n${errorMessage}`);
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
    const isFolder = activeNote?.type === 'folder';
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-background/80">
        {isMobile && (
           <header className="flex-shrink-0 w-full flex items-center justify-between p-2 border-b h-[65px] bg-background">
             {mobileHeaderActions}
            <div/>
           </header>
        )}
        <div className="flex-grow w-full">
            {isFolder ? <FolderScreen /> : <WelcomeScreen />}
        </div>
      </div>
    );
  }

  const renderHeader = () => (
     <header className="flex-shrink-0 flex items-center justify-between p-2 md:p-4 border-b h-[65px] bg-background gap-2">
        {isMobile && mobileHeaderActions}
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <Input
            value={dirtyNoteContent.title}
            onChange={handleTitleChange}
            placeholder="Note Title"
            className="text-base md:text-lg font-headline border-0 shadow-none focus-visible:ring-0 flex-grow !text-xl h-auto p-0 bg-transparent truncate"
          />
          {activeNote.type !== 'code' && (
            <Badge variant="outline" className="flex-shrink-0 hidden sm:flex">
              <Type className="h-3 w-3 mr-1.5" />
              Text
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
          {isSaving && <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />}
          <Button onClick={handleManualSave} disabled={isSaving || !isDirty} size={isMobile ? 'icon' : 'sm'} variant="ghost">
            <Save className="h-4 w-4" />
            <span className="ml-2 hidden md:inline">{isSaving ? 'Saving...' : (isDirty ? 'Unsaved' : 'Saved')}</span>
          </Button>

          {activeNote.type === 'code' && (
            <>
              <Button onClick={() => setIsPracticeModalOpen(true)} size={isMobile ? 'icon' : 'sm'} variant="secondary">
                <Dumbbell className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Practice</span>
              </Button>
              {!isMobile && (
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
              )}
              <Button onClick={handleRunCode} disabled={isRunning} size={isMobile ? 'icon' : 'sm'}>
                {isRunning ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="ml-2 hidden md:inline">{isRunning ? 'Running...' : 'Run'}</span>
              </Button>
            </>
          )}

          <Button onClick={() => setIsExportDialogOpen(true)} disabled={isExporting} size={isMobile ? 'icon' : 'sm'} variant="outline">
            {isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4" />}
            <span className="ml-2 hidden md:inline">PDF</span>
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
                <Button size={isMobile ? 'icon' : 'sm'} variant="outline">
                    <Sparkles className="h-4 w-4" />
                    <span className="ml-2 hidden md:inline">AI Assistant</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none p-0 flex flex-col">
              <VisuallyHidden>
                <DialogTitle>AI Assistant</DialogTitle>
              </VisuallyHidden>
              <AiAssistantPanel />
            </SheetContent>
          </Sheet>
        </div>
      </header>
  );

  return (
    <>
      <div className="h-full w-full flex flex-col bg-background min-h-0">
        {renderHeader()}

        <div className="flex-grow relative min-h-0">
          {activeNote.type === 'code' ? (
            <div className='h-full flex flex-col'>
              <div className='flex-grow min-h-0 md:h-auto md:max-h-full'>
                <CodeEditor
                  key={activeNote.id}
                  value={dirtyNoteContent.content}
                  onChange={handleContentChange}
                  language={dirtyNoteContent.language || 'plaintext'}
                  isMobile={isMobile}
                />
              </div>
              
              {isMobile ? (
                 <Collapsible open={isOutputOpen} onOpenChange={setIsOutputOpen}>
                  <CollapsibleTrigger asChild>
                    <div className="border-t bg-muted/50 p-2 flex justify-between items-center cursor-pointer">
                      <h3 className="font-semibold text-sm">Output</h3>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isOutputOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="code-output-box flex-shrink-0 h-[20vh]">
                      <pre><code>{output || '(no output)'}</code></pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div className="code-output-box flex-shrink-0">
                  <pre><code>{output || '(no output)'}</code></pre>
                </div>
              )}
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
      
      {activeNote && activeNote.type === 'code' && (
        <PracticeModeModal
          isOpen={isPracticeModalOpen}
          onClose={() => setIsPracticeModalOpen(false)}
          originalCode={activeNote.content}
          language={activeNote.language || 'plaintext'}
          noteId={activeNote.id}
        />
      )}
    </>
  );
}
    

    

    
