export interface Note {
  id: string;
  topicId: string;
  title: string;
  type: 'code' | 'text';
  content: string;
  highlightedContent?: string;
  language?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
}
