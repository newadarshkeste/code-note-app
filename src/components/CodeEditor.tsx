'use client';

import React from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Skeleton } from './ui/skeleton';

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange: OnChange;
}

export function CodeEditor({ language, value, onChange }: CodeEditorProps) {
  const { theme } = useTheme();

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      loading={<Skeleton className="h-full w-full" />}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        automaticLayout: true,
        wordWrap: 'on',
      }}
    />
  );
}
