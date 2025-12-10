
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
  getDoc,
  collectionGroup,
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useStudyStats, StudySessionData } from '@/hooks/useStudyStats';
import { 
    getLocalTopics, 
    setLocalTopic, 
    deleteLocalTopic,
    getLocalNotesForTopic,
    setLocalNote,
    deleteLocalNote,
    getAllLocalNotes,
    addSyncTask,
    getSyncQueue,
    deleteSyncTask,
    type SyncTask
} from '@/lib/indexedDb';

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
  isOnline: boolean;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

/**
 * A utility function to create a new object without any `undefined` properties.
 * Firestore does not allow `undefined` values in documents.
 * @param obj The object to sanitize.
 * @returns A new object with `undefined` properties removed.
 */
function removeUndefined(obj: Record<string, any>): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}


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
  
  const [isOnline, setIsOnline] = useState(true);

  const studyStats = useStudyStats();

  const { pomodoro } = studyStats;
  
  // --- OFFLINE & SYNC LOGIC ---

  useEffect(() => {
    // Set initial online status
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const syncOfflineChanges = useCallback(async () => {
    if (!user || !firestore) return;
    
    const tasks = await getSyncQueue();
    if (tasks.length === 0) return;
    
    console.log(`Syncing ${tasks.length} offline changes...`);
    toast({ title: 'Syncing Data...', description: `Syncing ${tasks.length} offline changes.` });
    
    const batch = writeBatch(firestore);

    for (const task of tasks) {
        if (task.type === 'topic') {
            const { id: topicId, ...restPayload } = task.payload;
            const topicRef = doc(firestore, 'users', user.uid, 'topics', topicId);
            const sanitizedPayload = removeUndefined({ ...restPayload, userId: user.uid });
            if (task.action === 'add' || task.action === 'update') {
                batch.set(topicRef, sanitizedPayload, { merge: true });
            } else if (task.action === 'delete') {
                batch.delete(topicRef);
            }
        } else if (task.type === 'note') {
            const { id: noteId, topicId, ...restPayload } = task.payload;
            const noteRef = doc(firestore, 'users', user.uid, 'topics', topicId, 'notes', noteId);
            const sanitizedPayload = removeUndefined({ ...restPayload, userId: user.uid });
             if (task.action === 'add' || task.action === 'update') {
                batch.set(noteRef, sanitizedPayload, { merge: true });
            } else if (task.action === 'delete') {
                batch.delete(noteRef);
            }
        }
    }
    
    try {
        await batch.commit();
        // Clear queue after successful sync
        for (const task of tasks) {
            if (task.id) await deleteSyncTask(task.id);
        }
        toast({ title: 'Sync Complete!', description: 'Your data is up to date.' });
        console.log('Offline changes synced successfully.');
    } catch (error) {
        console.error("Error syncing offline changes: ", error);
        toast({ variant: 'destructive', title: 'Sync Failed', description: 'Could not sync all offline changes.' });
    }
  }, [user, firestore, toast]);

  useEffect(() => {
    if (isOnline) {
      syncOfflineChanges();
    }
  }, [isOnline, syncOfflineChanges]);
  
  // This effect runs once on startup to load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setTopicsLoading(true);
      setNotesLoading(true);
      const localTopics = await getLocalTopics();
      if (localTopics.length > 0) {
        setTopics(localTopics);
      }
      const localNotes = await getAllLocalNotes();
      if (localNotes.length > 0) {
        setNotes(localNotes);
      }
      setTopicsLoading(false);
      setNotesLoading(false);
    };
    loadInitialData();
  }, []);

  // --- REGULAR CONTEXT LOGIC ---

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
    if (!isOnline || !topicsRef) return;
    
    setTopicsLoading(true);
    const q = query(topicsRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedTopics: Topic[] = [];
      for (const doc of snapshot.docs) {
          const topic = { ...doc.data(), id: doc.id } as Topic;
          fetchedTopics.push(topic);
          await setLocalTopic(topic); // Update IndexedDB
      }
      setTopics(fetchedTopics);
      setTopicsLoading(false);
    }, (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicsRef.path, operation: 'list' }));
        setTopicsLoading(false);
    });
    return () => unsubscribe();
  }, [topicsRef, isOnline]);

  // Note listener
  useEffect(() => {
    if (!activeTopicId) {
        setNotes([]);
        setNotesLoading(false);
        return;
    }

    const loadNotes = async () => {
        setNotesLoading(true);
        const localNotes = await getLocalNotesForTopic(activeTopicId);
        setNotes(localNotes);
        setNotesLoading(false);
        
        if (isOnline && notesCollectionRef) {
            const q = query(notesCollectionRef, orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const fetchedNotes: Note[] = [];
                const deletePromises: Promise<void>[] = [];
                
                const remoteNoteIds = new Set(snapshot.docs.map(d => d.id));
                const localNotesForTopic = await getLocalNotesForTopic(activeTopicId);

                // Delete local notes that are no longer on the server
                for (const localNote of localNotesForTopic) {
                    if (!remoteNoteIds.has(localNote.id)) {
                        deletePromises.push(deleteLocalNote(localNote.id));
                    }
                }
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const note = {
                        ...data,
                        id: doc.id,
                        order: data.order ?? 0,
                        parentId: data.parentId ?? null,
                    } as Note;
                    fetchedNotes.push(note);
                    await setLocalNote(note); // Update IndexedDB
                }
                
                await Promise.all(deletePromises);
                
                setNotes(fetchedNotes);
                setNotesLoading(false);
            }, (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: notesCollectionRef.path, operation: 'list' }));
                setNotesLoading(false);
            });
            return () => unsubscribe();
        }
    };
    
    loadNotes();

  }, [activeTopicId, notesCollectionRef, isOnline]);

  // Todo listener
  useEffect(() => {
    if (!isOnline || !todosRef) return;
    
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
  }, [todosRef, isOnline]);

  const addTopic = async (name: string) => {
    if (!user) return;
    
    const tempId = `local_${Date.now()}`;
    const newTopic: Topic = { 
        id: tempId, 
        name, 
        userId: user.uid,
        createdAt: Timestamp.now()
    };
    
    setTopics(prev => [...prev, newTopic].sort((a,b) => a.name.localeCompare(b.name)));
    setActiveTopicId(tempId);
    await setLocalTopic(newTopic);
    
    if (isOnline && topicsRef) {
        const { id, ...payload } = newTopic;
        const finalPayload = { ...payload, createdAt: serverTimestamp() };

        addDoc(topicsRef, finalPayload)
          .catch(() => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicsRef.path, operation: 'create', requestResourceData: finalPayload }));
        });
    } else {
        await addSyncTask({ type: 'topic', action: 'add', payload: newTopic });
    }
  };

  const updateTopic = async (topicId: string, name: string) => {
    if (!user) return;

    const updatedTopic = topics.find(t => t.id === topicId);
    if (!updatedTopic) return;
    const finalTopic = { ...updatedTopic, name };
    
    setTopics(prev => prev.map(t => t.id === topicId ? finalTopic : t));
    await setLocalTopic(finalTopic);

    if (isOnline) {
        const topicDocRef = doc(firestore, 'users', user.uid, 'topics', topicId);
        updateDoc(topicDocRef, { name })
            .catch(() => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: topicDocRef.path, operation: 'update', requestResourceData: { name } }));
        });
    } else {
        await addSyncTask({ type: 'topic', action: 'update', payload: { id: topicId, name, userId: user.uid }});
    }
  };

  const deleteTopic = async (topicId: string) => {
    if (!user) return;
    
    setTopics(prev => prev.filter(t => t.id !== topicId));
    await deleteLocalTopic(topicId);
    // Also delete notes locally
    const localNotes = await getLocalNotesForTopic(topicId);
    for (const note of localNotes) {
        await deleteLocalNote(note.id);
    }

    if (isOnline && activeTopicId) {
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
    } else {
        await addSyncTask({type: 'topic', action: 'delete', payload: { id: topicId, userId: user.uid }});
    }
  };

  const addNote = async (note: NoteCreate) => {
    if (!user || !activeTopicId) return;

    const tempId = `local_${Date.now()}`;
    const content = note.type === 'folder' 
        ? ''
        : note.type === 'code'
            ? `// Start writing your ${note.title} note here...`
            : `<p>Start writing your ${note.title} note here...</p>`;

    const siblings = notes.filter(n => n.parentId === (note.parentId || null));
    const maxOrder = siblings.reduce((max, n) => Math.max(max, n.order || 0), -1);

    const newNoteData: any = {
        title: note.title,
        type: note.type,
        parentId: note.parentId || null,
        order: maxOrder + 1,
    };

    if (note.type === 'code') {
        newNoteData.language = note.language || 'plaintext';
    }
    
    const newNote: Note = {
        id: tempId,
        topicId: activeTopicId,
        userId: user.uid,
        content,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...newNoteData
    };

    setNotes(prev => [...prev, newNote]);
    await setLocalNote(newNote);
    if (newNote.type !== 'folder') {
        setActiveNoteId(tempId);
    }

    if (isOnline && notesCollectionRef) {
        const { id, ...payload } = newNote;
        const finalPayload = removeUndefined({ ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        
        addDoc(notesCollectionRef, finalPayload)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: notesCollectionRef.path, operation: 'create', requestResourceData: finalPayload }));
            });
    } else {
        await addSyncTask({ type: 'note', action: 'add', payload: newNote });
    }
  };
  
  const updateNote = useCallback(async (noteId: string, data: NoteUpdate) => {
    if (!user || !activeTopicId) return;
    setIsSaving(true);
    
    const existingNote = notes.find(n => n.id === noteId);
    if (!existingNote) { setIsSaving(false); return; }

    const updatedNote = { ...existingNote, ...data, updatedAt: Timestamp.now() } as Note;
    setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
    await setLocalNote(updatedNote);
    
    const finalData = removeUndefined({ ...data, updatedAt: serverTimestamp() });

    if (isOnline) {
        const noteDocRef = doc(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes', noteId);
        await updateDoc(noteDocRef, finalData)
            .catch(() => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: noteDocRef.path, operation: 'update', requestResourceData: finalData }));
                throw new Error("Update failed due to permissions");
            });
    } else {
        await addSyncTask({type: 'note', action: 'update', payload: { id: noteId, topicId: activeTopicId, userId: user.uid, ...finalData }})
    }
    
    setIsDirty(false);
    setIsSaving(false);

  }, [user, firestore, activeTopicId, isOnline, notes]);
  
  const deleteNote = async (noteId: string) => {
    if (!user || !activeTopicId) return;

    setNotes(prev => prev.filter(n => n.id !== noteId));
    await deleteLocalNote(noteId);
    if (activeNoteId === noteId) setActiveNoteId(null);
    
    if (isOnline) {
        const noteDocRef = doc(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes', noteId);
        await deleteDoc(noteDocRef).catch(() => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: noteDocRef.path, operation: 'delete' }));
        });
    } else {
        await addSyncTask({type: 'note', action: 'delete', payload: {id: noteId, topicId: activeTopicId, userId: user.uid }});
    }
  };

  const handleNoteDrop = useCallback(async (activeId: string, overId: string | null) => {
    // This function will now primarily work on local state and queue sync tasks.
    if(!user || !activeTopicId) return;

    const activeNote = notes.find(n => n.id === activeId);
    const overNote = overId ? notes.find(n => n.id === overId) : null;
    if (!activeNote || activeNote.id === overId) return;

    const newParentId = overNote ? (overNote.type !== 'folder' ? overNote.parentId : overId) : null;
    const siblings = notes.filter(n => (n.parentId || null) === newParentId && n.id !== activeId);
    let newOrder = siblings.length;

    if (overNote && overNote.type !== 'folder' && (overNote.parentId || null) === newParentId) {
        const overIndex = siblings.findIndex(n => n.id === overId);
        newOrder = overIndex !== -1 ? overIndex : siblings.length;
    }
    
    const reorderedSiblings = [...siblings];
    reorderedSiblings.splice(newOrder, 0, { ...activeNote, parentId: newParentId } as Note);

    const updates: { id: string; changes: Partial<Note> }[] = [];
    if (activeNote.parentId !== newParentId) {
        updates.push({ id: activeId, changes: { parentId: newParentId || null } });
    }
    
    reorderedSiblings.forEach((note, index) => {
        if (note.order !== index || note.id === activeId) {
            updates.push({ id: note.id, changes: { order: index } });
        }
    });

    if (activeNote.parentId !== newParentId) {
        const oldSiblings = notes.filter(n => (n.parentId || null) === (activeNote.parentId || null) && n.id !== activeId).sort((a, b) => (a.order || 0) - (b.order || 0));
        oldSiblings.forEach((note, index) => {
            if (note.order !== index) {
                updates.push({ id: note.id, changes: { order: index } });
            }
        });
    }

    // Apply updates locally
    setNotes(currentNotes => {
        const updatedNotes = [...currentNotes];
        updates.forEach(({ id, changes }) => {
            const noteIndex = updatedNotes.findIndex(n => n.id === id);
            if (noteIndex !== -1) {
                updatedNotes[noteIndex] = { ...updatedNotes[noteIndex], ...changes };
            }
        });
        return updatedNotes;
    });

    // Save to IndexedDB and queue sync tasks
    for (const { id, changes } of updates) {
        const noteToUpdate = notes.find(n => n.id === id);
        if (noteToUpdate) {
            const updatedLocalNote = { ...noteToUpdate, ...changes };
            await setLocalNote(updatedLocalNote);
            const finalChanges = removeUndefined(changes);

            if (isOnline) {
                 const noteRef = doc(firestore, 'users', user.uid, 'topics', activeTopicId, 'notes', id);
                 updateDoc(noteRef, finalChanges).catch(e => console.error("DnD sync error:", e));
            } else {
                await addSyncTask({ type: 'note', action: 'update', payload: { id, topicId: activeTopicId, userId: user.uid, ...finalChanges } });
            }
        }
    }
  }, [notes, isOnline, user, firestore, activeTopicId]);

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
    // Offline mode: get all notes from indexedDB
    if (!isOnline) {
        const allNotes = await getAllLocalNotes();
        const allTopics = await getLocalTopics();
        const topicMap = new Map(allTopics.map(t => [t.id, t.name]));
        return allNotes.map(n => ({...n, topicName: topicMap.get(n.topicId) || 'Unknown Topic'}));
    }
    
    // Online mode: fetch from firebase
    if (!user) return [];
    const allNotes: Note[] = [];
    const notesCollectionGroup = collectionGroup(firestore, 'notes');
    const q = query(notesCollectionGroup, where('userId', '==', user.uid));
    
    const notesSnapshot = await getDocs(q);
    notesSnapshot.forEach(doc => {
      // This is a simplified version, it doesn't include topicName.
      // A more robust implementation would fetch topics and map them.
      allNotes.push({ ...doc.data(), id: doc.id } as Note);
    });
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

  // To-Do Methods - These will not have offline support for now to keep the change focused.
  const addTodo = async (todo: TodoCreate) => {
    if (!todosRef || !user) return;
    const newTodoData: any = {
        content: todo.content,
        userId: user.uid,
        isCompleted: false,
        createdAt: serverTimestamp(),
        completedAt: null
    };

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

  const value: NotesContextType = {
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
    isOnline,
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

    