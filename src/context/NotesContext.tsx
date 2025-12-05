
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
  handleNoteDrop: (activeId: string, overId: string | null) => Promise<void>;
  activeNote: Note | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  isSaving: boolean;
  getAllNotes: () => Promise<Note[]>;
  getSubNotes: (parentId: string | null) => Note[];
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
        // Do not auto-select a topic if one isn't already selected, this causes issues on mobile.
        // setActiveTopicId(fetchedTopics[0].id); 
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
    
    // Sort by 'order' which was added for drag-and-drop.
    // We will handle legacy notes without 'order' in the getSubNotes function.
    const q = query(notesCollectionRef, orderBy('order', 'asc'));
    
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
    const noteToSelect = notes.find(n => n.type !== 'folder');
    if (!activeNoteId && noteToSelect && notes.length > 0) {
      // setActiveNoteId(noteToSelect.id);
    } else if (notes.length === 0 || !notes.some(n => n.type !== 'folder')) {
      setActiveNoteId(null);
    }
    setIsDirty(false);
  }, [activeTopicId, notes, activeNoteId]);


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
    
    let content = '';
    if (note.type === 'code') {
      content = `// Start writing your ${note.title} note here...`;
    } else if (note.type === 'text') {
      content = `<p>Start writing your ${note.title} note here...</p>`;
    }
    
    const siblings = notes.filter(n => n.parentId === (note.parentId || null));
    const maxOrder = siblings.reduce((max, n) => Math.max(max, n.order || 0), -1);

    const newNoteData: any = { 
        title: note.title,
        type: note.type,
        topicId: activeTopicId,
        content,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        parentId: note.parentId || null,
        order: maxOrder + 1,
    };

    if (note.type === 'code') {
        newNoteData.language = note.language || 'plaintext';
    }

    addDoc(notesCollectionRef, newNoteData)
        .then(docRef => {
            if (newNoteData.type !== 'folder') {
                setActiveNoteId(docRef.id);
            }
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

  const handleNoteDrop = useCallback(async (activeId: string, overId: string | null) => {
    if (!notesCollectionRef) return;

    const activeNote = notes.find(n => n.id === activeId);
    const overNote = overId ? notes.find(n => n.id === overId) : null;

    if (!activeNote || activeNote.id === overId) return;

    const batch = writeBatch(firestore);
    const activeNoteRef = doc(notesCollectionRef, activeId);

    // Case 1: Dropping a note INTO a folder
    if (overNote && overNote.type === 'folder' && activeNote.parentId !== overNote.id) {
        const newSiblings = notes.filter(n => n.parentId === overNote.id);
        const newOrder = newSiblings.length;
        
        batch.update(activeNoteRef, { parentId: overNote.id, order: newOrder });

        // Re-order the old siblings
        const oldSiblings = notes
            .filter(n => n.parentId === activeNote.parentId && n.id !== activeNote.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        oldSiblings.forEach((note, index) => {
            if (note.order !== index) {
                const noteRef = doc(notesCollectionRef, note.id);
                batch.update(noteRef, { order: index });
            }
        });
    } else { // Case 2: Reordering notes
        const newParentId = overNote ? overNote.parentId : null;
        let newItems = notes.filter(n => n.parentId === newParentId);

        const activeIndex = notes.findIndex(n => n.id === activeId);
        const overIndex = overId ? notes.findIndex(n => n.id === overId) : newItems.length;

        // If changing parent
        if (activeNote.parentId !== newParentId) {
            batch.update(activeNoteRef, { parentId: newParentId });
            
            // Re-order old siblings
            const oldSiblings = notes
                .filter(n => n.parentId === activeNote.parentId && n.id !== activeNote.id)
                .sort((a,b) => (a.order || 0)- (b.order || 0));
            oldSiblings.forEach((note, index) => {
                if (note.order !== index) {
                    const noteRef = doc(notesCollectionRef, note.id);
                    batch.update(noteRef, { order: index });
                }
            });
        }
        
        const localItems = notes.filter(n => (n.parentId || null) === (overNote ? (overNote.parentId || null) : null));
        const localActiveIndex = localItems.findIndex(i => i.id === activeId);
        const localOverIndex = overId ? localItems.findIndex(i => i.id === overId) : localItems.length;
        
        if(localActiveIndex !== -1){
            const [movedItem] = localItems.splice(localActiveIndex, 1);
            localItems.splice(localOverIndex > localActiveIndex ? localOverIndex -1 : localOverIndex, 0, movedItem);
        } else {
             // Item is new to this context
            localItems.splice(localOverIndex, 0, {...activeNote, parentId: newParentId});
        }


        localItems.forEach((note, index) => {
            if (note.order !== index || note.id === activeId) { // always update moved item
                const noteRef = doc(notesCollectionRef, note.id);
                batch.update(noteRef, { order: index, parentId: newParentId || null });
            }
        });
    }

    try {
        await batch.commit();
    } catch (e) {
        console.error("Failed to reorder notes:", e);
        toast({ variant: 'destructive', title: "Error", description: "Could not save new note order." });
    }

  }, [notes, notesCollectionRef, firestore, toast]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    const note = notes.find(note => note.id === activeNoteId);
    return note && note.type !== 'folder' ? note : null;
  }, [activeNoteId, notes]);
  

  const activeTopic = useMemo(() => {
    return topics.find(topic => topic.id === activeTopicId) || null;
  }, [activeTopicId, topics]);
  
  const getSubNotes = useCallback((parentId: string | null) => {
    return notes
      .filter(note => (note.parentId || null) === (parentId || null))
      // FIX: Gracefully handle notes without an 'order' field by treating it as 0.
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
  }, [activeNote, isDirty, dirtyNoteContent, updateNote, studyStats, toast]);

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
    handleNoteDrop,
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

    

    