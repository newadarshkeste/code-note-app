'use client';

import React from 'react';
import ReactQuill from 'react-quill';
import { useTheme } from 'next-themes';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 
  'blockquote', 'code-block',
  'list', 'bullet',
  'link',
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const { theme } = useTheme();

  return (
    <div className="h-full w-full rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder="Start writing your text note..."
      />
    </div>
  );
}
