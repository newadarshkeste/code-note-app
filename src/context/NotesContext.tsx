

'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { Topic, Note, NoteUpdate, NoteCreate, Todo, TodoCreate, TodoUpdate } from '@/lib/types';
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
  Timestamp,
  setDoc,
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
  todos: Todo[];
  todosLoading: boolean;
  addTodo: (todo: TodoCreate) => Promise<void>;
  updateTodo: (todoId: string, data: TodoUpdate) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyNoteContent, setDirtyNoteContent] = useState<DirtyNoteContent | null>(null);
  const { toast } = useToast();

  const studyStats = useStudyStats();

  const { pomodoro } = studyStats;

  // This is the core timer logic, now living in the provider that never unmounts.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoro.isActive && pomodoro.timeLeft > 0) {
      interval = setInterval(() => {
        pomodoro.setTimeLeft(time => time - 1);
        if (pomodoro.mode === 'focus') {
          pomodoro.setSessionMinutes(s => s + 1 / 60);
        }
      }, 1000);
    } else if (pomodoro.isActive && pomodoro.timeLeft <= 0) {
      if (pomodoro.mode === 'focus') {
        pomodoro.onPomodoroComplete();
        const newCycleCount = pomodoro.pomodoroCycleCount + 1;
        pomodoro.setPomodoroCycleCount(newCycleCount);

        if (newCycleCount % pomodoro.pomodorosPerCycle === 0) {
          pomodoro.setMode('longBreak');
          pomodoro.setTimeLeft(pomodoro.longBreakDuration * 60);
        } else {
          pomodoro.setMode('break');
          pomodoro.setTimeLeft(pomodoro.breakDuration * 60);
        }
      } else {
        pomodoro.setMode('focus');
        pomodoro.setTimeLeft(pomodoro.focusDuration * 60);
        pomodoro.setSessionMinutes(0);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro]);

  const topicsRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'topics') : null, [user, firestore]);
  const todosRef = useMemo(() => user ? collection(firestore, 'users', user.uid, 'todos') : null, [user, firestore]);
  
  const notesCollectionRef = useMemo(() => {
    if (user && activeTopicId) {
      return collection(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes');
    }
    return null;
  }, [user, firestore, activeTopicId]);

  // Topic listener
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
        // Do not auto-select
      } else if (fetchedTopics.length === 0) {
        setActiveTopicId(null);
      }
      setTopicsLoading(false);
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicsRef.path, operation: 'list' }));
        setTopicsLoading(false);
    });
    return () => unsubscribe();
  }, [topicsRef, activeTopicId]);

  // Note listener
  useEffect(() => {
    if (!notesCollectionRef) {
        setNotes([]);
        setNotesLoading(false);
        return;
    }
    setNotesLoading(true);
    
    const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            order: data.order ?? 0,
            parentId: data.parentId ?? null,
        } as Note;
      });
      setNotes(fetchedNotes);
      setNotesLoading(false);
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: notesCollectionRef.path, operation: 'list' }));
        setNotesLoading(false);
    });

    return () => unsubscribe();

  }, [notesCollectionRef]);

  // Todo listener
  useEffect(() => {
    if (!todosRef) {
        setTodos([]);
        setTodosLoading(false);
        return;
    }
    setTodosLoading(true);
    const q = query(todosRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTodos = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                dueDate: data.dueDate,
                createdAt: data.createdAt,
                completedAt: data.completedAt,
            } as Todo;
        });
        setTodos(fetchedTodos);
        setTodosLoading(false);
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: todosRef.path, operation: 'list'}));
        setTodosLoading(false);
    });

    return () => unsubscribe();
  }, [todosRef]);


  useEffect(() => {
    const noteToSelect = notes.find(n => n.type !== 'folder');
    if (!activeNoteId && noteToSelect && notes.length > 0) {
      // setActiveNoteId(noteToSelect.id);
    } else if (notes.length === 0 || !notes.some(n => n.type !== 'folder')) {
      setActiveNoteId(null);
    }
    setIsDirty(false);
  }, [activeTopicId, notes]);


  const addTopic = async (name: string) => {
    if (!topicsRef || !user) return;
    const newTopicData = { name, createdAt: serverTimestamp(), userId: user.uid };
    addDoc(topicsRef, newTopicData)
      .then(docRef => { setActiveTopicId(docRef.id); })
      .catch(() => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicsRef.path, operation: 'create', requestResourceData: newTopicData }));
      });
  };

  const updateTopic = async (topicId: string, name: string) => {
    if (!user) return;
    const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
    const updatedData = { name };
    updateDoc(topicDocRef, updatedData)
        .catch(() => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicDocRef.path, operation: 'update', requestResourceData: updatedData }));
        });
  };

  const deleteTopic = async (topicId: string) => {
    if (!user) return;
    
    const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
    const notesInTopicRef = collection(firestore, 'users', user.uid, 'topics', topicId, 'notes');

    getDocs(notesInTopicRef).then(notesSnapshot => {
        const batch = writeBatch(firestore);
        batch.delete(topicDocRef);
        notesSnapshot.forEach(noteDoc => { batch.delete(noteDoc.ref); });
        return batch.commit();
    })
    .catch((error) => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicDocRef.path, operation: 'delete' }));
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
        .then(docRef => { if (newNoteData.type !== 'folder') { setActiveNoteId(docRef.id); }})
        .catch(() => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: notesCollectionRef.path, operation: 'create', requestResourceData: newNoteData }));
        });
  };

  const updateNote = useCallback(async (noteId: string, data: NoteUpdate) => {
    if (!user || !activeTopicId) return;
    const noteDocRef = doc(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes', noteId);
    setIsSaving(true);
    let finalData: NoteUpdate & { updatedAt: any } = { ...data, updatedAt: serverTimestamp() };
    try {
        await updateDoc(noteDocRef, finalData);
        setIsDirty(false);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: noteDocRef.path, operation: 'update', requestResourceData: finalData }));
        throw new Error("Update failed due to permissions");
    } finally {
        setIsSaving(false);
    }
  }, [user, firestore, activeTopicId]);

  const deleteNote = async (noteId: string) => {
    if (!notesCollectionRef) return;
    const batch = writeBatch(firestore);
    const noteDocRef = doc(notesCollectionRef, noteId);
    batch.delete(noteDocRef);
    const subNotesQuery = query(notesCollectionRef, where('parentId', '==', noteId));
    try {
        const subNotesSnapshot = await getDocs(subNotesQuery);
        subNotesSnapshot.forEach(subNoteDoc => { batch.delete(subNoteDoc.ref); });
        await batch.commit();
        if (activeNoteId === noteId) { setActiveNoteId(null); }
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: noteDocRef.path, operation: 'delete' }));
    }
  };

  const handleNoteDrop = useCallback(async (activeId: string, overId: string | null) => {
    if (!notesCollectionRef) return;

    const activeNote = notes.find(n => n.id === activeId);
    const overNote = overId ? notes.find(n => n.id === overId) : null;
    if (!activeNote || activeNote.id === overId) return;

    const batch = writeBatch(firestore);
    const activeNoteRef = doc(notesCollectionRef, activeId);

    // This is the new, simplified logic for reparenting and reordering.
    const newParentId = overNote ? (overNote.type !== 'folder' ? overNote.parentId : overId) : null;
    const newSiblings = notes.filter(n => (n.parentId || null) === newParentId && n.id !== activeId);

    // Determine the new order.
    let newOrder;
    if (overNote && overNote.type !== 'folder' && (overNote.parentId || null) === newParentId) {
        // Dropped on an item, figure out if it's before or after.
        const overIndex = newSiblings.findIndex(n => n.id === overId);
        newOrder = overIndex !== -1 ? overIndex : newSiblings.length;
    } else {
        // Dropped on a folder or in empty space, add to the end.
        newOrder = newSiblings.length;
    }
    
    // Create a new array with the moved item.
    const reorderedSiblings = [...newSiblings];
    reorderedSiblings.splice(newOrder, 0, { ...activeNote, parentId: newParentId } as Note);

    // Update parentId and order for all affected notes in the batch.
    batch.update(activeNoteRef, { parentId: newParentId || null });
    reorderedSiblings.forEach((note, index) => {
        if (note.order !== index || note.id === activeId) {
            const noteRef = doc(notesCollectionRef, note.id);
            batch.update(noteRef, { order: index });
        }
    });

    // If the original parent container is now different, we also need to re-order those items.
    if (activeNote.parentId !== newParentId) {
        const oldSiblings = notes.filter(n => (n.parentId || null) === (activeNote.parentId || null) && n.id !== activeId).sort((a, b) => (a.order || 0) - (b.order || 0));
        oldSiblings.forEach((note, index) => {
            if (note.order !== index) {
                const noteRef = doc(notesCollectionRef, note.id);
                batch.update(noteRef, { order: index });
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
    return notes.find(note => note.id === activeNoteId) || null;
  }, [activeNoteId, notes]);

  const activeTopic = useMemo(() => {
    return topics.find(topic => topic.id === activeTopicId) || null;
  }, [activeTopicId, topics]);
  
  const getSubNotes = useCallback((parentId: string | null) => {
    return notes.filter(note => (note.parentId || null) === (parentId || null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
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
      const sessionData: StudySessionData = { sessionMinutes: studyStats.pomodoro.sessionMinutes, linesTyped: charsChanged, topicId: activeNote.topicId };
      studyStats.updateStudyStatsOnNoteSave(sessionData);
      toast({ title: 'Note Saved!', description: `"${dirtyNoteContent.title}" has been saved successfully.` });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error Saving Note', description: 'Could not save the note.' });
    }
  }, [activeNote, isDirty, dirtyNoteContent, updateNote, studyStats, toast]);

  // To-Do Methods
  const addTodo = async (todo: TodoCreate) => {
    if (!todosRef || !user) return;
    const newTodoData: any = {
        content: todo.content,
        userId: user.uid,
        isCompleted: false,
        createdAt: serverTimestamp(),
        completedAt: null
    };

    // This is the fix: only add dueDate if it's defined.
    if (todo.dueDate) {
        newTodoData.dueDate = todo.dueDate;
    }

    addDoc(todosRef, newTodoData).catch(() => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: todosRef.path,
            operation: 'create',
            requestResourceData: newTodoData,
        }));
    });
  };

  const updateTodo = async (todoId: string, data: TodoUpdate) => {
      if (!todosRef) return;
      const todoDocRef = doc(todosRef, todoId);
      const finalData: any = { ...data };
      if (data.isCompleted !== undefined) {
          finalData.completedAt = data.isCompleted ? serverTimestamp() : null;
      }
      updateDoc(todoDocRef, finalData).catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: todoDocRef.path,
              operation: 'update',
              requestResourceData: finalData,
          }));
      });
  };

  const deleteTodo = async (todoId: string) => {
      if (!todosRef) return;
      const todoDocRef = doc(todosRef, todoId);
      deleteDoc(todoDocRef).catch(() => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: todoDocRef.path,
              operation: 'delete',
          }));
      });
  };

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
    todos,
    todosLoading,
    addTodo,
    updateTodo,
    deleteTodo,
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
