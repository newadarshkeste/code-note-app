'use client';

import React, { useState } from 'react';
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
import { File, FilePlus2, Search, Trash2, Pencil, Type, Code } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Note } from '@/lib/types';

export function NoteList() {
    const {
        activeTopic,
        getNotesByTopic,
        activeNoteId,
        setActiveNoteId,
        addNote,
        deleteNote,
        updateNote,
    } = useNotes();

    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteType, setNewNoteType] = useState<'code' | 'text'>('code');
    const [noteSearch, setNoteSearch] = useState('');
    const [renameNote, setRenameNote] = useState<Note | null>(null);
    const [renamingTitle, setRenamingTitle] = useState('');

    const handleAddNote = () => {
        if (newNoteTitle.trim() && activeTopic) {
            addNote(activeTopic.id, newNoteTitle.trim(), newNoteType);
            setNewNoteTitle('');
            setNewNoteType('code');
            setIsNoteDialogOpen(false);
        }
    };

    const handleRenameNote = () => {
        if (renameNote && renamingTitle.trim()) {
            updateNote(renameNote.id, renamingTitle.trim(), renameNote.content);
            setRenameNote(null);
            setRenamingTitle('');
        }
    };

    if (!activeTopic) {
        return (
            <div className="h-full w-full flex items-center justify-center text-center p-4 bg-card">
                <p className="text-sm text-muted-foreground">Select a topic to see its notes.</p>
            </div>
        );
    }
    
    const notes = getNotesByTopic(activeTopic.id);
    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(noteSearch.toLowerCase())
    );

    return (
        <>
            <div className="h-full w-full flex flex-col bg-card border-r">
                <header className="flex-shrink-0 p-4 flex items-center justify-between border-b h-[65px]">
                    <h2 className="text-lg font-headline font-semibold truncate" title={activeTopic.name}>{activeTopic.name}</h2>
                </header>
                
                <div className="p-4 flex-shrink-0">
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
                 <div className="px-4 pb-4 border-b flex-shrink-0">
                    <Button
                        className="w-full justify-center gap-2"
                        onClick={() => setIsNoteDialogOpen(true)}
                    >
                        <FilePlus2 className="h-4 w-4" />
                        <span>Add Note</span>
                    </Button>
                </div>

                <ScrollArea className="flex-grow min-h-0">
                    <nav className="p-4 pt-2">
                        <ul>
                            {filteredNotes.map((note) => (
                                <li key={note.id} className="group flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveNoteId(note.id)}
                                        className={cn(
                                            "w-full justify-start gap-2 h-10 text-sm",
                                            activeNoteId === note.id ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'
                                        )}
                                    >
                                        {note.type === 'code' ? (
                                            <Code className="h-4 w-4 flex-shrink-0" />
                                        ) : (
                                            <Type className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <span className="truncate flex-grow text-left">{note.title}</span>
                                    </Button>
                                    <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setRenameNote(note); setRenamingTitle(note.title); }}>
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This will permanently delete the note "{note.title}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </ScrollArea>
            </div>

             {/* New Note Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Note in {activeTopic.name}</DialogTitle>
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
                            defaultValue="code"
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
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddNote} className="bg-primary hover:bg-primary/90 text-primary-foreground">Create</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Note Dialog */}
            <Dialog open={!!renameNote} onOpenChange={(isOpen) => !isOpen && setRenameNote(null)}>
                <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Note</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rename-note-title" className="text-right">
                        New Title
                    </Label>
                    <Input
                        id="rename-note-title"
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
                    <Button onClick={handleRenameNote} className="bg-primary hover:bg-primary/90 text-primary-foreground">Rename</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
