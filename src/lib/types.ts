export interface Note {
  id: string;
  topicId: string;
  title: string;
  type: 'code' | 'text';
  content: string;
  language?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  // This can be optionally added when fetching notes for export
  topicName?: string; 
  parentId?: string | null;
}

export type NoteCreate = { 
  title: string, 
  type: 'code' | 'text',
  parentId?: string | null 
};
export type NoteUpdate = Partial<Pick<Note, 'title' | 'content' | 'language'>>;

export interface Topic {
  id: string;
  name: string;
  createdAt?: any; // Firestore Timestamp
}
