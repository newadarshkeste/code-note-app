'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Topic, Note } from '@/lib/types';
import { initialTopics, initialNotes } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

type NoteContentUpdater = (newContent: string) => void;

interface NotesContextType {
  topics: Topic[];
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  getNotesByTopic: (topicId: string) => Note[];
  addTopic: (name: string) => void;
  deleteTopic: (topicId: string) => void;
  addNote: (topicId: string, title: string) => void;
  deleteNote: (noteId: string) => void;
  updateNote: (noteId: string, title: string, content: string, highlightedContent?: string, language?: string) => void;
  activeNote: Note | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredTopics: Topic[];
  updateNoteContent: (noteId: string, updater: NoteContentUpdater) => void;
  getNoteContentUpdater: (noteId: string) => NoteContentUpdater | undefined;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [noteUpdaters, setNoteUpdaters] = useState<Record<string, NoteContentUpdater>>({});
  const { toast } = useToast();
  
  const updateNoteContent = useCallback((noteId: string, updater: NoteContentUpdater) => {
    setNoteUpdaters(prev => ({...prev, [noteId]: updater}));
  }, []);

  const getNoteContentUpdater = useCallback((noteId: string) => {
    return noteUpdaters[noteId];
  }, [noteUpdaters]);

  const getNotesByTopic = useCallback((topicId: string) => {
    return notes
      .filter(note => note.topicId === topicId)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [notes]);

  const addTopic = (name: string) => {
    const newTopic: Topic = { id: Date.now().toString(), name };
    setTopics(prev => [...prev, newTopic]);
    toast({
      title: 'Topic Created',
      description: `Successfully created topic: ${name}`,
    });
  };

  const deleteTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    setTopics(prev => prev.filter(t => t.id !== topicId));
    setNotes(prev => prev.filter(n => n.topicId !== topicId));
    if (activeNote && notes.some(n => n.topicId === topicId && n.id === activeNote.id)) {
      setActiveNoteId(null);
    }
    toast({
      title: 'Topic Deleted',
      description: `Successfully deleted topic: ${topic?.name}`,
    });
  };

  const addNote = (topicId: string, title: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      topicId,
      title,
      content: `// Start writing your ${title} note here...`,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newNote.id);
    toast({
      title: 'Note Created',
      description: `Successfully created note: ${title}`,
    });
  };

  const deleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
    toast({
      title: 'Note Deleted',
      description: `Successfully deleted note: ${note?.title}`,
    });
  };

  const updateNote = (noteId: string, title: string, content: string, highlightedContent?: string, language?: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === noteId ? { ...note, title, content, highlightedContent, language } : note
      )
    );
  };
  
  const activeNote = useMemo(() => {
    return notes.find(note => note.id === activeNoteId) || null;
  }, [activeNoteId, notes]);

  const filteredTopics = useMemo(() => {
    if (!searchTerm) return topics;
    
    const lowercasedFilter = searchTerm.toLowerCase();
    const notesMap = new Map<string, Note[]>();
    notes.forEach(note => {
      if (!notesMap.has(note.topicId)) {
        notesMap.set(note.topicId, []);
      }
      notesMap.get(note.topicId)!.push(note);
    });

    return topics.filter(topic => {
      const topicMatch = topic.name.toLowerCase().includes(lowercasedFilter);
      if (topicMatch) return true;

      const topicNotes = notesMap.get(topic.id) || [];
      return topicNotes.some(note => 
        note.title.toLowerCase().includes(lowercasedFilter) || 
        note.content.toLowerCase().includes(lowercasedFilter)
      );
    });
  }, [searchTerm, topics, notes]);

  const value = {
    topics,
    notes,
    activeNoteId,
    setActiveNoteId,
    getNotesByTopic,
    addTopic,
    deleteTopic,
    addNote,
    deleteNote,
    updateNote,
    activeNote,
    searchTerm,
    setSearchTerm,
    filteredTopics,
    updateNoteContent,
    getNoteContentUpdater,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
