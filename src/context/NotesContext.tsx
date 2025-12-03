
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
  writeBatch,
  getDocs,
  where,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useStudyStats, StudySessionData } from '@/hooks/useStudyStats';

interface DirtyNoteContent {
    title: string;
    content: string;
    language?: string;
}

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
  getAllNotes: () => Promise<Note[]>;
  getSubNotes: (parentId: string) => Note[];
  dirtyNoteContent: DirtyNoteContent | null;
  setDirtyNoteContent: React.Dispatch<React.SetStateAction<DirtyNoteContent | null>>;
  saveActiveNote: () => Promise<void>;
  studyStats: ReturnType<typeof useStudyStats>;
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
  const [dirtyNoteContent, setDirtyNoteContent] = useState<DirtyNoteContent | null>(null);
  const { toast } = useToast();

  const studyStats = useStudyStats();

  const topicsRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'topics') : null, [user, firestore]);
  
  const notesCollectionRef = useMemo(() => {
    if (user && activeTopicId) {
      return collection(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes');
    }
    return null;
  }, [user, firestore, activeTopicId]);

  const updateNote = useCallback(async (noteId: string, data: NoteUpdate) => {
    if (!user || !activeTopicId) return;
    const noteDocRef = doc(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes', noteId);
    
    setIsSaving(true);
    
    let finalData: NoteUpdate & { updatedAt: any } = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    try {
        await updateDoc(noteDocRef, finalData);
        setIsDirty(false);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: noteDocRef.path,
            operation: 'update',
            requestResourceData: finalData
        }));
        throw new Error("Update failed due to permissions");
    } finally {
        setIsSaving(false);
    }
  }, [user, firestore, activeTopicId]);

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

  useEffect(() => {
    if (!notesCollectionRef) {
        setNotes([]);
        setNotesLoading(false);
        return;
    }
    setNotesLoading(true);
    const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
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

  useEffect(() => {
    setActiveNoteId(null);
    setIsDirty(false); // Reset dirty state when topic changes
  }, [activeTopicId]);

  const addTopic = async (name: string) => {
    if (!topicsRef || !user) return;
    const newTopicData = { name, createdAt: serverTimestamp(), userId: user.uid };
    addDoc(topicsRef, newTopicData)
      .then(docRef => {
        setActiveTopicId(docRef.id);
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

    getDocs(notesInTopicRef).then(notesSnapshot => {
        const batch = writeBatch(firestore);
        
        batch.delete(topicDocRef);

        notesSnapshot.forEach(noteDoc => {
            batch.delete(noteDoc.ref);
        });

        return batch.commit();
    })
    .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: topicDocRef.path,
            operation: 'delete',
        }));
    });
  };

  const addNote = async (note: NoteCreate) => {
    if (!notesCollectionRef || !user || !activeTopicId) return;
    const content = note.type === 'code' ? `// Start writing your ${note.title} note here...` : `<p>Start writing your ${note.title} note here...</p>`;
    
    const newNoteData: any = { 
        ...note, 
        topicId: activeTopicId,
        content,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        language: note.language || (note.type === 'code' ? 'plaintext' : undefined),
        parentId: note.parentId || null,
    };

    addDoc(notesCollectionRef, newNoteData)
        .then(docRef => {
            setActiveNoteId(docRef.id);
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

    const batch = writeBatch(firestore);

    const noteDocRef = doc(notesCollectionRef, noteId);
    batch.delete(noteDocRef);

    const subNotesQuery = query(notesCollectionRef, where('parentId', '==', noteId));
    
    try {
        const subNotesSnapshot = await getDocs(subNotesQuery);
        subNotesSnapshot.forEach(subNoteDoc => {
            batch.delete(subNoteDoc.ref);
        });

        await batch.commit();

        if (activeNoteId === noteId) {
          setActiveNoteId(null);
        }

    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: noteDocRef.path,
            operation: 'delete',
        }));
    }
  };

  const activeNote = useMemo(() => {
    return notes.find(note => note.id === activeNoteId) || null;
  }, [activeNoteId, notes]);

  const activeTopic = useMemo(() => {
    return topics.find(topic => topic.id === activeTopicId) || null;
  }, [activeTopicId, topics]);
  
  const getSubNotes = useCallback((parentId: string) => {
    return notes.filter(note => note.parentId === parentId).sort((a,b) => a.createdAt > b.createdAt ? 1 : -1);
  }, [notes]);

  const getAllNotes = async (): Promise<Note[]> => {
    if (!user) return [];
    
    const allNotes: Note[] = [];
    for (const topic of topics) {
      const notesRef = collection(firestore, 'users', user.uid, 'topics', topic.id, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      const notesSnapshot = await getDocs(q);
      notesSnapshot.forEach(doc => {
        allNotes.push({ ...doc.data(), id: doc.id, topicName: topic.name } as Note);
      });
    }
    return allNotes;
  };

  const saveActiveNote = useCallback(async () => {
    if (!activeNote || !isDirty || !dirtyNoteContent) return;
    
    const originalContent = activeNote.content;
    const newContent = dirtyNoteContent.content;
    const charsChanged = Math.abs(newContent.length - originalContent.length);

    try {
      await updateNote(activeNote.id, { 
          title: dirtyNoteContent.title, 
          content: dirtyNoteContent.content,
          language: dirtyNoteContent.language || 'plaintext' 
      });
      
      const sessionData: StudySessionData = {
          sessionMinutes: studyStats.pomodoro.sessionMinutes,
          linesTyped: charsChanged,
          topicId: activeNote.topicId
      };
      studyStats.updateStudyStatsOnNoteSave(sessionData);

      toast({
        title: 'Note Saved!',
        description: `"${dirtyNoteContent.title}" has been saved successfully.`,
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error Saving Note',
        description: 'Could not save the note.',
      });
    }
  }, [activeNote, isDirty, dirtyNoteContent, updateNote, studyStats]);

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
    getAllNotes,
    getSubNotes,
    dirtyNoteContent,
    setDirtyNoteContent,
    saveActiveNote,
    studyStats,
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

    