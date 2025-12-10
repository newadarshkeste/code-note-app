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
import { FilePlus2, Search, Trash2, Pencil, Type, Code, GripVertical, ChevronRight, ChevronDown, Folder, Plus } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Note, Topic } from '@/lib/types';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useToast } from '@/hooks/use-toast';

function SortableNoteItem({ note, onNoteSelect, onAddInside, activeId, overId }: { note: Note, onNoteSelect: (id: string) => void, onAddInside: (parentId: string) => void, activeId: string | null, overId: string | null }) {
    const { 
        activeNoteId, 
        getSubNotes, 
        deleteNote,
        updateNote,
        notes,
    } = useNotes();
    const [renameNote, setRenameNote] = useState<Note | null>(null);
    const [renamingTitle, setRenamingTitle] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    
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

    const subNotes = useMemo(() => getSubNotes(note.id), [getSubNotes, note.id, notes]);
    const hasSubNotes = subNotes.length > 0;

    const handleRenameNote = async () => {
        if (renameNote && renamingTitle.trim()) {
            await updateNote(renameNote.id, { title: renamingTitle.trim() });
            setRenameNote(null);
            setRenamingTitle('');
        }
    };
    
    const getNoteIcon = (noteType: Note['type']) => {
        switch (noteType) {
            case 'code':
                return <Code className="h-4 w-4 flex-shrink-0" />;
            case 'text':
                return <Type className="h-4 w-4 flex-shrink-0" />;
            case 'folder':
                return <Folder className="h-4 w-4 flex-shrink-0 text-amber-500" />;
            default:
                return null;
        }
    }

    const isOverContainer = note.type !== 'folder' && overId === note.id && activeId !== note.id;
    
    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="relative w-full">
            <div 
                ref={setNodeRef} 
                style={style} 
                className={cn(
                    "group flex items-center w-full my-1 rounded-md bg-card/80 hover:bg-accent/80 pr-1 transition-all duration-150",
                    isOverContainer && "ring-2 ring-primary bg-primary/10"
                )}
            >
                <div 
                    {...attributes} 
                    {...listeners} 
                    className="cursor-grab p-2 text-muted-foreground hover:bg-muted rounded-l-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                 <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-8 w-8", !hasSubNotes && "invisible")}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                </CollapsibleTrigger>
                <Button
                    variant="ghost"
                    onClick={() => onNoteSelect(note.id)}
                    className={cn(
                        "flex-grow justify-start gap-2 h-full text-sm",
                        activeNoteId === note.id ? 'bg-primary/10 text-primary font-semibold' : ''
                    )}
                >
                    {getNoteIcon(note.type)}
                    <span className="truncate flex-grow text-left">{note.title}</span>
                </Button>
                <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onAddInside(note.id); }}>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
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

            <CollapsibleContent>
                {hasSubNotes && (
                    <div className="pl-6">
                        <SortableContext items={subNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                           {subNotes.map(subNote => (
                               <SortableNoteItem key={subNote.id} note={subNote} onNoteSelect={onNoteSelect} onAddInside={onAddInside} activeId={activeId} overId={overId} />
                           ))}
                        </SortableContext>
                    </div>
                )}
            </CollapsibleContent>
             <Dialog open={!!renameNote} onOpenChange={(isOpen) => !isOpen && setRenameNote(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Note</DialogTitle>
                        <DialogDescription>Enter a new name for the item "{renameNote?.title}".</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rename-note-name" className="text-right">
                            New Name
                        </Label>
                        <Input
                            id="rename-note-name"
                            value={renamingTitle}
                            onChange={(e) => setRenamingTitle(e.target.value)}
                            className="col-span-3 font-body"
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameNote()}
                        />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={() => setRenameNote(null)}>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleRenameNote}>Rename</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Collapsible>
    );
}

