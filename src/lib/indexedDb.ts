
'use client';

import { openDB, IDBPDatabase } from 'idb';
import type { Topic, Note } from './types';

const DB_NAME = 'CodeNoteDB';
const DB_VERSION = 1;
const TOPICS_STORE = 'topics';
const NOTES_STORE = 'notes';
const SYNC_QUEUE_STORE = 'sync-queue';

export interface SyncTask {
  id?: number;
  type: 'topic' | 'note';
  action: 'add' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(TOPICS_STORE)) {
          db.createObjectStore(TOPICS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
          notesStore.createIndex('by-topic', 'topicId');
        }
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { autoIncrement: true, keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Generic store operations
export const getFromStore = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const db = await getDb();
  return db.get(storeName, key);
};

export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await getDb();
  return db.getAll(storeName);
};

export const setInStore = async <T>(storeName: string, value: T): Promise<IDBValidKey> => {
  const db = await getDb();
  return db.put(storeName, value);
};

export const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  const db = await getDb();
  return db.delete(storeName, key);
};

// Specific functions for Topics
export const getLocalTopics = () => getAllFromStore<Topic>(TOPICS_STORE);
export const setLocalTopic = (topic: Topic) => setInStore(TOPICS_STORE, topic);
export const deleteLocalTopic = (topicId: string) => deleteFromStore(TOPICS_STORE, topicId);

// Specific functions for Notes
export const getLocalNotesForTopic = async (topicId: string): Promise<Note[]> => {
  const db = await getDb();
  return db.getAllFromIndex(NOTES_STORE, 'by-topic', topicId);
};
export const getLocalNote = (noteId: string) => getFromStore<Note>(NOTES_STORE, noteId);
export const setLocalNote = (note: Note) => setInStore(NOTES_STORE, note);
export const deleteLocalNote = (noteId: string) => deleteFromStore(NOTES_STORE, noteId);
export const getAllLocalNotes = () => getAllFromStore<Note>(NOTES_STORE);


// Sync Queue operations
export const addSyncTask = (task: Omit<SyncTask, 'timestamp'>) => {
    const fullTask: Omit<SyncTask, 'id'> = { ...task, timestamp: Date.now() };
    return setInStore(SYNC_QUEUE_STORE, fullTask);
};
export const getSyncQueue = () => getAllFromStore<SyncTask>(SYNC_QUEUE_STORE);
export const deleteSyncTask = (taskId: number) => deleteFromStore(SYNC_QUEUE_STORE, taskId);
export const clearSyncQueue = async () => {
    const db = await getDb();
    return db.clear(SYNC_QUEUE_STORE);
}
