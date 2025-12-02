export interface Note {
  id: string;
  topicId: string;
  title: string;
  type: 'code' | 'text';
  content: string;
  highlightedContent?: string;
  language?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type NoteCreate = Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'content'>;
export type NoteUpdate = Partial<Pick<Note, 'title' | 'content'>>;

export interface Topic {
  id: string;
  name: string;
  createdAt?: any; // Firestore Timestamp
}
