
export interface Note {
  id: string;
  topicId: string;
  title: string;
  type: 'code' | 'text' | 'folder';
  content: string;
  language?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  topicName?: string; 
  parentId?: string | null;
  order: number;
}

export type NoteCreate = { 
  title: string, 
  type: 'code' | 'text' | 'folder',
  parentId?: string | null,
  language?: string,
};
export type NoteUpdate = Partial<Pick<Note, 'title' | 'content' | 'language' | 'order' | 'parentId'>>;

export interface Topic {
  id: string;
  name: string;
  createdAt?: any; // Firestore Timestamp
}

export interface Todo {
    id: string;
    userId: string;
    content: string;
    isCompleted: boolean;
    dueDate?: string; // YYYY-MM-DD
    topicId?: string;
    noteId?: string;
    createdAt: any; // Firestore Timestamp
    completedAt?: any | null; // Firestore Timestamp
}

export type TodoCreate = {
    content: string;
    dueDate?: string;
};

export type TodoUpdate = Partial<Pick<Todo, 'content' | 'isCompleted' | 'dueDate'>>;
