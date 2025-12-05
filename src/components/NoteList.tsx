
'use client';

import React, { useState, useMemo } from 'react';
import { useNotes } from '@/context/NotesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { FilePlus2, Search, Trash2, Pencil, Type, Code, CornerDownRight, GripVertical } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Note } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableNoteItem({ note, level = 0, onNoteSelect }: { note: Note, level?: number, isMobile?: boolean, onNoteSelect: (id: string) => void }) {
    const { 
        activeNoteId, 
        getSubNotes, 
        deleteNote,
        updateNote
    } = useNotes();
    const [renameNote, setRenameNote] = useState<Note | null>(null);
    const [renamingTitle, setRenamingTitle] = useState('');
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: note.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const subNotes = getSubNotes(note.id);
    const hasSubNotes = subNotes.length > 0;

    const handleRenameNote = async () => {
        if (renameNote && renamingTitle.trim()) {
            await updateNote(renameNote.id, { title: renamingTitle.trim() });
            setRenameNote(null);
            setRenamingTitle('');
        }
    };
    
    return (
        <div ref={setNodeRef} style={style} className="relative">
            <div className="group flex items-center justify-between w-full h-10 pr-1 my-1 rounded-md bg-card/80 hover:bg-accent/80">
                <Button
                    variant="ghost"
                    onClick={() => onNoteSelect(note.id)}
                    className={cn(
                        "w-full justify-start gap-2 h-full text-sm",
                        activeNoteId === note.id ? 'bg-primary/10 text-primary font-semibold' : ''
                    )}
                    style={{ paddingLeft: `${(level * 1.5) + 1}rem` }}
                >
                    <div {...attributes} {...listeners} className="cursor-grab p-2 -ml-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {note.type === 'code' ? (
                        <Code className="h-4 w-4 flex-shrink-0" />
                    ) : (
                        <Type className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate flex-grow text-left">{note.title}</span>
                </Button>
                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setRenameNote(note); setRenamingTitle(note.title); }}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete "{note.title}" and all its sub-notes. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {hasSubNotes && (
                <div className="pl-6">
                    <SortableContext items={subNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                       {subNotes.map(subNote => (
                           <SortableNoteItem key={subNote.id} note={subNote} level={level + 1} onNoteSelect={onNoteSelect} />
                       ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

interface NoteListProps {
  isMobile?: boolean;
  onNoteSelect?: () => void;
  onBack?: () => void;
}

export function NoteList({ isMobile = false, onNoteSelect, onBack }: NoteListProps) {
    const {
        activeTopic,
        notes,
        notesLoading,
        addNote,
        activeNote,
        isDirty,
        setIsDirty,
        setActiveNoteId,
        saveActiveNote,
        handleNoteDrop,
    } = useNotes();

    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteType, setNewNoteType] = useState<'code' | 'text'>('code');
    const [newNoteLanguage, setNewNoteLanguage] = useState('javascript');
    const [noteSearch, setNoteSearch] = useState('');
    const [isSubNote, setIsSubNote] = useState(false);
    const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);
    const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const handleNoteSelection = (noteId: string) => {
        if (isDirty) {
            setPendingNoteId(noteId);
            setIsUnsavedDialogOpen(true);
        } else {
            setActiveNoteId(noteId);
            if (isMobile && onNoteSelect) {
                onNoteSelect();
            }
        }
    };
    
    const handleSaveAndSwitch = async () => {
        await saveActiveNote();
        setIsDirty(false);
        if (pendingNoteId) {
            setActiveNoteId(pendingNoteId);
             if (isMobile && onNoteSelect) {
                onNoteSelect();
            }
        }
        setIsUnsavedDialogOpen(false);
        setPendingNoteId(null);
    };

    const handleDiscardAndSwitch = () => {
        setIsDirty(false);
        if (pendingNoteId) {
            setActiveNoteId(pendingNoteId);
            if (isMobile && onNoteSelect) {
                onNoteSelect();
            }
        }
        setIsUnsavedDialogOpen(false);
        setPendingNoteId(null);
    };

    const handleCancelSwitch = () => {
        setIsUnsavedDialogOpen(false);
        setPendingNoteId(null);
    };

    const handleAddNote = async () => {
        if (newNoteTitle.trim() && activeTopic) {
            await addNote({ 
                title: newNoteTitle.trim(), 
                type: newNoteType,
                parentId: isSubNote && activeNote ? activeNote.id : null,
                language: newNoteType === 'code' ? newNoteLanguage : undefined
            });
            setNewNoteTitle('');
            setNewNoteType('code');
            setIsNoteDialogOpen(false);
            setIsSubNote(false);
        }
    };
    
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (active.id !== over?.id) {
           handleNoteDrop(active.id as string, over?.id as string | null);
        }
    };
     const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const activeId = active.id as string;
        const overId = over?.id as string | null;

        if (!overId || activeId === overId) return;

        const activeNote = notes.find(n => n.id === activeId);
        const overNote = notes.find(n => n.id === overId);

        if (!activeNote || !overNote) return;

        // Logic to handle dropping over a note (making it a subnote)
        // This is a simplified version. A full implementation would need more complex state updates.
        // For now, we only handle reordering.
    };

    const topLevelNotes = useMemo(() => {
        const lowerCaseSearch = noteSearch.toLowerCase();
        const filtered = notes.filter(note => note.title.toLowerCase().includes(lowerCaseSearch));
        return filtered.filter(note => !note.parentId);
    }, [notes, noteSearch]);


    if (!activeTopic) {
        return (
            <div className="h-full w-full flex items-center justify-center text-center p-4 bg-card">
                <p className="text-sm text-muted-foreground">Select a topic to see its notes.</p>
            </div>
        );
    }

    return (
        <>
            <div className="h-full w-full flex flex-col bg-card border-r">
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b h-[65px]">
                    <div className="flex items-center gap-2 min-w-0">
                        {isMobile && onBack && (
                            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                                <CornerDownRight className="h-4 w-4" />
                            </Button>
                        )}
                        <h2 className="text-lg font-headline font-semibold truncate" title={activeTopic.name}>
                            {activeTopic.name}
                        </h2>
                    </div>
                </header>
                
                <div className="p-4 flex-shrink-0 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            className="pl-9 h-10"
                            value={noteSearch}
                            onChange={(e) => setNoteSearch(e.target.value)}
                        />
                    </div>
                     <Button
                        className="w-full justify-center gap-2"
                        onClick={() => {
                            setIsSubNote(false);
                            setIsNoteDialogOpen(true);
                        }}
                    >
                        <FilePlus2 className="h-4 w-4" />
                        <span>Add Note</span>
                    </Button>
                    {activeNote && (
                         <Button
                            className="w-full justify-center gap-2"
                            variant="secondary"
                            onClick={() => {
                                setIsSubNote(true);
                                setIsNoteDialogOpen(true);
                            }}
                        >
                            <CornerDownRight className="h-4 w-4" />
                            <span>Add Sub-Note</span>
                        </Button>
                    )}
                </div>

                <ScrollArea className="flex-grow min-h-0 border-t">
                    <div className="p-4 pt-2">
                        {notesLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                             <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                             >
                                 <SortableContext items={notes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                                     {topLevelNotes.map(note => (
                                        <SortableNoteItem key={note.id} note={note} onNoteSelect={handleNoteSelection} isMobile={isMobile} />
                                    ))}
                                 </SortableContext>
                             </DndContext>
                        )}
                         {notes.length === 0 && !notesLoading && (
                             <p className="text-sm text-center text-muted-foreground pt-4">No notes in this topic.</p>
                         )}
                    </div>
                </ScrollArea>
            </div>
            
            <AlertDialog open={isUnsavedDialogOpen} onOpenChange={setIsUnsavedDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Do you want to save them before switching?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="ghost" onClick={handleCancelSwitch}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDiscardAndSwitch}>Discard Changes</Button>
                         <Button onClick={handleSaveAndSwitch}>Save and Continue</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isNoteDialogOpen} onOpenChange={(isOpen) => {
                if(!isOpen) setIsSubNote(false);
                setIsNoteDialogOpen(isOpen);
            }}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                         {isSubNote ? 'Create Sub-Note' : 'Create New Note'}
                    </DialogTitle>
                     <DialogDescription>
                        {isSubNote && activeNote 
                            ? `This note will be created under "${activeNote.title}".`
                            : `This note will be created in the topic "${activeTopic.name}".`
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note-title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="note-title"
                            value={newNoteTitle}
                            onChange={(e) => setNewNoteTitle(e.target.value)}
                            className="col-span-3 font-body"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Type</Label>
                        <RadioGroup
                            className="col-span-3 flex flex-col space-y-2 pt-1"
                            value={newNoteType}
                            onValueChange={(value: 'code' | 'text') => setNewNoteType(value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="code" id="r1" />
                                <Label htmlFor="r1" className="font-normal flex items-center gap-2"><Code className="h-4 w-4"/> Code Snippet</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="text" id="r2" />
                                <Label htmlFor="r2" className="font-normal flex items-center gap-2"><Type className="h-4 w-4"/> Text Note</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    {newNoteType === 'code' && (
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="note-language" className="text-right">Language</Label>
                             <Select value={newNoteLanguage} onValueChange={setNewNoteLanguage}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a language" />
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
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddNote} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