export function NoteList() {
    const {
        activeTopic,
        notes,
        notesLoading,
        addNote,
        isDirty,
        setIsDirty,
        activeNoteId,
        setActiveNoteId,
        saveActiveNote,
        handleNoteDrop,
        getSubNotes,
    } = useNotes();
    const { toast } = useToast();

    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteType, setNewNoteType] = useState<'code' | 'text' | 'folder'>('code');
    const [allowedNoteTypes, setAllowedNoteTypes] = useState<Array<'code' | 'text' | 'folder'>>(['code', 'text', 'folder']);
    const [newNoteLanguage, setNewNoteLanguage] = useState('javascript');
    const [noteSearch, setNoteSearch] = useState('');
    const [newNoteParentId, setNewNoteParentId] = useState<string | null>(null);
    const [pendingNoteId, setPendingNoteId] = useState<string | null>(null);
    const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const handleNoteSelection = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        
        if (isDirty) {
            setPendingNoteId(noteId);
            setIsUnsavedDialogOpen(true);
        } else {
            setActiveNoteId(noteId);
        }
    };

    const handleAddInside = (parentId: string) => {
        handleOpenNewItemDialog(parentId);
    };

    const handleOpenNewItemDialog = (parentId: string | null) => {
        setNewNoteParentId(parentId);
        setNewNoteType('code');
        setNewNoteTitle('');

        const parentNote = parentId ? notes.find(n => n.id === parentId) : null;
        if (parentNote && parentNote.type === 'code') {
            setAllowedNoteTypes(['text', 'code']);
            setNewNoteType('text');
        } else {
            setAllowedNoteTypes(['code', 'text', 'folder']);
        }

        setIsNoteDialogOpen(true);
    };

    const handleAddItemClick = () => {
        handleOpenNewItemDialog(null);
    };
    
    const handleSaveAndSwitch = async () => {
        await saveActiveNote();
        setIsDirty(false);
        if (pendingNoteId) {
            setActiveNoteId(pendingNoteId);
        }
        setIsUnsavedDialogOpen(false);
        setPendingNoteId(null);
    };

    const handleDiscardAndSwitch = () => {
        setIsDirty(false);
        if (pendingNoteId) {
            setActiveNoteId(pendingNoteId);
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
                parentId: newNoteParentId,
                language: newNoteType === 'code' ? newNoteLanguage : undefined
            });
            setNewNoteTitle('');
            setNewNoteType('code');
            setIsNoteDialogOpen(false);
            setNewNoteParentId(null);
        }
    };
    
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
    };
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setOverId(null);
        
        if (over && active.id !== over.id) {
           handleNoteDrop(active.id as string, over?.id as string | null);
        } else if (!over) {
            const activeNote = notes.find(n => n.id === active.id);
            if(activeNote && activeNote.parentId) {
                handleNoteDrop(active.id as string, null);
            }
        }
    };
    
     const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string | null);
    };

    const displayedNotes = useMemo(() => {
        const lowerCaseSearch = noteSearch.toLowerCase();
        if (!noteSearch) {
            return getSubNotes(null);
        }
        return notes.filter(note => note.title.toLowerCase().includes(lowerCaseSearch));
    }, [notes, noteSearch, getSubNotes]);

    if (!activeTopic) {
        return (
            <div className="h-full w-full flex items-center justify-center text-center p-4 bg-card">
                <p className="text-sm text-muted-foreground">Select a topic to see its notes.</p>
            </div>
        );
    }
    
    const getDialogDescription = () => {
        let parentName = activeTopic.name;
        let location = "topic";
        
        if (newNoteParentId) {
            const parentNote = notes.find(n => n.id === newNoteParentId);
            if(parentNote) {
                parentName = parentNote.title;
                location = parentNote.type;
            }
        }
        return `This item will be created inside the ${location} "${parentName}".`;
    };


    return (
        <>
            <div className="h-full w-full flex flex-col bg-card">
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b h-[109px]">
                    <div className="flex flex-col gap-4 w-full">
                        <h2 className="text-lg font-headline font-semibold truncate" title={activeTopic.name}>
                            {activeTopic.name}
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notes..."
                                className="pl-9 h-10"
                                value={noteSearch}
                                onChange={(e) => setNoteSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </header>
                
                <div className="p-4 flex-shrink-0 border-b">
                     <Button
                        className="w-full justify-center gap-2"
                        onClick={handleAddItemClick}
                    >
                        <FilePlus2 className="h-4 w-4" />
                        <span>Add Item</span>
                    </Button>
                </div>

                <ScrollArea className="flex-grow min-h-0">
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
                                     {displayedNotes.map(note => (
                                        <SortableNoteItem key={note.id} note={note} onNoteSelect={handleNoteSelection} onAddInside={handleAddInside} activeId={activeDragId} overId={overId} />
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
                if(!isOpen) setNewNoteParentId(null);
                setIsNoteDialogOpen(isOpen);
            }}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                     <DialogDescription>
                        {getDialogDescription()}
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
                            onValueChange={(value: 'code' | 'text' | 'folder') => setNewNoteType(value)}
                        >
                            {allowedNoteTypes.includes('code') && (
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="code" id="r1" />
                                    <Label htmlFor="r1" className="font-normal flex items-center gap-2"><Code className="h-4 w-4"/> Code Snippet</Label>
                                </div>
                            )}
                            {allowedNoteTypes.includes('text') && (
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="text" id="r2" />
                                    <Label htmlFor="r2" className="font-normal flex items-center gap-2"><Type className="h-4 w-4"/> Text Note</Label>
                                </div>
                            )}
                            {allowedNoteTypes.includes('folder') && (
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="folder" id="r3" />
                                    <Label htmlFor="r3" className="font-normal flex items-center gap-2"><Folder className="h-4 w-4"/> Folder</Label>
                                </div>
                            )}
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
