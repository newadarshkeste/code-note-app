'use client';

import React, { useEffect } from 'react';
import Editor, { OnChange, loader } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { Skeleton } from './ui/skeleton';

// We only need to define the theme once.
let nightOwlThemeDefined = false;

interface CodeEditorProps {
  language?: string;
  value: string;
  onChange?: OnChange;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export function CodeEditor({ language, value, onChange, options }: CodeEditorProps) {
  const { theme } = useTheme();

  useEffect(() => {
    // This code will only run on the client side.
    if (!nightOwlThemeDefined) {
      loader.init().then((monaco) => {
        try {
          const nightOwlTheme = require('monaco-themes/themes/Night Owl.json');
          monaco.editor.defineTheme('night-owl', nightOwlTheme);
          nightOwlThemeDefined = true;
        } catch (error) {
          console.error("Failed to load Monaco theme:", error);
        }
      });
    }
  }, []);

  const finalTheme = theme === 'dark' ? 'night-owl' : 'light';

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
