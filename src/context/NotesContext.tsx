'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { Topic, Note, NoteUpdate, NoteCreate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { getHighlightedCode } from '@/app/actions';

interface NotesContextType {
  topics: Topic[];
  topicsLoading: boolean;
  notes: Note[];
  notesLoading: boolean;
  activeTopicId: string | null;
  activeTopic: Topic | null;
  setActiveTopicId: (id: string | null) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  addTopic: (name: string) => Promise<void>;
  updateTopic: (topicId: string, name: string) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  addNote: (note: NoteCreate) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNote: (noteId: string, data: NoteUpdate) => Promise<void>;
  activeNote: Note | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const topicsRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'topics') : null, [user, firestore]);
  const notesRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'notes') : null, [user, firestore]);

  // Fetch topics
  useEffect(() => {
    if (!topicsRef) {
      setTopics([]);
      setTopicsLoading(false);
      return;
    };
    
    setTopicsLoading(true);
    const q = query(topicsRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTopics = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Topic));
      setTopics(fetchedTopics);
      if (!activeTopicId && fetchedTopics.length > 0) {
        setActiveTopicId(fetchedTopics[0].id);
      } else if (fetchedTopics.length === 0) {
        setActiveTopicId(null);
      }
      setTopicsLoading(false);
    }, (error) => {
      console.error("Error fetching topics:", error);
      toast({ variant: 'destructive', title: "Error fetching topics" });
      setTopicsLoading(false);
    });

    return () => unsubscribe();
  }, [topicsRef, activeTopicId, toast]);

  // Fetch notes for the active topic
  useEffect(() => {
    if (!notesRef || !activeTopicId) {
        setNotes([]);
        setNotesLoading(false);
        return;
    }
    setNotesLoading(true);
    const q = query(notesRef, where('topicId', '==', activeTopicId), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Note));
      setNotes(fetchedNotes);
      setNotesLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      toast({ variant: 'destructive', title: "Error fetching notes" });
      setNotesLoading(false);
    });

    return () => unsubscribe();

  }, [notesRef, activeTopicId, toast]);

  // Reset active note if topic changes
  useEffect(() => {
    setActiveNoteId(null);
  }, [activeTopicId]);

  const addTopic = async (name: string) => {
    if (!topicsRef) return;
    try {
      const docRef = await addDoc(topicsRef, { name, createdAt: serverTimestamp() });
      setActiveTopicId(docRef.id);
      toast({ title: 'Topic Created', description: `Successfully created topic: ${name}` });
    } catch (error) {
      console.error("Error adding topic: ", error);
      toast({ variant: 'destructive', title: 'Error Creating Topic' });
    }
  };

  const updateTopic = async (topicId: string, name: string) => {
    if (!user) return;
    const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
    try {
      await updateDoc(topicDocRef, { name });
      toast({ title: 'Topic Renamed', description: `Topic has been renamed to: ${name}` });
    } catch (error) {
      console.error("Error updating topic: ", error);
      toast({ variant: 'destructive', title: 'Error Renaming Topic' });
    }
  };

  const deleteTopic = async (topicId: string) => {
    if (!user || !notesRef) return;
    
    try {
      const batch = writeBatch(firestore);
      
      // Delete the topic
      const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
      batch.delete(topicDocRef);
      
      // Find and delete all notes in that topic
      const notesQuery = query(notesRef, where('topicId', '==', topicId));
      const notesSnapshot = await require('firebase/firestore').getDocs(notesQuery);
      notesSnapshot.forEach(noteDoc => {
        batch.delete(noteDoc.ref);
      });
      
      await batch.commit();

      toast({ title: 'Topic Deleted', description: `Successfully deleted topic and its notes.` });
    } catch (error) {
        console.error("Error deleting topic: ", error);
        toast({ variant: 'destructive', title: 'Error Deleting Topic' });
    }
  };

  const addNote = async (note: NoteCreate) => {
    if (!notesRef) return;
    try {
      const content = note.type === 'code' ? `// Start writing your ${note.title} note here...` : `<p>Start writing your ${note.title} note here...</p>`;
      const docRef = await addDoc(notesRef, { 
        ...note, 
        content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveNoteId(docRef.id);
      toast({ title: 'Note Created', description: `Successfully created note: ${note.title}` });
    } catch (error) {
      console.error("Error adding note: ", error);
      toast({ variant: 'destructive', title: 'Error Creating Note' });
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;
    const noteDocRef = doc(firestore, 'users', user.uid, 'notes', noteId);
    try {
      await deleteDoc(noteDocRef);
      toast({ title: 'Note Deleted' });
    } catch (error) {
      console.error("Error deleting note: ", error);
      toast({ variant: 'destructive', title: 'Error Deleting Note' });
    }
  };

  const updateNote = async (noteId: string, data: NoteUpdate) => {
    if (!user) return;
    setIsSaving(true);
    const noteDocRef = doc(firestore, 'users', user.uid, 'notes', noteId);
    
    try {
      let finalData: NoteUpdate & { updatedAt: any; highlightedContent?: string; language?: string } = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      const noteToUpdate = notes.find(n => n.id === noteId);
      if (noteToUpdate && noteToUpdate.type === 'code' && data.content) {
        const { highlightedCode, language } = await getHighlightedCode(data.content);
        finalData.highlightedContent = highlightedCode;
        finalData.language = language;
      }

      await updateDoc(noteDocRef, finalData);
    } catch (error) {
      console.error("Error updating note: ", error);
      toast({ variant: 'destructive', title: 'Error Saving Note' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const activeNote = useMemo(() => {
    return notes.find(note => note.id === activeNoteId) || null;
  }, [activeNoteId, notes]);

  const activeTopic = useMemo(() => {
    return topics.find(topic => topic.id === activeTopicId) || null;
  }, [activeTopicId, topics]);

  const value = {
    topics,
    topicsLoading,
    notes,
    notesLoading,
    activeTopicId,
    activeTopic,
    setActiveTopicId,
    activeNoteId,
    setActiveNoteId,
    addTopic,
    updateTopic,
    deleteTopic,
    addNote,
    deleteNote,
    updateNote,
    activeNote,
    searchTerm,
    setSearchTerm,
    isDirty,
    setIsDirty,
    isSaving,
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
