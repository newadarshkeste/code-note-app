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
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { getHighlightedCode } from '@/app/actions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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
  addNote: (note: Omit<NoteCreate, 'topicId'>) => Promise<void>;
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
  
  // Memoize the reference to the notes subcollection for the active topic.
  const notesCollectionRef = useMemo(() => {
    if (user && activeTopicId) {
      return collection(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes');
    }
    return null;
  }, [user, firestore, activeTopicId]);


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
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: topicsRef.path,
            operation: 'list',
        }));
        setTopicsLoading(false);
    });

    return () => unsubscribe();
  }, [topicsRef, activeTopicId]);

  // Fetch notes for the active topic
  useEffect(() => {
    if (!notesCollectionRef) {
        setNotes([]);
        setNotesLoading(false);
        return;
    }
    setNotesLoading(true);
    const q = query(notesCollectionRef, orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Note));
      setNotes(fetchedNotes);
      setNotesLoading(false);
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: notesCollectionRef.path,
            operation: 'list',
        }));
        setNotesLoading(false);
    });

    return () => unsubscribe();

  }, [notesCollectionRef]);

  // Reset active note if topic changes
  useEffect(() => {
    setActiveNoteId(null);
  }, [activeTopicId]);

  const addTopic = async (name: string) => {
    if (!topicsRef || !user) return;
    const newTopicData = { name, createdAt: serverTimestamp(), userId: user.uid };
    addDoc(topicsRef, newTopicData)
      .then(docRef => {
        setActiveTopicId(docRef.id);
        toast({ title: 'Topic Created', description: `Successfully created topic: ${name}` });
      })
      .catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: topicsRef.path,
            operation: 'create',
            requestResourceData: newTopicData
        }));
      });
  };

  const updateTopic = async (topicId: string, name: string) => {
    if (!user) return;
    const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
    const updatedData = { name };
    updateDoc(topicDocRef, updatedData)
        .then(() => {
            toast({ title: 'Topic Renamed', description: `Topic has been renamed to: ${name}` });
        })
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: topicDocRef.path,
                operation: 'update',
                requestResourceData: updatedData
            }));
        });
  };

  const deleteTopic = async (topicId: string) => {
    if (!user) return;
    
    const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
    const notesInTopicRef = collection(firestore, 'users', user.uid, 'topics', topicId, 'notes');

    // Get all notes in the topic to delete them in a batch
    getDocs(notesInTopicRef).then(notesSnapshot => {
        const batch = writeBatch(firestore);
        
        // Delete the topic itself
        batch.delete(topicDocRef);

        // Delete all notes within the topic
        notesSnapshot.forEach(noteDoc => {
            batch.delete(noteDoc.ref);
        });

        return batch.commit();
    })
    .then(() => {
        toast({ title: 'Topic Deleted', description: `Successfully deleted topic and its notes.` });
    })
    .catch((error) => {
        // This could fail on the getDocs or the commit.
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: topicDocRef.path,
            operation: 'delete',
        }));
    });
  };

  const addNote = async (note: Omit<NoteCreate, 'topicId'>) => {
    if (!notesCollectionRef || !user || !activeTopicId) return;
    const content = note.type === 'code' ? `// Start writing your ${note.title} note here...` : `<p>Start writing your ${note.title} note here...</p>`;
    const newNoteData = { 
        ...note, 
        topicId: activeTopicId, // Add the active topicId
        content,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    addDoc(notesCollectionRef, newNoteData)
        .then(docRef => {
            setActiveNoteId(docRef.id);
            toast({ title: 'Note Created', description: `Successfully created note: ${note.title}` });
        })
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: notesCollectionRef.path,
                operation: 'create',
                requestResourceData: newNoteData
            }));
        });
  };

  const deleteNote = async (noteId: string) => {
    if (!notesCollectionRef) return;
    const noteDocRef = doc(notesCollectionRef, noteId);
    deleteDoc(noteDocRef)
        .then(() => {
            toast({ title: 'Note Deleted' });
        })
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: noteDocRef.path,
                operation: 'delete',
            }));
        });
  };

  const updateNote = async (noteId: string, data: NoteUpdate) => {
    if (!notesCollectionRef) return;
    setIsSaving(true);
    const noteDocRef = doc(notesCollectionRef, noteId);
    
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

    updateDoc(noteDocRef, finalData)
        .then(() => {
            // Success
        })
        .catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: noteDocRef.path,
                operation: 'update',
                requestResourceData: finalData
            }));
            // Re-throw to inform the caller the save failed
            throw new Error("Update failed due to permissions");
        })
        .finally(() => {
            setIsSaving(false);
        });
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
