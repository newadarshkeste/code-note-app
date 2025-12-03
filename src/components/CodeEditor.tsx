'use client';

import React from 'react';
import Editor, { OnChange, loader } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Skeleton } from './ui/skeleton';

// Set default theme to vs-dark-plus
loader.init().then((monaco) => {
  import('monaco-themes/themes/vs-dark-plus.json')
    .then(data => {
      monaco.editor.defineTheme('vs-dark-plus', data as any);
      // We don't need to set it here, just define it.
      // The component's `theme` prop will handle selection.
    });
});


interface CodeEditorProps {
  language?: string;
  value: string;
  onChange?: OnChange;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export function CodeEditor({ language, value, onChange, options }: CodeEditorProps) {
  const { theme } = useTheme();

  const finalTheme = theme === 'dark' ? 'vs-dark-plus' : 'light';

  const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    automaticLayout: true,
    wordWrap: 'on',
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      theme={finalTheme}
      loading={<Skeleton className="h-full w-full" />}
      options={{ ...defaultOptions, ...options }}
    />
  );
}
